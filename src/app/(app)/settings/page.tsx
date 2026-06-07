"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface ApiToken {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default function SettingsPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;
    const res = await fetch("/api/tokens", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setTokens(data.tokens ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  async function handleGenerate() {
    setGenerating(true);
    setGeneratedToken(null);
    const accessToken = await getAccessToken();
    if (!accessToken) { setGenerating(false); return; }

    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name: newName.trim() || "My token" }),
    });

    if (res.ok) {
      const data = await res.json();
      setGeneratedToken(data.token);
      setNewName("");
      setTokens((prev) => [
        { id: data.id, name: data.name, created_at: data.createdAt, last_used_at: null },
        ...prev,
      ]);
    }
    setGenerating(false);
  }

  async function handleRevoke(id: string) {
    setRevoking(id);
    const accessToken = await getAccessToken();
    if (!accessToken) { setRevoking(null); return; }

    const res = await fetch(`/api/tokens/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      setTokens((prev) => prev.filter((t) => t.id !== id));
      if (generatedToken) setGeneratedToken(null);
    }
    setRevoking(null);
  }

  async function handleCopy() {
    if (!generatedToken) return;
    await navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-xl font-semibold">Ustawienia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Zarządzaj tokenami dostępu do API.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          API Tokens
        </h2>

        <div className="flex gap-2">
          <Input
            placeholder="Nazwa tokenu (opcjonalnie)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
            className="max-w-xs"
          />
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? "Generowanie…" : "Wygeneruj nowy token"}
          </Button>
        </div>

        {generatedToken && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Nowy token — skopiuj go teraz.</p>
            <p className="text-xs text-muted-foreground">
              Ten token nie zostanie wyświetlony ponownie.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 rounded bg-background border border-border px-3 py-1.5 text-xs font-mono break-all">
                {generatedToken}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? "Skopiowano" : "Kopiuj"}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Ładowanie…</p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak tokenów.</p>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border">
            {tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{token.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Utworzono: {formatDate(token.created_at)} · Ostatnie użycie:{" "}
                    {formatDate(token.last_used_at)}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={revoking === token.id}
                  onClick={() => handleRevoke(token.id)}
                >
                  {revoking === token.id ? "…" : "Odwołaj"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
