"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine, Calendar, MessageCircle } from "lucide-react";

const tabs = [
  { href: "/journal", label: "Wpis", icon: PenLine },
  { href: "/calendar", label: "Kalendarz", icon: Calendar },
  { href: "/agent", label: "Agent", icon: MessageCircle },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/journal") return pathname.startsWith("/journal");
    return pathname === href;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background z-50 safe-area-bottom">
      <div className="max-w-2xl mx-auto flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.5}
              />
              <span className={active ? "font-medium" : ""}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
