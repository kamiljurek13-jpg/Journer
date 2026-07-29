"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getConsentChoice, initAnalytics, setConsentChoice, type ConsentChoice } from "@/lib/posthog-client";

export function CookieConsentBanner() {
  const [choice, setChoice] = useState<ConsentChoice | null | "loading">("loading");

  useEffect(() => {
    setChoice(getConsentChoice());
  }, []);

  function handleDecide(next: ConsentChoice) {
    setConsentChoice(next);
    if (next === "granted") initAnalytics();
    setChoice(next);
  }

  if (choice !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Używamy PostHog (mapy cieplne i nagrania sesji), żeby lepiej rozumieć jak
          korzystasz z Journer. Treść wpisów i czatu jest zawsze maskowana.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleDecide("denied")}>
            Odrzuć
          </Button>
          <Button size="sm" onClick={() => handleDecide("granted")}>
            Akceptuję
          </Button>
        </div>
      </div>
    </div>
  );
}
