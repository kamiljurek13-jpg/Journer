"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { getEntries, setEntries } from "@/lib/storage";
import { todayString } from "@/lib/dates";
import type { Entry, Mood } from "@/types/entry";

type SavePayload = Omit<Entry, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

interface UseEntriesReturn {
  entries: Entry[];
  getTodayEntry: () => Entry | undefined;
  getEntryById: (id: string) => Entry | undefined;
  saveEntry: (data: SavePayload) => void;
}

export function useEntries(): UseEntriesReturn {
  const [entries, setEntriesState] = useState<Entry[]>(() => getEntries());

  useEffect(() => {
    setEntries(entries);
  }, [entries]);

  function getTodayEntry(): Entry | undefined {
    return entries.find((e) => e.date === todayString());
  }

  function getEntryById(id: string): Entry | undefined {
    return entries.find((e) => e.id === id);
  }

  function saveEntry(data: SavePayload): void {
    const now = new Date().toISOString();
    setEntriesState((prev) => {
      if (data.id) {
        return prev.map((e) =>
          e.id === data.id
            ? { ...e, ...data, id: e.id, createdAt: e.createdAt, updatedAt: now }
            : e
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
        return [...prev, newEntry];
      }
    });
  }

  return { entries, getTodayEntry, getEntryById, saveEntry };
}
