"use client";

import { useEntries } from "@/hooks/useEntries";
import { EntryListItem } from "@/components/entries/EntryListItem";
import { EmptyState } from "@/components/entries/EmptyState";

export default function JournalPage() {
  const { entries, loading } = useEntries();
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-light">Dziennik</h1>
        <p className="text-sm text-muted-foreground">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-light">Dziennik</h1>
      {sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((entry) => (
            <li key={entry.id}>
              <EntryListItem entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
