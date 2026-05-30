import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Journer",
  description: "Twój codzienny dziennik",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
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
          </nav>
        </header>
        <main className="flex-1">
          <div className="max-w-2xl mx-auto px-4 py-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
