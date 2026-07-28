import { strapiFetch } from "./strapi";
import { MOOD_LABELS } from "./chat-agent";

type StrapiEntryRecord = {
  documentId: string;
  user_id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number;
  createdAt: string;
  updatedAt: string;
};

export type StrapiEntry = {
  id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number;
  createdAt: string;
  updatedAt: string;
};

export type SearchResultRow = {
  strapi_entry_id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number;
};

function toStrapiEntry(record: StrapiEntryRecord): StrapiEntry {
  return {
    id: record.documentId,
    date: record.date,
    title: record.title ?? null,
    body: record.body,
    mood: record.mood,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function findEntryByUserAndDate(
  userId: string,
  date: string
): Promise<StrapiEntry | null> {
  const params = new URLSearchParams({
    "filters[user_id][$eq]": userId,
    "filters[date][$eq]": date,
  });
  const res = await strapiFetch<{ data: StrapiEntryRecord[] }>(`/api/entries?${params}`);
  const record = res.data[0];
  return record ? toStrapiEntry(record) : null;
}

export async function listAllEntries(userId: string): Promise<StrapiEntry[]> {
  const pageSize = 100;
  let page = 1;
  const all: StrapiEntry[] = [];

  while (true) {
    const params = new URLSearchParams({
      "filters[user_id][$eq]": userId,
      sort: "date:desc",
      "pagination[page]": String(page),
      "pagination[pageSize]": String(pageSize),
    });
    const res = await strapiFetch<{
      data: StrapiEntryRecord[];
      meta: { pagination: { pageCount: number } };
    }>(`/api/entries?${params}`);

    all.push(...res.data.map(toStrapiEntry));
    if (page >= res.meta.pagination.pageCount) break;
    page += 1;
  }

  return all;
}

export async function createStrapiEntry(input: {
  userId: string;
  date: string;
  title: string | null;
  body: string;
  mood: number;
}): Promise<StrapiEntry> {
  const res = await strapiFetch<{ data: StrapiEntryRecord }>("/api/entries", {
    method: "POST",
    body: JSON.stringify({
      data: {
        user_id: input.userId,
        date: input.date,
        title: input.title,
        body: input.body,
        mood: input.mood,
      },
    }),
  });
  return toStrapiEntry(res.data);
}

export async function updateStrapiEntry(
  documentId: string,
  patch: Partial<{ title: string | null; body: string; mood: number }>
): Promise<StrapiEntry> {
  const res = await strapiFetch<{ data: StrapiEntryRecord }>(`/api/entries/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: patch }),
  });
  return toStrapiEntry(res.data);
}

export async function listRecentEntries(
  userId: string,
  sinceDate: string
): Promise<StrapiEntry[]> {
  const params = new URLSearchParams({
    "filters[user_id][$eq]": userId,
    "filters[date][$gte]": sinceDate,
    sort: "date:desc",
    "pagination[limit]": "100",
  });
  const res = await strapiFetch<{ data: StrapiEntryRecord[] }>(`/api/entries?${params}`);
  return res.data.map(toStrapiEntry);
}

export async function searchEntriesFullText(
  userId: string,
  query: string,
  limit = 30
): Promise<SearchResultRow[]> {
  const params = new URLSearchParams({ user_id: userId, query, limit: String(limit) });
  const res = await strapiFetch<{ results: SearchResultRow[] }>(`/api/entry-search?${params}`);
  return res.results;
}

export async function findEntriesByStrapiIds(documentIds: string[]): Promise<StrapiEntry[]> {
  if (documentIds.length === 0) return [];
  const params = new URLSearchParams();
  documentIds.forEach((id, i) => params.append(`filters[documentId][$in][${i}]`, id));
  const res = await strapiFetch<{ data: StrapiEntryRecord[] }>(`/api/entries?${params}`);
  return res.data.map(toStrapiEntry);
}

/**
 * Shared "fetch one entry for an agent tool call" helper — consolidates what
 * used to be three separate implementations (askAgent's fetchEntry closure,
 * MCP's get_entry, and /api/chat's inline duplicate).
 */
export async function getEntryForAgent(userId: string, date: string): Promise<string> {
  const entry = await findEntryByUserAndDate(userId, date);
  if (!entry) return `No entry found for ${date}.`;

  const bodyText = (entry.body ?? "").replace(/<[^>]+>/g, "").trim();
  const moodLabel = MOOD_LABELS[entry.mood] ?? String(entry.mood);
  return [
    `Entry for ${entry.date}:`,
    entry.title ? `Title: ${entry.title}` : null,
    `Mood: ${moodLabel} (${entry.mood}/5)`,
    "Content:",
    bodyText || "(No content)",
  ]
    .filter(Boolean)
    .join("\n");
}
