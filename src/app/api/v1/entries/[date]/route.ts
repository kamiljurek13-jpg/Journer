import { validatePAT } from "@/lib/api-auth";
import { getEntry } from "@/lib/journal-ops";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const userId = await validatePAT(request.headers.get("authorization"));
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  const result = await getEntry(userId, date);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ entry: result.data.entry });
}
