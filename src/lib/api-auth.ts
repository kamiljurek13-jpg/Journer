import { createHash } from "crypto";
import { createAdminClient } from "./supabase-admin";

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function validatePAT(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer jour_")) return null;

  const raw = authHeader.slice("Bearer ".length);
  const hash = hashToken(raw);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("api_tokens")
    .select("id, user_id")
    .eq("token_hash", hash)
    .maybeSingle();

  if (error || !data) return null;

  void admin
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", (data as { id: string; user_id: string }).id);

  return (data as { id: string; user_id: string }).user_id;
}
