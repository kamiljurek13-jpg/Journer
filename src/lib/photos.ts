import { supabase } from "./supabase";
import type { EntryPhoto, EntryPhotoWithUrl } from "@/types/photo";

const BUCKET = "JournerImages";
const SIGNED_URL_TTL_SECONDS = 3600;

type DbPhotoRow = {
  id: string;
  user_id: string;
  date: string;
  storage_path: string;
  created_at: string;
};

function rowToPhoto(row: DbPhotoRow): EntryPhoto {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  };
}

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function fetchPhotosForDate(date: string): Promise<EntryPhoto[]> {
  if (!date) return [];
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("entry_photos")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as DbPhotoRow[]).map(rowToPhoto);
}

export async function uploadPhoto(date: string, file: File): Promise<EntryPhoto> {
  const userId = await getUserId();
  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${userId}/${date}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from("entry_photos")
    .insert({ user_id: userId, date, storage_path: storagePath })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw insertError;
  }

  return rowToPhoto(data as DbPhotoRow);
}

export async function deletePhoto(photo: EntryPhoto): Promise<void> {
  const userId = await getUserId();
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([photo.storagePath]);
  if (storageError) throw storageError;

  const { error: dbError } = await supabase
    .from("entry_photos")
    .delete()
    .eq("id", photo.id)
    .eq("user_id", userId);
  if (dbError) throw dbError;
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

export async function fetchPhotoDateSet(): Promise<Set<string>> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("entry_photos")
    .select("date")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data as { date: string }[]).map((r) => r.date));
}
