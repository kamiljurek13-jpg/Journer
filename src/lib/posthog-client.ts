import posthog from "posthog-js";

const CONSENT_KEY = "journer-analytics-consent";

export type ConsentChoice = "granted" | "denied";

let initialized = false;

export function getConsentChoice(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function setConsentChoice(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, choice);
}

// Heatmaps + session replay only — autocapture stays off so we don't build up
// an events table for funnels/metrics we're not using yet. Journal/chat text
// is masked via the .ph-mask class (TiptapEditor, EntryListItem, ChatPanel),
// which rrweb's session recorder redacts by default.
export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) return;

  initialized = true;
  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    ui_host: "https://eu.posthog.com",
    defaults: "2026-06-25",
    autocapture: false,
    capture_heatmaps: true,
    enable_recording_console_log: false,
  });
}
