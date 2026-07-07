-- Fix: service_role has never had access to the billing schema. Confirmed live via
-- has_schema_privilege('service_role', 'billing', 'USAGE') = false and
-- information_schema.role_table_grants showing only `postgres` (the migration runner)
-- as grantee on billing.customers/purchases/trial_usage — service_role was never granted
-- anything. The original schema comment in 20260615100000_create_billing_schema.sql
-- incorrectly assumed service_role gets implicit access to new schemas; Postgres only
-- grants USAGE to the schema owner by default.
--
-- This is why /api/billing/* returns 500 in production: PostgREST now routes to `billing`
-- (Exposed Schemas fixed in 20260707120000), but the admin client's service_role connection
-- then hits `permission denied for schema billing` (42501) because it lacks USAGE.
--
-- service_role has rolbypassrls = true (confirmed live), so RLS was never the blocker and
-- this grant does not weaken the deny-all RLS policies protecting anon/authenticated, which
-- still have zero grants on this schema.
GRANT USAGE ON SCHEMA billing TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA billing TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA billing GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
