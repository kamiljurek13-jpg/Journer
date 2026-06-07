import { createAdminClient } from "@/lib/supabase-admin";
import { validatePAT } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const userId = await validatePAT(request.headers.get("authorization"));
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "Invalid date format. Use YYYY-MM-DD." }, 400);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) return json({ error: "Failed to fetch entry" }, 500);

  if (!data) return json({ entry: null });

  return json({
    entry: {
      id: data.id,
      date: data.date,
      title: data.title ?? null,
      body: data.body,
      mood: data.mood,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}
