import { randomUUID } from "crypto";
import { after } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase-admin";
import { buildSystemPrompt } from "@/lib/chatSystemPrompt";
import { runAgentLoop, MOOD_LABELS } from "@/lib/chat-agent";
import { todayString } from "@/lib/dates";
import { generateEmbedding, buildEmbeddingText } from "@/lib/embeddings";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type Entry = {
  id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number;
  createdAt: string;
  updatedAt: string;
};

type OpSuccess<T> = { data: T };
type OpError = { error: string; status: number };
type OpResult<T> = OpSuccess<T> | OpError;

export type SearchSource = "vector" | "text" | "recent";
export type SearchResultEntry = {
  id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number;
  sources: SearchSource[];
};

function rowToEntry(row: {
  id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number;
  created_at: string;
  updated_at: string;
}): Entry {
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

function recentCutoffDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split("T")[0];
}

export async function hybridSearch(
  userId: string,
  query: string
): Promise<OpResult<{ results: SearchResultEntry[] }>> {
  if (!query || query.trim().length === 0) {
    return { error: "query is required", status: 400 };
  }

  const admin = createAdminClient();
  const trimmedQuery = query.trim();

  const embeddingVector = await generateEmbedding(trimmedQuery);

  const [vectorRows, textRows, recentRows] = await Promise.all([
    embeddingVector
      ? admin
          .rpc("match_entries_by_vector", {
            query_embedding: JSON.stringify(embeddingVector),
            user_id_param: userId,
            match_count: 30,
          })
          .then((r) => (r.data ?? []) as Array<{ id: string; date: string; title: string | null; body: string; mood: number }>)
      : Promise.resolve([] as Array<{ id: string; date: string; title: string | null; body: string; mood: number }>),

    admin
      .rpc("match_entries_by_text", {
        query_text: trimmedQuery,
        user_id_param: userId,
        match_count: 30,
      })
      .then((r) => (r.data ?? []) as Array<{ id: string; date: string; title: string | null; body: string; mood: number }>),

    admin
      .from("entries")
      .select("id, date, title, body, mood")
      .eq("user_id", userId)
      .gte("date", recentCutoffDate())
      .order("date", { ascending: false })
      .then((r) => (r.data ?? []) as Array<{ id: string; date: string; title: string | null; body: string; mood: number }>),
  ]);

  const resultMap = new Map<string, SearchResultEntry>();

  const addEntries = (
    rows: Array<{ id: string; date: string; title: string | null; body: string; mood: number }>,
    source: SearchSource
  ) => {
    for (const row of rows) {
      const existing = resultMap.get(row.id);
      if (existing) {
        if (!existing.sources.includes(source)) existing.sources.push(source);
      } else {
        resultMap.set(row.id, { id: row.id, date: row.date, title: row.title ?? null, body: row.body, mood: row.mood, sources: [source] });
      }
    }
  };

  addEntries(vectorRows, "vector");
  addEntries(textRows, "text");
  addEntries(recentRows, "recent");

  const results = Array.from(resultMap.values()).sort((a, b) => {
    if (b.sources.length !== a.sources.length) return b.sources.length - a.sources.length;
    return b.date.localeCompare(a.date);
  });

  return { data: { results } };
}

