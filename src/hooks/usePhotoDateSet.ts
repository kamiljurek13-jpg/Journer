"use client";

import { useState, useEffect } from "react";
import { fetchPhotoDateSet } from "@/lib/photos";

export function usePhotoDateSet(): Set<string> {
  const [dates, setDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPhotoDateSet().then(setDates).catch(() => {});
  }, []);

  return dates;
}
