import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppHeader } from "@/components/auth/AppHeader";
import { BottomNav } from "@/components/nav/BottomNav";

// Auth-protected pages are never statically generated — they always need
// a live session check, so we opt out of static prerendering entirely.
export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppHeader />
      <main className="flex-1 pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
      </main>
      <BottomNav />
    </AuthGuard>
  );
}
