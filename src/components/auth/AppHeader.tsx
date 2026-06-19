"use client";

import Link from "next/link";
import { Settings, FileText } from "lucide-react";

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="w-14" />
        <span className="text-base font-semibold font-serif tracking-tight">Journer</span>
        <div className="flex items-center gap-3">
          <Link
            href="/docs"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dokumentacja API"
          >
            <FileText size={18} />
          </Link>
          <Link
            href="/settings"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Ustawienia"
          >
            <Settings size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
