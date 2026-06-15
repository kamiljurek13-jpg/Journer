"use client";

import { Lock } from "lucide-react";
import { PERSONAS, type PersonaId } from "@/lib/personas";

interface PersonaSelectorProps {
  active: PersonaId;
  onSelect: (id: PersonaId) => void;
  onLockedClick: (id: PersonaId) => void;
}

export function PersonaSelector({
  active,
  onSelect,
  onLockedClick,
}: PersonaSelectorProps) {
  return (
    <div className="flex gap-2">
      {PERSONAS.map((p) => {
        const isActive = p.id === active;
        return (
          <button
            key={p.id}
            onClick={() => {
              if (p.unlocked) {
                onSelect(p.id);
              } else {
                onLockedClick(p.id);
              }
            }}
            className={`flex-1 rounded-lg border px-3 py-2 text-left transition-colors ${
              isActive
                ? "border-primary bg-primary/5"
                : "border-border bg-transparent hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium leading-tight">{p.name}</span>
              {!p.unlocked && (
                <Lock size={11} className="shrink-0 text-muted-foreground" />
              )}
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
              {p.tagline}
            </p>
          </button>
        );
      })}
    </div>
  );
}
