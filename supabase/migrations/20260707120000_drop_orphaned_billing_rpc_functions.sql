-- Drop 6 orphaned RPC functions left in public schema from before commit 6ac22f6, which
-- replaced all admin.rpc(...) calls in checkout/webhook/billing.ts with direct
-- .schema("billing") queries via billing-db.ts. No application code has called any of these
-- via .rpc(...) since that commit (confirmed by grep across src/).
--
-- All 6 are still live as SECURITY DEFINER, and Supabase's security advisor flags every one
-- as executable by both `anon` and `authenticated` via /rest/v1/rpc/<function_name> — e.g.
-- anyone could call complete_purchase with an arbitrary user_id/session_id to try to forge a
-- completed purchase, or call get_user_billing_access / get_stripe_customer_id with an
-- arbitrary user_id to read another user's billing data (IDOR). Dropping them removes this
-- dead attack surface; billing.* access continues exclusively through billing-db.ts via the
-- service_role admin client, as intended.
--
-- Signatures confirmed against the live project via get_advisors (not reconstructed from memory).
DROP FUNCTION IF EXISTS public.check_existing_purchase(p_user_id uuid, p_persona text);
DROP FUNCTION IF EXISTS public.complete_purchase(p_session_id text, p_user_id uuid, p_payment_intent_id text);
DROP FUNCTION IF EXISTS public.get_stripe_customer_id(p_user_id uuid);
DROP FUNCTION IF EXISTS public.get_user_billing_access(p_user_id uuid);
DROP FUNCTION IF EXISTS public.upsert_pending_purchase(p_user_id uuid, p_persona text, p_session_id text, p_amount_cents integer, p_currency text);
DROP FUNCTION IF EXISTS public.upsert_stripe_customer(p_user_id uuid, p_stripe_customer_id text);
