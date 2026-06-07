"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoodSelector } from "@/components/mood/MoodSelector";
import { useEntries } from "@/hooks/useEntries";
import { todayString, formatDisplayDate } from "@/lib/dates";
import type { Mood } from "@/types/entry";

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor").then((m) => m.TiptapEditor),
  { ssr: false }
);

export default function TodayPage() {
  const { getTodayEntry, saveEntry } = useEntries();
  const today = todayString();
  const todayEntry = getTodayEntry();

  const [title, setTitle] = useState(todayEntry?.title ?? "");
  const [body, setBody] = useState(todayEntry?.body ?? "");
  const [mood, setMood] = useState<Mood | null>(todayEntry?.mood ?? null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    const entry = getTodayEntry();
    setTitle(entry?.title ?? "");
    setBody(entry?.body ?? "");
    setMood(entry?.mood ?? null);
    setEditorKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!body || !mood) return;
    setSaving(true);
    try {
      await saveEntry({
        id: todayEntry?.id,
        date: today,
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-4xl font-light">{formatDisplayDate(today)}</p>
        {todayEntry && (
          <p className="text-sm text-muted-foreground mt-1">Edytujesz wpis z dziś</p>
        )}
      </div>

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
  );
}
