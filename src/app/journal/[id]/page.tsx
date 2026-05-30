"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEntries } from "@/hooks/useEntries";
import { formatDisplayDate } from "@/lib/dates";

const TiptapEditor = dynamic(
  () => import("@/components/editor/TiptapEditor").then((m) => m.TiptapEditor),
  { ssr: false }
);

const MOOD_EMOJI: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

const MOOD_LABEL: Record<number, string> = {
  1: "Bardzo źle",
  2: "Źle",
  3: "Średnio",
  4: "Dobrze",
  5: "Świetnie",
};

export default function EntryPage() {
  const { id } = useParams<{ id: string }>();
  const { getEntryById } = useEntries();
  const entry = getEntryById(id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/journal"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Dziennik
      </Link>

      {!entry ? (
        <p className="text-muted-foreground">Nie znaleziono wpisu.</p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <p className="text-3xl font-light">{formatDisplayDate(entry.date)}</p>
            {entry.title && (
              <h1 className="text-xl font-medium mt-1">{entry.title}</h1>
            )}
            <div className="mt-2">
              <Badge variant="secondary">
                {MOOD_EMOJI[entry.mood]} {MOOD_LABEL[entry.mood]}
              </Badge>
            </div>
          </div>

          <TiptapEditor content={entry.body} editable={false} />
        </>
      )}
    </div>
  );
}
