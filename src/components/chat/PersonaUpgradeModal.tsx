"use client";

import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PERSONAS, type PersonaId } from "@/lib/personas";

interface PersonaUpgradeModalProps {
  personaId: PersonaId;
  onClose: () => void;
}

export function PersonaUpgradeModal({
  personaId,
  onClose,
}: PersonaUpgradeModalProps) {
  const persona = PERSONAS.find((p) => p.id === personaId);
  if (!persona) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-xl border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Zamknij"
        >
          <X size={16} />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Lock size={18} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Odblokuj {persona.name}</p>
            <p className="text-xs text-muted-foreground">{persona.tagline}</p>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">{persona.description}</p>

        <Button className="w-full" disabled>
          Kup dostęp — wkrótce dostępne
        </Button>
      </div>
    </div>
  );
}
