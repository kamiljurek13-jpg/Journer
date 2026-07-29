import { randomUUID } from "crypto";
import { after } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase-admin";
import { buildSystemPrompt } from "@/lib/chatSystemPrompt";
import { runAgentLoop, MOOD_LABELS } from "@/lib/chat-agent";
import { todayString } from "@/lib/dates";
import { generateEmbedding, buildEmbeddingText } from "@/lib/embeddings";
import {
  findEntryByUserAndDate,
  createStrapiEntry,
  updateStrapiEntry,
  listRecentEntries,
  searchEntriesFullText,
  findEntriesByStrapiIds,
  getEntryForAgent,
  type StrapiEntry,
} from "@/lib/strapi-entries";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type Entry = StrapiEntry;

type OpSuccess<T> = { data: T };
type OpError = { error: string; status: number };
type OpResult<T> = OpSuccess<T> | OpError;

export type SearchSource = "vector" | "text" | "recent";
export type SearchResultEntry = {
  id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number | null;
  sources: SearchSource[];
};

function recentCutoffDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split("T")[0];
}

// Reciprocal Rank Fusion: score(d) = sum over legs containing d of 1/(k + rank).
// k=60 is the standard smoothing constant (used by Elasticsearch/Azure AI Search)
// — it flattens the gap between rank 1 and rank 2 so one leg's top hit can't
// dominate an entry that ranks solidly across multiple legs.
const RRF_K = 60;

