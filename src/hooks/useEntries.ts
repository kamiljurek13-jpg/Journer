"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { fetchAllEntries, createEntry, updateEntry } from "@/lib/db";
import { todayString } from "@/lib/dates";
import type { Entry, Mood } from "@/types/entry";

type SavePayload = Omit<Entry, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

interface UseEntriesReturn {
  entries: Entry[];
  loading: boolean;
  error: string | null;
  getTodayEntry: () => Entry | undefined;
  getEntryById: (id: string) => Entry | undefined;
  saveEntry: (data: SavePayload) => Promise<void>;
}

export function useEntries(): UseEntriesReturn {
  const [entries, setEntriesState] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllEntries()
      .then(setEntriesState)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  function getTodayEntry(): Entry | undefined {
    return entries.find((e) => e.date === todayString());
  }

  function getEntryById(id: string): Entry | undefined {
    return entries.find((e) => e.id === id);
  }

  async function saveEntry(data: SavePayload): Promise<void> {
    const now = new Date().toISOString();
    if (data.id) {
      const updated = await updateEntry(data.id, {
        title: data.title,
        body: data.body,
        mood: data.mood,
        updatedAt: now,
      });
      setEntriesState((prev) =>
        prev.map((e) => (e.id === data.id ? updated : e))
      );
    } else {
      const newEntry: Entry = {
        id: uuidv4(),
        date: data.date,
        title: data.title,
        body: data.body,
        mood: data.mood as Mood,
        createdAt: now,
        updatedAt: now,
      };
      const saved = await createEntry(newEntry);
      setEntriesState((prev) => [...prev, saved]);
    }
  }

  return { entries, loading, error, getTodayEntry, getEntryById, saveEntry };
}
