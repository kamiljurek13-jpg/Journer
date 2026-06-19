"use client";

import { useState } from "react";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PERSONAS, type PersonaId } from "@/lib/personas";

interface PersonaUpgradeModalProps {
  personaId: PersonaId;
  accessToken: string;
  trialRemaining: number;
  returnPath: string;
  onClose: () => void;
  onTrialStart: () => void;
}

export function PersonaUpgradeModal({
  personaId,
  accessToken,
  trialRemaining,
  returnPath,
  onClose,
  onTrialStart,
}: PersonaUpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persona = PERSONAS.find((p) => p.id === personaId);
  if (!persona) return null;

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: personaId, accessToken, returnPath }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Coś poszło nie tak. Spróbuj ponownie.");
        return;
      }
      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl;
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

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

        <p className="mb-4 text-sm text-muted-foreground">{persona.description}</p>

        {trialRemaining > 0 ? (
          <>
            <p className="mb-4 text-xs text-muted-foreground">
              Zostało Ci{" "}
              <span className="font-medium text-foreground">
                {trialRemaining} darmowych wiadomości
              </span>{" "}
              z tą personą.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  onClose();
                  onTrialStart();
                }}
              >
                Spróbuj za darmo ({trialRemaining} wiad.)
              </Button>
              <Button className="w-full" onClick={handleBuy} disabled={loading}>
                {loading ? "Przekierowuję..." : "Kup dostęp — 10 PLN"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-xs text-amber-600 dark:text-amber-400">
              Darmowy trial wyczerpany.
            </p>
            <Button className="w-full" onClick={handleBuy} disabled={loading}>
              {loading ? "Przekierowuję..." : "Kup dostęp — 10 PLN"}
            </Button>
          </>
        )}

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
