-- Remove SECURITY DEFINER so the function runs as the caller (SECURITY INVOKER by default).
-- When called via the admin client (service_role), it retains full billing schema access.
-- When called by an authenticated user JWT, it fails — billing schema is not granted to that role.
CREATE OR REPLACE FUNCTION public.increment_trial_usage(p_user_id UUID, p_persona TEXT)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO billing.trial_usage (user_id, persona, message_count)
  VALUES (p_user_id, p_persona, 1)
  ON CONFLICT (user_id, persona)
  DO UPDATE SET message_count = billing.trial_usage.message_count + 1;
$$;
