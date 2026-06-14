"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useEntries } from "@/hooks/useEntries";
import { useEntryPhotos } from "@/hooks/useEntryPhotos";
import { usePhotoDateSet } from "@/hooks/usePhotoDateSet";
import { EntryListItem } from "@/components/entries/EntryListItem";
import { WeekStrip } from "@/components/entries/WeekStrip";
import { PhotoStrip } from "@/components/photos/PhotoStrip";
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

  const { photos, uploading, addPhoto, removePhoto } = useEntryPhotos(selectedDate);
  const photoDates = usePhotoDateSet();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const entriesByDate = useMemo(
    () => new Map(entries.map((e) => [e.date, e])),
    [entries]
  );

  const datesWithEntries = useMemo(
    () => new Set(entries.map((e) => e.date)),
    [entries]
  );

  const datesWithActivity = useMemo(
    () => new Set([...datesWithEntries, ...photoDates]),
    [datesWithEntries, photoDates]
  );

  const selectedEntry = entriesByDate.get(selectedDate) ?? null;

  useEffect(() => {
    setTitle("");
    setBody("");
    setMood(null);
    setEditorKey((k) => k + 1);
  }, [selectedDate]);

  function handleAddPhotoClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await addPhoto(file);
    e.target.value = "";
  }

  const bodyHasText = body.replace(/<[^>]+>/g, "").trim().length > 0;
  const canSave = (bodyHasText || photos.length > 0) && mood !== null;

  async function handleSave() {
    if (!canSave || !mood) return;
    setSaving(true);
    try {
      await saveEntry({
        date: selectedDate,
        title: title.trim() || undefined,
        body: body || "<p></p>",
        mood,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

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
        datesWithEntries={datesWithActivity}
      />

      {selectedEntry ? (
        <EntryListItem entry={selectedEntry} />
      ) : selectedDate <= today ? (
        <div className="flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <PhotoStrip photos={photos} onDelete={removePhoto} />
          <Input
            placeholder="Tytuł (opcjonalnie)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TiptapEditor
            key={editorKey}
            content={body}
            onChange={setBody}
            onAddPhoto={handleAddPhotoClick}
            uploadingPhoto={uploading}
          />
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
