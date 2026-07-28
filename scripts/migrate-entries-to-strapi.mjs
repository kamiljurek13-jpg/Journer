// scripts/migrate-entries-to-strapi.mjs
// One-time migration: copy every Supabase `entries` row (title/body/date/mood)
// into Strapi, then link it back via entries.strapi_entry_id. Existing
// embeddings are carried over unchanged (no re-embedding — content isn't
// changing, only where it's stored).
//
// Idempotent/resumable: rows that already have strapi_entry_id set are
// skipped, so a crash mid-run can just be re-run. Progress is also logged to
// an NDJSON file for a durable record of what happened.
//
// Node 20.6+:  node --env-file=.env.local scripts/migrate-entries-to-strapi.mjs
// Node 18.x:   node --experimental-env-file=.env.local scripts/migrate-entries-to-strapi.mjs

import { createClient } from "@supabase/supabase-js";
import { Client as PgClient } from "pg";
import { appendFileSync } from "fs";

const LOG_PATH = "scripts/migrate-entries-to-strapi.log.ndjson";

function log(entry) {
  appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
}

async function createStrapiEntry({ baseUrl, token, entry }) {
  const res = await fetch(`${baseUrl}/api/entries`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        user_id: entry.user_id,
        date: entry.date,
        title: entry.title,
        body: entry.body,
        mood: entry.mood,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Strapi ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.data.documentId;
}

async function main() {
  const strapiBaseUrl = process.env.STRAPI_API_URL;
  const strapiToken = process.env.STRAPI_API_TOKEN;
  if (!strapiBaseUrl || !strapiToken) {
    console.error("STRAPI_API_URL and STRAPI_API_TOKEN are required.");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const pg = new PgClient({
    connectionString: process.env.STRAPI_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();

  const { data: entries, error } = await supabase
    .from("entries")
    .select("id, user_id, date, title, body, mood, created_at, updated_at")
    .is("strapi_entry_id", null)
    .order("user_id", { ascending: true })
    .order("date", { ascending: true });

  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }

  console.log(`Entries to migrate: ${entries.length}`);
  log({ event: "start", count: entries.length });

  let ok = 0;
  let fail = 0;

  for (const entry of entries) {
    try {
      const documentId = await createStrapiEntry({ baseUrl: strapiBaseUrl, token: strapiToken, entry });

      // Strapi's normal create endpoint doesn't accept caller-supplied
      // createdAt/updatedAt — backfill true chronological history directly.
      await pg.query(
        `update entries set created_at = $1, updated_at = $2 where document_id = $3`,
        [entry.created_at, entry.updated_at, documentId]
      );

      const { error: updErr } = await supabase
        .from("entries")
        .update({ strapi_entry_id: documentId })
        .eq("id", entry.id);
      if (updErr) throw new Error(`strapi_entry_id backfill: ${updErr.message}`);

      console.log(`  [OK] ${entry.user_id} ${entry.date} -> ${documentId}`);
      log({ event: "migrated", supabase_id: entry.id, user_id: entry.user_id, date: entry.date, strapi_entry_id: documentId });
      ok++;
    } catch (err) {
      console.error(`  [ERR] ${entry.user_id} ${entry.date}: ${err.message}`);
      log({ event: "error", supabase_id: entry.id, user_id: entry.user_id, date: entry.date, message: err.message });
      fail++;
    }
  }

  await pg.end();

  console.log(`\nDone: ${ok} OK, ${fail} errors`);
  log({ event: "finish", ok, fail });

  if (fail > 0) process.exit(1);
}

main();
