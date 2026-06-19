import { createClient } from "@supabase/supabase-js";
import { getStripe, PREMIUM_PERSONAS, type PremiumPersona } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  checkExistingPurchase,
  getStripeCustomerId,
  upsertStripeCustomer,
  upsertPendingPurchase,
} from "@/lib/billing-db";

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
  const alreadyPurchased = await checkExistingPurchase(admin, user.id, persona);
  if (alreadyPurchased) {
    return Response.json({ error: "Already purchased" }, { status: 409 });
  }

  const stripe = getStripe();

  // Get or create Stripe customer
  const existingCustomerId = await getStripeCustomerId(admin, user.id);

  let stripeCustomerId: string;

  if (existingCustomerId) {
    stripeCustomerId = existingCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    stripeCustomerId = customer.id;
    await upsertStripeCustomer(admin, user.id, stripeCustomerId);
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

  await upsertPendingPurchase(
    admin,
    user.id,
    persona,
    session.id,
    session.amount_total ?? 1000,
    session.currency ?? "pln"
  );

  return Response.json({ checkoutUrl: session.url });
}
