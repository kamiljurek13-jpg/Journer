"use client";

import { Lock } from "lucide-react";
import { PERSONAS, type PersonaId } from "@/lib/personas";
import type { AccessInfo } from "@/lib/billing";
import type { PremiumPersona } from "@/lib/billing";

interface PersonaSelectorProps {
  active: PersonaId;
  accessInfo: Record<PremiumPersona, AccessInfo> | null;
  onSelect: (id: PersonaId) => void;
  onLockedClick: (id: PersonaId) => void;
}

export function PersonaSelector({
  active,
  accessInfo,
  onSelect,
  onLockedClick,
}: PersonaSelectorProps) {
  function isUnlocked(personaId: PersonaId): boolean {
    const persona = PERSONAS.find((p) => p.id === personaId);
    if (persona?.unlocked) return true;
    return accessInfo?.[personaId as PremiumPersona]?.unlocked ?? false;
  }

  return (
    <div className="flex gap-2">
      {PERSONAS.map((p) => {
        const isActive = p.id === active;
        const unlocked = isUnlocked(p.id);
        return (
          <button
            key={p.id}
            onClick={() => {
              if (unlocked) {
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
              {!unlocked && (
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
