import { strapiFetch } from "./strapi";
import { MOOD_LABELS } from "./chat-agent";

// photos is intentionally omitted from StrapiEntry (the public shape) — nothing
// outside the photo-specific functions below needs to know an entry has photos.
// It still exists on every raw Strapi response though, since Strapi returns all
// attributes by default; the photo functions read it straight off this internal
// record type instead of going through toStrapiEntry().
type StrapiEntryRecord = {
  documentId: string;
  user_id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number | null;
  photos: string[] | null;
  createdAt: string;
  updatedAt: string;
};

export type StrapiEntry = {
  id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number | null;
  createdAt: string;
  updatedAt: string;
};

export type SearchResultRow = {
  strapi_entry_id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number | null;
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

async function findRawEntryByUserAndDate(
  userId: string,
  date: string
): Promise<StrapiEntryRecord | null> {
  const params = new URLSearchParams({
    "filters[user_id][$eq]": userId,
    "filters[date][$eq]": date,
  });
  const res = await strapiFetch<{ data: StrapiEntryRecord[] }>(`/api/entries?${params}`);
  return res.data[0] ?? null;
}

export async function findEntryByUserAndDate(
  userId: string,
  date: string
): Promise<StrapiEntry | null> {
  const record = await findRawEntryByUserAndDate(userId, date);
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
  mood: number | null;
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
  patch: Partial<{ title: string | null; body: string; mood: number | null }>
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
  const moodLine =
    entry.mood !== null ? `Mood: ${MOOD_LABELS[entry.mood] ?? String(entry.mood)} (${entry.mood}/5)` : null;
  return [
    `Entry for ${entry.date}:`,
    entry.title ? `Title: ${entry.title}` : null,
    moodLine,
    "Content:",
    bodyText || "(No content)",
  ]
    .filter(Boolean)
    .join("\n");
}

// --- Photo links -----------------------------------------------------------
// Files live in Supabase Storage; Strapi's `photos` field holds only the
// stable storage paths (never signed URLs, which expire in 1h). A photo can
// be the first thing a user adds for a date, so these functions find-or-create
// the entry themselves rather than assuming one already exists.

export async function getPhotosForEntry(userId: string, date: string): Promise<string[]> {
  const record = await findRawEntryByUserAndDate(userId, date);
  return record?.photos ?? [];
}

export async function addPhotoToEntry(
  userId: string,
  date: string,
  storagePath: string
): Promise<string[]> {
  const record = await findRawEntryByUserAndDate(userId, date);

  if (!record) {
    const res = await strapiFetch<{ data: StrapiEntryRecord }>("/api/entries", {
      method: "POST",
      body: JSON.stringify({
        data: { user_id: userId, date, title: null, body: "", mood: null, photos: [storagePath] },
      }),
    });
    return res.data.photos ?? [storagePath];
  }

  const photos = [...(record.photos ?? []), storagePath];
  const res = await strapiFetch<{ data: StrapiEntryRecord }>(`/api/entries/${record.documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: { photos } }),
  });
  return res.data.photos ?? photos;
}

export async function removePhotoFromEntry(
  userId: string,
  date: string,
  storagePath: string
): Promise<string[]> {
  const record = await findRawEntryByUserAndDate(userId, date);
  if (!record) return [];

  const photos = (record.photos ?? []).filter((p) => p !== storagePath);
  const res = await strapiFetch<{ data: StrapiEntryRecord }>(`/api/entries/${record.documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: { photos } }),
  });
  return res.data.photos ?? photos;
}
