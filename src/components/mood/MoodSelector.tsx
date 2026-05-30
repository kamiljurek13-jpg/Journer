"use client";

import type { Mood } from "@/types/entry";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: "😞", label: "Bardzo źle" },
  { value: 2, emoji: "😕", label: "Źle" },
  { value: 3, emoji: "😐", label: "Średnio" },
  { value: 4, emoji: "🙂", label: "Dobrze" },
  { value: 5, emoji: "😄", label: "Świetnie" },
];

interface MoodSelectorProps {
  value: Mood | null;
  onChange: (mood: Mood) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex gap-2">
      {MOODS.map(({ value: mood, emoji, label }) => (
        <button
          key={mood}
          type="button"
          title={label}
          onClick={() => onChange(mood)}
          className={`text-2xl w-11 h-11 rounded-lg transition-all hover:scale-110 ${
            value === mood
              ? "ring-2 ring-foreground bg-muted"
              : "opacity-50 hover:opacity-100"
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
