import { validatePAT } from "@/lib/api-auth";
import { createOrUpdateEntry } from "@/lib/journal-ops";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await validatePAT(request.headers.get("authorization"));
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const result = await createOrUpdateEntry(userId, body);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(
    { entry: result.data.entry },
    { status: result.data.created ? 201 : 200 }
  );
}
