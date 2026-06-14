"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoodSelector } from "@/components/mood/MoodSelector";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PhotoStrip } from "@/components/photos/PhotoStrip";
import { useEntries } from "@/hooks/useEntries";
import { useEntryPhotos } from "@/hooks/useEntryPhotos";
import { formatDisplayDate } from "@/lib/dates";
import type { Mood } from "@/types/entry";

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor").then((m) => m.TiptapEditor),
  { ssr: false }
);

export default function EntryPage() {
  const { id } = useParams<{ id: string }>();
  const { getEntryById, saveEntry } = useEntries();
  const entry = getEntryById(id);

  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const { photos, uploading, addPhoto, removePhoto } = useEntryPhotos(entry?.date ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title ?? "");
      setBody(entry.body);
      setMood(entry.mood);
      setEditorKey((k) => k + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id]);

  const isDirty =
    title !== (entry?.title ?? "") ||
    body !== (entry?.body ?? "") ||
    mood !== (entry?.mood ?? null);

  const bodyHasText = body.replace(/<[^>]+>/g, "").trim().length > 0;
  const canSave = (bodyHasText || photos.length > 0) && mood !== null;

  function handleAddPhotoClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await addPhoto(file);
    e.target.value = "";
  }

  async function handleSave() {
    if (!entry || !canSave || !mood) return;
    setSaving(true);
    try {
      await saveEntry({
        id: entry.id,
        date: entry.date,
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

  function handleCancel() {
    if (!entry) return;
    setTitle(entry.title ?? "");
    setBody(entry.body);
    setMood(entry.mood);
    setEditorKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/journal"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Back to days
      </Link>

      {!entry ? (
        <p className="text-muted-foreground">Nie znaleziono wpisu.</p>
      ) : (
        <>
          <p className="text-3xl font-light font-serif text-center">{formatDisplayDate(entry.date)}</p>

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
            {isDirty && (
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Anuluj
              </Button>
            )}
            {saved && (
              <span className="text-sm text-muted-foreground">Zapisano!</span>
            )}
          </div>

          <ChatPanel
            entry={{
              id: entry.id,
              date: entry.date,
              title: entry.title,
              body: entry.body,
              mood: entry.mood,
            }}
          />
        </>
      )}
    </div>
  );
}
