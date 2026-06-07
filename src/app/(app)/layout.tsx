import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppHeader } from "@/components/auth/AppHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppHeader />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-8">{children}</div>
      </main>
    </AuthGuard>
  );
}
