import { getStripe } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase-admin";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const paymentIntent =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    if (userId) {
      const admin = createAdminClient();
      const { error } = await admin.rpc("complete_purchase", {
        p_session_id: session.id,
        p_user_id: userId,
        p_payment_intent_id: paymentIntent,
      });
      if (error) console.error("complete_purchase error:", error);
    }
  }

  return Response.json({ received: true });
}
