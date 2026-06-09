"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchPhotosForDate,
  uploadPhoto,
  deletePhoto,
  getSignedUrls,
} from "@/lib/photos";
import type { EntryPhoto, EntryPhotoWithUrl } from "@/types/photo";

interface UseEntryPhotosReturn {
  photos: EntryPhotoWithUrl[];
  uploading: boolean;
  error: string | null;
  addPhoto: (file: File) => Promise<void>;
  removePhoto: (photo: EntryPhoto) => Promise<void>;
}

export function useEntryPhotos(date: string): UseEntryPhotosReturn {
  const [photos, setPhotos] = useState<EntryPhotoWithUrl[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeDateRef = useRef(date);

  useEffect(() => {
    activeDateRef.current = date;
    setPhotos([]);
    setError(null);
    if (!date) return;

    fetchPhotosForDate(date)
      .then((raw) => getSignedUrls(raw))
      .then((enriched) => {
        if (activeDateRef.current === date) setPhotos(enriched);
      })
      .catch((e) => {
        if (activeDateRef.current === date) setError(String(e));
      });
  }, [date]);

  const addPhoto = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const newPhoto = await uploadPhoto(date, file);
        const [enriched] = await getSignedUrls([newPhoto]);
        setPhotos((prev) => [...prev, enriched]);
      } catch (e) {
        setError(String(e));
      } finally {
        setUploading(false);
      }
    },
    [date]
  );

  const removePhoto = useCallback(async (photo: EntryPhoto) => {
    try {
      await deletePhoto(photo);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (e) {
      setError(String(e));
    }
  }, []);

  return { photos, uploading, error, addPhoto, removePhoto };
}
