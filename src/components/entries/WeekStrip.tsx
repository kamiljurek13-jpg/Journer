"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

function getWeekStart(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  datesWithEntries: Set<string>;
}

export function WeekStrip({ selectedDate, onSelectDate, datesWithEntries }: WeekStripProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(selectedDate));
  const today = toDateString(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return { dateStr: toDateString(date), dayNum: date.getDate(), dayName: DAY_NAMES[i] };
  });

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setWeekStart((prev) => addDays(prev, -7))}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label="Poprzedni tydzień"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex flex-1 justify-between">
        {days.map(({ dateStr, dayNum, dayName }) => {
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const isFuture = dateStr > today;
          const hasEntry = datesWithEntries.has(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onSelectDate(dateStr)}
              disabled={isFuture}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isFuture
                  ? "text-muted-foreground opacity-40 cursor-default"
                  : "text-foreground hover:bg-muted/60",
                isToday && !isSelected && "ring-1 ring-primary/30"
              )}
              aria-label={dateStr}
            >
              <span className="text-[10px] font-medium leading-none">{dayName}</span>
              <span className="text-sm font-medium leading-none mt-0.5">{dayNum}</span>
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full mt-0.5",
                  hasEntry
                    ? isSelected
                      ? "bg-primary-foreground/70"
                      : "bg-primary"
                    : "invisible"
                )}
              />
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setWeekStart((prev) => addDays(prev, 7))}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label="Następny tydzień"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
