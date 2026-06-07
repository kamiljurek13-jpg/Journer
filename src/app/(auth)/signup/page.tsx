"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Hasła nie są identyczne.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <h1 className="text-2xl font-light font-serif">Sprawdź skrzynkę</h1>
        <p className="text-sm text-muted-foreground">
          Wysłaliśmy link aktywacyjny na{" "}
          <strong className="text-foreground">{email}</strong>. Kliknij go,
          żeby aktywować konto, a potem wróć się zalogować.
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Przejdź do logowania
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <div>
        <h1 className="text-2xl font-light font-serif">Utwórz konto</h1>
        <p className="text-sm text-muted-foreground mt-1">Journer</p>
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
          autoComplete="new-password"
        />
        <Input
          type="password"
          placeholder="Powtórz hasło"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Tworzenie konta..." : "Zarejestruj się"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Masz już konto?{" "}
        <Link
          href="/login"
          className="underline hover:text-foreground transition-colors"
        >
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
