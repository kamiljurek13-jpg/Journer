import { createClient } from "@supabase/supabase-js";
import { getStripe, PREMIUM_PERSONAS, type PremiumPersona } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PRICE_IDS: Record<PremiumPersona, string> = {
  jung: process.env.STRIPE_JUNG_PRICE_ID ?? "",
  watts: process.env.STRIPE_WATTS_PRICE_ID ?? "",
};

export async function POST(request: Request) {
  const body = await request.json();
  const { persona, accessToken, returnPath } = body as {
    persona: string;
    accessToken: string;
    returnPath?: string;
  };

  // Guard against open-redirect: only accept same-origin paths
  const safePath =
    typeof returnPath === "string" && returnPath.startsWith("/")
      ? returnPath
      : "/journal";

  if (!accessToken || !persona) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!PREMIUM_PERSONAS.includes(persona as PremiumPersona)) {
    return Response.json({ error: "Invalid persona" }, { status: 400 });
  }

  const userSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const {
    data: { user },
  } = await userSupabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Check if already purchased
  const { data: alreadyPurchased, error: purchaseCheckError } = await admin.rpc(
    "check_existing_purchase",
    { p_user_id: user.id, p_persona: persona }
  );
  if (purchaseCheckError) throw purchaseCheckError;
  if (alreadyPurchased) {
    return Response.json({ error: "Already purchased" }, { status: 409 });
  }

  const stripe = getStripe();

  // Get or create Stripe customer
  const { data: existingCustomerId, error: customerReadError } = await admin.rpc(
    "get_stripe_customer_id",
    { p_user_id: user.id }
  );
  if (customerReadError) throw customerReadError;

  let stripeCustomerId: string;

  if (existingCustomerId) {
    stripeCustomerId = existingCustomerId as string;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    stripeCustomerId = customer.id;

    const { error: upsertError } = await admin.rpc("upsert_stripe_customer", {
      p_user_id: user.id,
      p_stripe_customer_id: stripeCustomerId,
    });
    if (upsertError) throw upsertError;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "payment",
    line_items: [{ price: PRICE_IDS[persona as PremiumPersona], quantity: 1 }],
    metadata: { user_id: user.id, persona },
    success_url: `${baseUrl}${safePath}?purchase=success&persona=${persona}`,
    cancel_url: `${baseUrl}${safePath}`,
  });

  const { error: pendingError } = await admin.rpc("upsert_pending_purchase", {
    p_user_id: user.id,
    p_persona: persona,
    p_session_id: session.id,
    p_amount_cents: session.amount_total ?? 1000,
    p_currency: session.currency ?? "pln",
  });
  if (pendingError) throw pendingError;

  return Response.json({ checkoutUrl: session.url });
}
