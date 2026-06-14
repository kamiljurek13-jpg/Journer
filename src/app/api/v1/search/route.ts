import { validatePAT } from "@/lib/api-auth";
import { hybridSearch } from "@/lib/journal-ops";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await validatePAT(request.headers.get("authorization"));
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query : "";

  const result = await hybridSearch(userId, query);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ results: result.data.results });
}
