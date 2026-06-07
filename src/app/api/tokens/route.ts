import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { hashToken } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getUserSupabase(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );
}

async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const accessToken = authHeader.slice("Bearer ".length);
  const supabase = getUserSupabase(accessToken);
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const supabase = getUserSupabase(
    request.headers.get("authorization")!.slice("Bearer ".length)
  );

  const { data, error } = await supabase
    .from("api_tokens")
    .select("id, name, created_at, last_used_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return json({ error: "Failed to fetch tokens" }, 500);
  return json({ tokens: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const name: string = (body?.name as string)?.trim() || "My token";

  const raw = "jour_" + randomBytes(32).toString("hex");
  const hash = hashToken(raw);

  const supabase = getUserSupabase(
    request.headers.get("authorization")!.slice("Bearer ".length)
  );

  const { data, error } = await supabase
    .from("api_tokens")
    .insert({ user_id: user.id, token_hash: hash, name })
    .select("id, name, created_at")
    .single();

  if (error) return json({ error: "Failed to create token" }, 500);

  return json({ token: raw, id: data.id, name: data.name, createdAt: data.created_at }, 201);
}
