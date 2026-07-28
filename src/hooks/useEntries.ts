"use client";

import { useState, useEffect } from "react";
import { fetchAllEntries, saveEntryApi } from "@/lib/db";
import { todayString } from "@/lib/dates";
import type { Entry } from "@/types/entry";

type SavePayload = Omit<Entry, "id" | "createdAt" | "updatedAt">;

interface UseEntriesReturn {
  entries: Entry[];
  loading: boolean;
  error: string | null;
  getTodayEntry: () => Entry | undefined;
  getEntryByDate: (date: string) => Entry | undefined;
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

  function getEntryByDate(date: string): Entry | undefined {
    return entries.find((e) => e.date === date);
  }

  async function saveEntry(data: SavePayload): Promise<void> {
    const saved = await saveEntryApi({
      date: data.date,
      title: data.title,
      body: data.body,
      mood: data.mood,
    });
    setEntriesState((prev) => {
      const idx = prev.findIndex((e) => e.date === data.date);
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  }

  return { entries, loading, error, getTodayEntry, getEntryByDate, saveEntry };
}
