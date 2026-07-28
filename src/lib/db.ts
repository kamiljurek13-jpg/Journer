import { supabase } from "./supabase";
import type { Entry, Mood } from "@/types/entry";

type ApiEntry = {
  id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number;
  createdAt: string;
  updatedAt: string;
};

function toEntry(row: ApiEntry): Entry {
  return {
    id: row.id,
    date: row.date,
    title: row.title ?? undefined,
    body: row.body,
    mood: row.mood as Mood,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

export async function fetchAllEntries(): Promise<Entry[]> {
  const accessToken = await getAccessToken();
  const res = await fetch("/api/entries", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch entries");
  const { entries } = (await res.json()) as { entries: ApiEntry[] };
  return entries.map(toEntry);
}

/**
 * Creates or updates the entry for `input.date` — the server decides which,
 * mirroring the existing PAT-authenticated /api/v1/entries POST behavior.
 */
export async function saveEntryApi(input: {
  date: string;
  title?: string;
  body: string;
  mood: number;
}): Promise<Entry> {
  const accessToken = await getAccessToken();
  const res = await fetch("/api/entries", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to save entry");
  const { entry } = (await res.json()) as { entry: ApiEntry };
  return toEntry(entry);
}
