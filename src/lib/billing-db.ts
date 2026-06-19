import { createAdminClient } from "./supabase-admin";

type AdminClient = ReturnType<typeof createAdminClient>;

const PREMIUM_PERSONAS_LIST = ["jung", "watts"] as const;

export async function checkExistingPurchase(
  admin: AdminClient,
  userId: string,
  persona: string
): Promise<boolean> {
  const { data, error } = await admin
    .schema("billing")
    .from("purchases")
    .select("id")
    .eq("user_id", userId)
    .eq("persona", persona)
    .eq("status", "completed")
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function getStripeCustomerId(
  admin: AdminClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await admin
    .schema("billing")
    .from("customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as { stripe_customer_id: string } | null)?.stripe_customer_id ?? null;
}

export async function upsertStripeCustomer(
  admin: AdminClient,
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  const { error } = await admin
    .schema("billing")
    .from("customers")
    .upsert({ user_id: userId, stripe_customer_id: stripeCustomerId }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function upsertPendingPurchase(
  admin: AdminClient,
  userId: string,
  persona: string,
  sessionId: string,
  amountCents: number,
  currency: string
): Promise<void> {
  const { error } = await admin
    .schema("billing")
    .from("purchases")
    .upsert(
      {
        user_id: userId,
        persona,
        stripe_checkout_session_id: sessionId,
        amount_cents: amountCents,
        currency,
        status: "pending",
      },
      { onConflict: "stripe_checkout_session_id" }
    );
  if (error) throw error;
}

export async function completePurchase(
  admin: AdminClient,
  sessionId: string,
  userId: string,
  paymentIntentId: string | null
): Promise<void> {
  const { error } = await admin
    .schema("billing")
    .from("purchases")
    .update({
      status: "completed",
      purchased_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("stripe_checkout_session_id", sessionId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getUserBillingAccess(
  admin: AdminClient,
  userId: string
): Promise<Array<{ persona: string; is_purchased: boolean; message_count: number }>> {
  const [{ data: purchases, error: pErr }, { data: trials, error: tErr }] = await Promise.all([
    admin
      .schema("billing")
      .from("purchases")
      .select("persona")
      .eq("user_id", userId)
      .eq("status", "completed"),
    admin
      .schema("billing")
      .from("trial_usage")
      .select("persona, message_count")
      .eq("user_id", userId),
  ]);
  if (pErr) throw pErr;
  if (tErr) throw tErr;

  const purchasedSet = new Set(
    ((purchases ?? []) as Array<{ persona: string }>).map((p) => p.persona)
  );
  const trialMap = new Map(
    ((trials ?? []) as Array<{ persona: string; message_count: number }>).map((t) => [
      t.persona,
      t.message_count,
    ])
  );

  return PREMIUM_PERSONAS_LIST.map((persona) => ({
    persona,
    is_purchased: purchasedSet.has(persona),
    message_count: trialMap.get(persona) ?? 0,
  }));
}
