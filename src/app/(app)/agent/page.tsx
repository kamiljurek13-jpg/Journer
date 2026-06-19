"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useEntries } from "@/hooks/useEntries";
import { todayString } from "@/lib/dates";

const ChatPanel = dynamic(
  () => import("@/components/chat/ChatPanel").then((m) => m.ChatPanel),
  { ssr: false }
);

export default function AgentPage() {
  const { entries, loading } = useEntries();
  const today = todayString();

  const contextEntry = useMemo(() => {
    const todayEntry = entries.find((e) => e.date === today);
    if (todayEntry) return todayEntry;
    return entries[0] ?? null;
  }, [entries, today]);

  const entry = contextEntry
    ? {
        id: contextEntry.id,
        date: contextEntry.date,
        title: contextEntry.title,
        body: contextEntry.body,
        mood: contextEntry.mood,
      }
    : null;

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-light font-serif text-center">Agent</h1>
        <p className="text-sm text-muted-foreground">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-light font-serif text-center">Agent</h1>
      {entry && (
        <p className="text-xs text-muted-foreground text-center -mt-3">
          Kontekst: {entry.date === today ? "dzisiaj" : entry.date}
        </p>
      )}
      <ChatPanel entry={entry} />
    </div>
  );
}
