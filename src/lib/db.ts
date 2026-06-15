import { supabase } from "./supabase";
import type { Entry, Mood } from "@/types/entry";

type DbRow = {
  id: string;
  user_id: string;
  date: string;
  title: string | null;
  body: string;
  mood: number;
  created_at: string;
  updated_at: string;
};

function rowToEntry(row: DbRow): Entry {
  return {
    id: row.id,
    date: row.date,
    title: row.title ?? undefined,
    body: row.body,
    mood: row.mood as Mood,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function fetchAllEntries(): Promise<Entry[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data as DbRow[]).map(rowToEntry);
}

export async function createEntry(entry: Entry): Promise<Entry> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("entries")
    .insert({
      id: entry.id,
      user_id: userId,
      date: entry.date,
      title: entry.title ?? null,
      body: entry.body,
      mood: entry.mood,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToEntry(data as DbRow);
}

export async function updateEntry(
  id: string,
  patch: Partial<Entry>
): Promise<Entry> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("entries")
    .update({
      title: patch.title ?? null,
      body: patch.body,
      mood: patch.mood,
      updated_at: patch.updatedAt,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return rowToEntry(data as DbRow);
}
