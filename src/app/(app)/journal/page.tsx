"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useEntries } from "@/hooks/useEntries";
import { EntryListItem } from "@/components/entries/EntryListItem";
import { WeekStrip } from "@/components/entries/WeekStrip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoodSelector } from "@/components/mood/MoodSelector";
import { todayString } from "@/lib/dates";
import type { Mood } from "@/types/entry";

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor").then((m) => m.TiptapEditor),
  { ssr: false }
);

export default function JournalPage() {
  const { entries, loading, saveEntry } = useEntries();
  const today = todayString();
  const [selectedDate, setSelectedDate] = useState(today);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const entriesByDate = useMemo(
    () => new Map(entries.map((e) => [e.date, e])),
    [entries]
  );

  const datesWithEntries = useMemo(
    () => new Set(entries.map((e) => e.date)),
    [entries]
  );

  const selectedEntry = entriesByDate.get(selectedDate) ?? null;

  useEffect(() => {
    setTitle("");
    setBody("");
    setMood(null);
    setEditorKey((k) => k + 1);
  }, [selectedDate]);

  async function handleSave() {
    if (!body || !mood) return;
    setSaving(true);
    try {
      await saveEntry({
        date: selectedDate,
        title: title.trim() || undefined,
        body,
        mood,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const canSave = body.replace(/<[^>]+>/g, "").trim().length > 0 && mood !== null;

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-light font-serif text-center">Journer</h1>
        <p className="text-sm text-muted-foreground">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-light font-serif text-center">Journer</h1>

      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        datesWithEntries={datesWithEntries}
      />

      {selectedEntry ? (
        <EntryListItem entry={selectedEntry} />
      ) : selectedDate <= today ? (
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Tytuł (opcjonalnie)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TiptapEditor key={editorKey} content={body} onChange={setBody} />
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Jak minął dzień?</p>
            <MoodSelector value={mood} onChange={setMood} />
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleSave} disabled={!canSave || saving}>
              {saving ? "Zapisuję..." : "Zapisz"}
            </Button>
            {saved && (
              <span className="text-sm text-muted-foreground">Zapisano!</span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Nie można dodać wpisu dla przyszłej daty.
        </p>
      )}
    </div>
  );
}
