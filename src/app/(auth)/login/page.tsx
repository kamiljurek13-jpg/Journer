"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <div>
        <h1 className="text-2xl font-light">Zaloguj się</h1>
        <p className="text-sm text-muted-foreground mt-1">do Journer</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <Link
          href="/signup"
          className="underline hover:text-foreground transition-colors"
        >
          Zarejestruj się
        </Link>
      </p>
    </div>
  );
}
