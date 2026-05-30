import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatShortDate } from "@/lib/dates";
import type { Entry } from "@/types/entry";

const MOOD_EMOJI: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

interface EntryListItemProps {
  entry: Entry;
}

export function EntryListItem({ entry }: EntryListItemProps) {
  const excerpt = entry.title
    ? entry.title
    : stripHtml(entry.body).slice(0, 80) + (stripHtml(entry.body).length > 80 ? "…" : "");

  return (
    <Link href={`/journal/${entry.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="flex items-center justify-between py-4 px-5">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-muted-foreground">
              {formatShortDate(entry.date)}
            </span>
            <span className="text-sm truncate">{excerpt}</span>
          </div>
          <span className="text-xl ml-4 shrink-0">{MOOD_EMOJI[entry.mood]}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
