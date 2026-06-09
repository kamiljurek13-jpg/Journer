"use client";

import { X } from "lucide-react";
import type { EntryPhoto, EntryPhotoWithUrl } from "@/types/photo";

interface PhotoStripProps {
  photos: EntryPhotoWithUrl[];
  onDelete: (photo: EntryPhoto) => void;
  readOnly?: boolean;
}

export function PhotoStrip({ photos, onDelete, readOnly = false }: PhotoStripProps) {
  if (photos.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {photos.map((photo) => (
        <div key={photo.id} className="relative shrink-0 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.signedUrl}
            alt=""
            className="h-24 w-24 object-cover rounded-md"
          />
          {!readOnly && (
            <button
              type="button"
              onClick={() => onDelete(photo)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Usuń zdjęcie"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
