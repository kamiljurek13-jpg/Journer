"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export function TokenBanner() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGeneratedToken(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setGenerating(false); return; }

    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ name: tokenName.trim() || "My token" }),
    });

    if (res.ok) {
      const data = await res.json();
      setGeneratedToken(data.token);
      setTokenName("");
    }
    setGenerating(false);
  }, [tokenName]);

  const handleCopy = useCallback(() => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedToken]);

  if (loggedIn === null) {
    return <div className="rounded-lg border border-border bg-muted/30 h-[68px] animate-pulse mb-8" />;
  }

  if (!loggedIn) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-5 py-4 mb-8 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Generate a Personal Access Token to authenticate API and MCP requests.
        </p>
        <Link href="/login">
          <Button variant="outline" size="sm" className="shrink-0">
            Sign in to generate
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-5 py-4 mb-8 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Personal Access Token
      </p>

      {generatedToken ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Copy your token — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate rounded bg-zinc-950 text-zinc-100 px-3 py-2 text-xs font-mono">
              {generatedToken}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setGeneratedToken(null)}
              className="shrink-0 text-muted-foreground"
            >
              ✕
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            className="h-8 text-sm max-w-56"
            placeholder="Token name (e.g. Claude Desktop)"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Generating…" : "Generate token"}
          </Button>
        </div>
      )}
    </div>
  );
}