export async function createOrUpdateEntry(
  userId: string,
  input: { date?: unknown; mood?: unknown; title?: unknown; body?: unknown }
): Promise<OpResult<{ entry: Entry; created: boolean }>> {
  const date = typeof input.date === "string" ? input.date : todayString();
  const title = typeof input.title === "string" ? input.title : null;
  const entryBody = typeof input.body === "string" ? input.body : "";
  const mood = typeof input.mood === "number" ? input.mood : undefined;

  if (!DATE_REGEX.test(date)) {
    return { error: "Invalid date format. Use YYYY-MM-DD.", status: 400 };
  }
  if (mood !== undefined && (mood < 1 || mood > 5 || !Number.isInteger(mood))) {
    return { error: "mood must be an integer between 1 and 5", status: 400 };
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

    if (error) return { error: "Failed to update entry", status: 500 };
    after(async () => {
      const text = buildEmbeddingText({ date: data.date, title: data.title ?? null, body: data.body });
      const embedding = await generateEmbedding(text);
      if (!embedding) return;
      await admin.from("entries").update({ embedding: JSON.stringify(embedding) }).eq("id", data.id);
    });
    return { data: { entry: rowToEntry(data), created: false } };
  }

  if (mood === undefined) {
    return { error: "mood is required when creating a new entry", status: 400 };
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

  if (error) return { error: "Failed to create entry", status: 500 };
  after(async () => {
    const text = buildEmbeddingText({ date: data.date, title: data.title ?? null, body: data.body });
    const embedding = await generateEmbedding(text);
    if (!embedding) return;
    await admin.from("entries").update({ embedding: JSON.stringify(embedding) }).eq("id", data.id);
  });
  return { data: { entry: rowToEntry(data), created: true } };
}

export async function getEntry(
  userId: string,
  date: string
): Promise<OpResult<{ entry: Entry | null }>> {
  if (!DATE_REGEX.test(date)) {
    return { error: "Invalid date format. Use YYYY-MM-DD.", status: 400 };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) return { error: "Failed to fetch entry", status: 500 };
  return { data: { entry: data ? rowToEntry(data) : null } };
}

export async function askAgent(
  userId: string,
  input: { message: unknown; date?: unknown }
): Promise<OpResult<{ answer: string }>> {
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const date = typeof input.date === "string" ? input.date : todayString();

  if (!message) return { error: "message is required", status: 400 };
  if (!DATE_REGEX.test(date)) {
    return { error: "Invalid date format. Use YYYY-MM-DD.", status: 400 };
  }

  const admin = createAdminClient();

  const { data: entry, error: entryError } = await admin
    .from("entries")
    .select("id, date, title, body, mood")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (entryError) return { error: "Failed to fetch entry", status: 500 };
  if (!entry) {
    return {
      error: `No entry found for ${date}. Create an entry first using POST /api/v1/entries.`,
      status: 404,
    };
  }

  const { data: historyRows } = await admin
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", userId)
    .eq("entry_id", entry.id)
    .order("created_at", { ascending: true });

  const history: Anthropic.MessageParam[] = (historyRows ?? []).map((row) => ({
    role: row.role as "user" | "assistant",
    content: row.content as string,
  }));

  const plainText = ((entry.body as string) ?? "").replace(/<[^>]+>/g, "").trim();
  const systemPrompt = buildSystemPrompt({
    date: entry.date as string,
    title: (entry.title as string | null) ?? undefined,
    plainText,
    mood: entry.mood as number,
  });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

  const answer = await runAgentLoop({
    messages: [...history, { role: "user", content: message }],
    systemPrompt,
    anthropic,
    fetchEntry: async (targetDate: string) => {
      const { data: targetEntry } = await admin
        .from("entries")
        .select("date, title, body, mood")
        .eq("user_id", userId)
        .eq("date", targetDate)
        .maybeSingle();

      if (!targetEntry) return `No entry found for ${targetDate}.`;

      const bodyText = ((targetEntry.body as string) ?? "").replace(/<[^>]+>/g, "").trim();
      const moodLabel = MOOD_LABELS[targetEntry.mood as number] ?? String(targetEntry.mood);
      return [
        `Entry for ${targetEntry.date}:`,
        targetEntry.title ? `Title: ${targetEntry.title}` : null,
        `Mood: ${moodLabel} (${targetEntry.mood}/5)`,
        "Content:",
        bodyText || "(No content)",
      ]
        .filter(Boolean)
        .join("\n");
    },
  });

  await admin.from("chat_messages").insert([
    { user_id: userId, entry_id: entry.id, role: "user", content: message },
    { user_id: userId, entry_id: entry.id, role: "assistant", content: answer },
  ]);

  return { data: { answer } };
}
