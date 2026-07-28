import { createOrUpdateEntry } from "@/lib/journal-ops";
import { listAllEntries } from "@/lib/strapi-entries";
import { getAuthenticatedUser } from "@/lib/api-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await listAllEntries(user.id);
  return Response.json({ entries });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const result = await createOrUpdateEntry(user.id, body);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(
    { entry: result.data.entry },
    { status: result.data.created ? 201 : 200 }
  );
}
