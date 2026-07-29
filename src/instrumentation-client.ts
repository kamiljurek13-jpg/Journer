import { getConsentChoice, initAnalytics } from "@/lib/posthog-client";

if (getConsentChoice() === "granted") {
  initAnalytics();
}
