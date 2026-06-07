import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase-admin";
import { validatePAT } from "@/lib/api-auth";
import { todayString } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function rowToEntry(row: {
  id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    date: row.date,
    title: row.title ?? null,
    body: row.body,
    mood: row.mood,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function POST(request: Request) {
  const userId = await validatePAT(request.headers.get("authorization"));
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const date: string = typeof body.date === "string" ? body.date : todayString();
  const title: string | null = typeof body.title === "string" ? body.title : null;
  const entryBody: string = typeof body.body === "string" ? body.body : "";
  const mood: number | undefined =
    typeof body.mood === "number" ? body.mood : undefined;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "Invalid date format. Use YYYY-MM-DD." }, 400);
  }
  if (mood !== undefined && (mood < 1 || mood > 5 || !Number.isInteger(mood))) {
    return json({ error: "mood must be an integer between 1 and 5" }, 400);
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== null) patch.title = title;
    if (entryBody !== "") patch.body = entryBody;
    if (mood !== undefined) patch.mood = mood;

    const { data, error } = await admin
      .from("entries")
      .update(patch)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return json({ error: "Failed to update entry" }, 500);
    return json({ entry: rowToEntry(data) });
  }

  if (mood === undefined) {
    return json({ error: "mood is required when creating a new entry" }, 400);
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("entries")
    .insert({
      id: randomUUID(),
      user_id: userId,
      date,
      title,
      body: entryBody,
      mood,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) return json({ error: "Failed to create entry" }, 500);
  return json({ entry: rowToEntry(data) }, 201);
}
