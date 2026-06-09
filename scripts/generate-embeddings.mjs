// scripts/generate-embeddings.mjs
// Backfill embeddings for all entries that don't have one yet.
//
// Node 20.6+:  node --env-file=.env.local scripts/generate-embeddings.mjs
// Node 18.x:   node --experimental-env-file=.env.local scripts/generate-embeddings.mjs

import { createClient } from "@supabase/supabase-js";

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const DELAY_MS = 200; // ~300 RPM, well within OpenAI tier-1 rate limits

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, "").trim();
}

function buildEmbeddingText(entry) {
  const parts = [entry.date];
  if (entry.title) parts.push(entry.title);
  const plain = stripHtml(entry.body);
  if (plain) parts.push(plain);
  return parts.join("\n");
}

async function generateEmbedding(text) {
  const res = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.data[0].embedding;
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: entries, error } = await supabase
    .from("entries")
    .select("id, date, title, body")
    .is("embedding", null);

  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }

  console.log(`Wpisy bez embeddingu: ${entries.length}`);

  let ok = 0;
  let fail = 0;

  for (const entry of entries) {
    try {
      const embedding = await generateEmbedding(buildEmbeddingText(entry));
      const { error: upd } = await supabase
        .from("entries")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", entry.id);
      if (upd) throw new Error(upd.message);
      console.log(`  [OK] ${entry.date} — ${entry.id}`);
      ok++;
    } catch (err) {
      console.error(`  [ERR] ${entry.date} — ${entry.id}: ${err.message}`);
      fail++;
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`\nGotowe: ${ok} OK, ${fail} błędy`);
}

main();
