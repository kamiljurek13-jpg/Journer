import { supabase } from "./supabase";
import type { EntryPhoto, EntryPhotoWithUrl } from "@/types/photo";

const BUCKET = "JournerImages";
const SIGNED_URL_TTL_SECONDS = 3600;

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

async function fetchPhotosApi(date: string): Promise<string[]> {
  const accessToken = await getAccessToken();
  const res = await fetch(`/api/entries/photos?date=${encodeURIComponent(date)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch photos");
  const { photos } = (await res.json()) as { photos: string[] };
  return photos;
}

async function mutatePhotosApi(
  method: "POST" | "DELETE",
  date: string,
  storagePath: string
): Promise<string[]> {
  const accessToken = await getAccessToken();
  const res = await fetch("/api/entries/photos", {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ date, storagePath }),
  });
  if (!res.ok) throw new Error(method === "POST" ? "Failed to link photo" : "Failed to unlink photo");
  const { photos } = (await res.json()) as { photos: string[] };
  return photos;
}

export async function fetchPhotosForDate(date: string): Promise<EntryPhoto[]> {
  if (!date) return [];
  const photos = await fetchPhotosApi(date);
  return photos.map((storagePath) => ({ date, storagePath }));
}

export async function uploadPhoto(date: string, file: File): Promise<EntryPhoto> {
  const userId = await getUserId();
  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${userId}/${date}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  try {
    await mutatePhotosApi("POST", date, storagePath);
  } catch (err) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw err;
  }

  return { date, storagePath };
}

export async function deletePhoto(photo: EntryPhoto): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([photo.storagePath]);
  if (storageError) throw storageError;

  await mutatePhotosApi("DELETE", photo.date, photo.storagePath);
}

export async function getSignedUrls(
  photos: EntryPhoto[]
): Promise<EntryPhotoWithUrl[]> {
  if (photos.length === 0) return [];

  const paths = photos.map((p) => p.storagePath);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;

  return photos.map((photo, i) => ({
    ...photo,
    signedUrl: data[i].signedUrl ?? "",
  }));
}
