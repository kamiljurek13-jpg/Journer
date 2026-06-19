import Stripe from "stripe";
import { createAdminClient } from "./supabase-admin";
import { getUserBillingAccess as dbGetUserBillingAccess } from "./billing-db";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
  }
  return _stripe;
}

const TRIAL_LIMIT = parseInt(process.env.STRIPE_TRIAL_MESSAGE_LIMIT ?? "5", 10);

export const PREMIUM_PERSONAS = ["jung", "watts"] as const;
export type PremiumPersona = (typeof PREMIUM_PERSONAS)[number];

export type AccessInfo = {
  unlocked: boolean;
  trialRemaining: number;
};

export async function getUserAccess(
  userId: string
): Promise<Record<PremiumPersona, AccessInfo>> {
  const admin = createAdminClient();
  const rows = await dbGetUserBillingAccess(admin, userId);

  const result = {} as Record<PremiumPersona, AccessInfo>;
  for (const row of rows) {
    const persona = row.persona as PremiumPersona;
    result[persona] = {
      unlocked: row.is_purchased,
      trialRemaining: row.is_purchased
        ? 0
        : Math.max(0, TRIAL_LIMIT - row.message_count),
    };
  }
  return result;
}

export type AccessReason = "purchased" | "trial" | "denied";

export async function checkPersonaAccess(
  userId: string,
  persona: string
): Promise<{ allowed: boolean; reason: AccessReason }> {
  if (!PREMIUM_PERSONAS.includes(persona as PremiumPersona)) {
    return { allowed: true, reason: "purchased" };
  }
  const access = await getUserAccess(userId);
  const info = access[persona as PremiumPersona];
  if (info.unlocked) return { allowed: true, reason: "purchased" };
  if (info.trialRemaining > 0) return { allowed: true, reason: "trial" };
  return { allowed: false, reason: "denied" };
}

export async function incrementTrialUsage(
  userId: string,
  persona: string
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("increment_trial_usage", {
    p_user_id: userId,
    p_persona: persona,
  });
  if (error) throw error;
}

export async function tryConsumeTrialMessage(
  userId: string,
  persona: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("try_consume_trial_message", {
    p_user_id: userId,
    p_persona: persona,
    p_limit: TRIAL_LIMIT,
  });
  if (error) throw error;
  return data as boolean;
}
