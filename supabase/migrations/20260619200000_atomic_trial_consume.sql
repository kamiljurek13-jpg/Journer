-- Atomic trial message consumption: replaces the non-atomic check+increment pattern.
-- Returns TRUE if the message was consumed (count was below limit), FALSE if limit already reached.
-- PostgreSQL serializes concurrent requests at the row lock, so only one wins at the boundary.
CREATE OR REPLACE FUNCTION public.try_consume_trial_message(
  p_user_id UUID,
  p_persona TEXT,
  p_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_limit <= 0 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO billing.trial_usage (user_id, persona, message_count)
  VALUES (p_user_id, p_persona, 1)
  ON CONFLICT (user_id, persona)
  DO UPDATE SET message_count = billing.trial_usage.message_count + 1
  WHERE billing.trial_usage.message_count < p_limit;

  RETURN FOUND;
END;
$$;
