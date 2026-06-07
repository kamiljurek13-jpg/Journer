"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useEntries } from "@/hooks/useEntries";
import { EntryListItem } from "@/components/entries/EntryListItem";
import { WeekStrip } from "@/components/entries/WeekStrip";
import { Button } from "@/components/ui/button";
import { todayString, formatDisplayDate } from "@/lib/dates";

export default function JournalPage() {
  const { entries, loading } = useEntries();
  const today = todayString();
  const [selectedDate, setSelectedDate] = useState(today);

  const entriesByDate = useMemo(
    () => new Map(entries.map((e) => [e.date, e])),
    [entries]
  );

  const datesWithEntries = useMemo(
    () => new Set(entries.map((e) => e.date)),
    [entries]
  );

  const selectedEntry = entriesByDate.get(selectedDate) ?? null;
  const isToday = selectedDate === today;

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-light font-serif">Dziennik</h1>
        <p className="text-sm text-muted-foreground">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-light font-serif">Dziennik</h1>

      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        datesWithEntries={datesWithEntries}
      />

      {selectedEntry ? (
        <EntryListItem entry={selectedEntry} />
      ) : (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {isToday
              ? "Brak wpisu na dziś."
              : `Brak wpisu na ${formatDisplayDate(selectedDate)}.`}
          </p>
          {isToday && (
            <Button asChild variant="outline" size="sm">
              <Link href="/">Napisz wpis</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
