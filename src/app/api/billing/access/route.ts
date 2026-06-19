import { createClient } from "@supabase/supabase-js";
import { getUserAccess } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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

  const access = await getUserAccess(user.id);
  return Response.json(access);
}
