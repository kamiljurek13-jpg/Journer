CREATE SCHEMA IF NOT EXISTS billing;

CREATE TABLE billing.customers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE billing.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona TEXT NOT NULL CHECK (persona IN ('jung', 'watts')),
  stripe_checkout_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'pln',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, persona)
);

CREATE TABLE billing.trial_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona TEXT NOT NULL CHECK (persona IN ('jung', 'watts')),
  message_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, persona)
);

-- billing schema is accessible only via service_role (admin client).
-- The authenticated and anon roles do not receive USAGE on new schemas by default,
-- so client-side JWT requests cannot reach these tables at all.
-- RLS + deny-all policies are an additional defense-in-depth layer.

ALTER TABLE billing.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.trial_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_customers" ON billing.customers USING (false);
CREATE POLICY "deny_all_purchases" ON billing.purchases USING (false);
CREATE POLICY "deny_all_trial" ON billing.trial_usage USING (false);

-- Atomic upsert-increment for trial message counting.
-- Lives in public schema so it is reachable via admin.rpc().
-- SECURITY DEFINER runs as the function owner (service_role), not the caller.
CREATE OR REPLACE FUNCTION public.increment_trial_usage(p_user_id UUID, p_persona TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO billing.trial_usage (user_id, persona, message_count)
  VALUES (p_user_id, p_persona, 1)
  ON CONFLICT (user_id, persona)
  DO UPDATE SET message_count = billing.trial_usage.message_count + 1;
$$;
