"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEntries } from "@/hooks/useEntries";
import { usePhotoDateSet } from "@/hooks/usePhotoDateSet";
import { todayString } from "@/lib/dates";

const DAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  const { entries } = useEntries();
  const photoDates = usePhotoDateSet();
  const router = useRouter();
  const today = todayString();

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const entryByDate = useMemo(
    () => new Map(entries.map((e) => [e.date, e])),
    [entries]
  );

  const datesWithActivity = useMemo(
    () => new Set([...entries.map((e) => e.date), ...photoDates]),
    [entries, photoDates]
  );

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday-first (0=Mon)
    const result: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) result.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) result.push(new Date(year, month, d));
    return result;
  }, [year, month]);

  const monthLabel = viewDate.toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  function handleDayClick(d: Date) {
    const dateStr = toDateStr(d);
    const entry = entryByDate.get(dateStr);
    if (entry) {
      router.push(`/journal/${entry.id}`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-light font-serif text-center">Kalendarz</h1>

      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Poprzedni miesiąc"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium capitalize">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Następny miesiąc"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs text-muted-foreground py-1 font-medium"
          >
            {label}
          </div>
        ))}

        {days.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const dateStr = toDateStr(d);
          const hasActivity = datesWithActivity.has(dateStr);
          const isToday = dateStr === today;
          const isFuture = dateStr > today;
          const hasEntry = entryByDate.has(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => hasEntry && handleDayClick(d)}
              disabled={isFuture || !hasEntry}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-colors
                ${isToday ? "bg-foreground text-background font-semibold" : ""}
                ${!isToday && hasActivity ? "hover:bg-muted cursor-pointer" : ""}
                ${!isToday && !hasActivity ? "text-muted-foreground" : ""}
                ${isFuture ? "opacity-30 cursor-default" : ""}
              `}
            >
              <span>{d.getDate()}</span>
              {hasActivity && !isToday && (
                <div className="w-1 h-1 rounded-full bg-foreground mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Brak wpisów. Zacznij pisać!
        </p>
      )}
    </div>
  );
}
