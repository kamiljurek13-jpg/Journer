"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="border-b">
      <nav className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link
          href="/"
          className="text-sm font-medium hover:text-muted-foreground transition-colors"
        >
          Dziś
        </Link>
        <Link
          href="/journal"
          className="text-sm font-medium hover:text-muted-foreground transition-colors"
        >
          Dziennik
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {user?.email && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user.email}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Wyloguj
          </button>
        </div>
      </nav>
    </header>
  );
}