function rrfRankMap(ids: string[]): Map<string, number> {
  const ranks = new Map<string, number>();
  ids.forEach((id, index) => {
    if (!ranks.has(id)) ranks.set(id, index + 1); // 1-indexed; first occurrence wins
  });
  return ranks;
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
          .then((r) => (r.data ?? []) as Array<{ strapi_entry_id: string; date: string; mood: number | null }>)
      : Promise.resolve([] as Array<{ strapi_entry_id: string; date: string; mood: number | null }>),

    searchEntriesFullText(userId, trimmedQuery, 30).catch(() => []),

    listRecentEntries(userId, recentCutoffDate()).catch(() => [] as StrapiEntry[]),
  ]);

  const resultMap = new Map<string, SearchResultEntry>();

  const addEntries = (
    rows: Array<{ id: string; date: string; title?: string | null; body?: string; mood: number | null }>,
    source: SearchSource
  ) => {
    for (const row of rows) {
      const existing = resultMap.get(row.id);
      if (existing) {
        if (!existing.sources.includes(source)) existing.sources.push(source);
      } else {
        resultMap.set(row.id, {
          id: row.id,
          date: row.date,
          title: row.title ?? null,
          body: row.body ?? "",
          mood: row.mood,
          sources: [source],
        });
      }
    }
  };

  // Text and recent legs carry full title/body from Strapi — add them first.
  // The vector leg (Supabase) only carries strapi_entry_id/date/mood, so it must
  // go last: an entry it "confirms" that's already in the map keeps the real
  // content already set by text/recent, and only genuinely vector-only matches
  // are inserted without content (hydrated below).
  addEntries(
    textRows.map((r) => ({ id: r.strapi_entry_id, date: r.date, title: r.title, body: r.body, mood: r.mood })),
    "text"
  );
  addEntries(
    recentRows.map((r) => ({ id: r.id, date: r.date, title: r.title, body: r.body, mood: r.mood })),
    "recent"
  );
  addEntries(
    vectorRows.map((r) => ({ id: r.strapi_entry_id, date: r.date, mood: r.mood })),
    "vector"
  );

  const needsHydration = Array.from(resultMap.values())
    .filter((r) => r.sources.length === 1 && r.sources[0] === "vector")
    .map((r) => r.id);

  if (needsHydration.length > 0) {
    const hydrated = await findEntriesByStrapiIds(needsHydration).catch(() => [] as StrapiEntry[]);
    for (const entry of hydrated) {
      const existing = resultMap.get(entry.id);
      if (existing) {
        existing.title = entry.title;
        existing.body = entry.body;
      }
    }
  }

  const vectorRanks = rrfRankMap(vectorRows.map((r) => r.strapi_entry_id));
  const textRanks = rrfRankMap(textRows.map((r) => r.strapi_entry_id));
  const recentRanks = rrfRankMap(recentRows.map((r) => r.id));

  const rrfScore = (id: string): number => {
    const contribution = (rank: number | undefined) => (rank === undefined ? 0 : 1 / (RRF_K + rank));
    return contribution(vectorRanks.get(id)) + contribution(textRanks.get(id)) + contribution(recentRanks.get(id));
  };

  const results = Array.from(resultMap.values()).sort((a, b) => {
    const scoreDiff = rrfScore(b.id) - rrfScore(a.id);
    if (scoreDiff !== 0) return scoreDiff;
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

  let existing: StrapiEntry | null;
  try {
    existing = await findEntryByUserAndDate(userId, date);
  } catch {
    return { error: "Failed to fetch entry", status: 500 };
  }

  if (existing) {
    const patch: { title?: string | null; body?: string; mood?: number } = {};
    if (title !== null) patch.title = title;
    if (entryBody !== "") patch.body = entryBody;
    if (mood !== undefined) patch.mood = mood;

    let updated: StrapiEntry;
    try {
      updated = await updateStrapiEntry(existing.id, patch);
    } catch {
      return { error: "Failed to update entry", status: 500 };
    }

    after(async () => {
      const text = buildEmbeddingText({ date: updated.date, title: updated.title, body: updated.body });
      const embedding = await generateEmbedding(text);
      if (!embedding) return;
      const admin = createAdminClient();
      await admin
        .from("entries")
        .update({
          title: updated.title,
          body: updated.body,
          mood: updated.mood,
          strapi_entry_id: updated.id,
          embedding: JSON.stringify(embedding),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("date", date);
    });

    return { data: { entry: updated, created: false } };
  }

  let created: StrapiEntry;
  try {
    created = await createStrapiEntry({ userId, date, title, body: entryBody, mood: mood ?? null });
  } catch {
    return { error: "Failed to create entry", status: 500 };
  }

  after(async () => {
    const text = buildEmbeddingText({ date: created.date, title: created.title, body: created.body });
    const embedding = await generateEmbedding(text);
    if (!embedding) return;
    const admin = createAdminClient();
    await admin.from("entries").insert({
      id: randomUUID(),
      user_id: userId,
      date,
      title: created.title,
      body: created.body,
      mood: created.mood,
      strapi_entry_id: created.id,
      embedding: JSON.stringify(embedding),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  return { data: { entry: created, created: true } };
}

export async function getEntry(
  userId: string,
  date: string
): Promise<OpResult<{ entry: Entry | null }>> {
  if (!DATE_REGEX.test(date)) {
    return { error: "Invalid date format. Use YYYY-MM-DD.", status: 400 };
  }

  try {
    const entry = await findEntryByUserAndDate(userId, date);
    return { data: { entry } };
  } catch {
    return { error: "Failed to fetch entry", status: 500 };
  }
}

export function buildSearchContext(
  results: SearchResultEntry[],
  excludeDate?: string
): string {
  const top = results.filter((r) => r.date !== excludeDate).slice(0, 5);
  if (top.length === 0) return "";
  return top
    .map((r) => {
      const body = (r.body ?? "")
        .replace(/<[^>]+>/g, "")
        .trim()
        .slice(0, 400);
      const moodLine = r.mood !== null ? `Mood: ${MOOD_LABELS[r.mood] ?? String(r.mood)} (${r.mood}/5)` : null;
      return [`### ${r.date}${r.title ? ` — ${r.title}` : ""}`, moodLine, body || "(No content)"]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
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

  let entry: StrapiEntry | null;
  try {
    entry = await findEntryByUserAndDate(userId, date);
  } catch {
    return { error: "Failed to fetch entry", status: 500 };
  }
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
    .order("created_at", { ascending: true });

  const history: Anthropic.MessageParam[] = (historyRows ?? []).map((row) => ({
    role: row.role as "user" | "assistant",
    content: row.content as string,
  }));

  const plainText = (entry.body ?? "").replace(/<[^>]+>/g, "").trim();

  const searchResult = await hybridSearch(userId, message).catch(() => null);
  const searchContext =
    searchResult && "data" in searchResult
      ? buildSearchContext(searchResult.data.results, entry.date)
      : undefined;

  const systemPrompt = buildSystemPrompt({
    date: entry.date,
    title: entry.title ?? undefined,
    plainText,
    mood: entry.mood,
    searchContext: searchContext || undefined,
  });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

  const answer = await runAgentLoop({
    messages: [...history, { role: "user", content: message }],
    systemPrompt,
    anthropic,
    fetchEntry: (targetDate: string) => getEntryForAgent(userId, targetDate),
  });

  await admin.from("chat_messages").insert([
    { user_id: userId, role: "user", content: message },
    { user_id: userId, role: "assistant", content: answer },
  ]);

  return { data: { answer } };
}
