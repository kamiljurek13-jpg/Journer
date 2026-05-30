import type { Entry } from "@/types/entry";

const STORAGE_KEY = "journer_entries";

export function getEntries(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Entry[]) : [];
  } catch {
    return [];
  }
}

export function setEntries(entries: Entry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
