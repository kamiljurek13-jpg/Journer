import { getAuthenticatedUser } from "@/lib/api-session";
import { getPhotosForEntry, addPhotoToEntry, removePhotoFromEntry } from "@/lib/strapi-entries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isOwnedPath(userId: string, storagePath: unknown): storagePath is string {
  return typeof storagePath === "string" && storagePath.startsWith(`${userId}/`);
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = new URL(request.url).searchParams.get("date");
  if (!date || !DATE_REGEX.test(date)) {
    return Response.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  const photos = await getPhotosForEntry(user.id, date);
  return Response.json({ photos });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { date, storagePath } = body as { date?: unknown; storagePath?: unknown };

  if (typeof date !== "string" || !DATE_REGEX.test(date)) {
    return Response.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }
  if (!isOwnedPath(user.id, storagePath)) {
    return Response.json({ error: "Invalid storagePath" }, { status: 400 });
  }

  const photos = await addPhotoToEntry(user.id, date, storagePath);
  return Response.json({ photos });
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { date, storagePath } = body as { date?: unknown; storagePath?: unknown };

  if (typeof date !== "string" || !DATE_REGEX.test(date)) {
    return Response.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }
  if (!isOwnedPath(user.id, storagePath)) {
    return Response.json({ error: "Invalid storagePath" }, { status: 400 });
  }

  const photos = await removePhotoFromEntry(user.id, date, storagePath);
  return Response.json({ photos });
}
