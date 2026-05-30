import Link from "next/link";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <p className="text-muted-foreground text-lg">Brak wpisów.</p>
      <p className="text-muted-foreground">
        Zacznij pisać swój pierwszy dziennik!
      </p>
      <Link
        href="/"
        className="mt-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity"
      >
        Napisz dziś
      </Link>
    </div>
  );
}
