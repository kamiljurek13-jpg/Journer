"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { PERSONAS, type PersonaId } from "@/lib/personas";
import { PersonaSelector } from "@/components/chat/PersonaSelector";
import { PersonaUpgradeModal } from "@/components/chat/PersonaUpgradeModal";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface EntryContext {
  id: string;
  date: string;
  title?: string;
  body: string;
  mood: number;
}

interface ChatPanelProps {
  entry: EntryContext | null;
}

export function ChatPanel({ entry }: ChatPanelProps) {
  const [persona, setPersona] = useState<PersonaId>("ryan");
  const [upgradeModal, setUpgradeModal] = useState<PersonaId | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    setLoadingHistory(true);
    setMessages([]);
    hasInteractedRef.current = false;
    supabase
      .from("chat_messages")
      .select("role, content")
      .eq("persona", persona)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
        setLoadingHistory(false);
      });
  }, [persona]);

  useEffect(() => {
    if (hasInteractedRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingText]);

  async function handleSend() {
    if (!input.trim() || !entry || streaming) return;

    setChatError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setChatError("Sesja wygasła — zaloguj się ponownie.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setChatError("Sesja wygasła — zaloguj się ponownie.");
      return;
    }

    hasInteractedRef.current = true;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setStreaming(true);
    setStreamingText("");

    const personaName = PERSONAS.find((p) => p.id === persona)?.name ?? "agenta";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryBody: entry.body,
          entryDate: entry.date,
          entryTitle: entry.title,
          entryMood: entry.mood,
          message: userMessage,
          accessToken: session.access_token,
          persona,
        }),
      });

      if (!res.ok || !res.body) {
        setChatError(
          res.status === 401
            ? "Sesja wygasła — zaloguj się ponownie."
            : `Błąd połączenia z ${personaName}. Spróbuj ponownie.`
        );
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data) as { text: string };
            accumulated += parsed.text;
            setStreamingText(accumulated);
          } catch {}
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: accumulated },
      ]);
      setStreamingText("");
    } catch (err) {
      console.error("Chat error:", err);
      setChatError(`Błąd połączenia z ${personaName}. Spróbuj ponownie.`);
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleClearHistory() {
    setClearing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setClearing(false); return; }
    await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", user.id)
      .eq("persona", persona);
    setMessages([]);
    setStreamingText("");
    hasInteractedRef.current = false;
    setConfirmClear(false);
    setClearing(false);
  }

  const disabled = !entry || streaming || !input.trim();
  const activePersonaName = PERSONAS.find((p) => p.id === persona)?.name ?? "agenta";

  return (
    <div className="flex flex-col gap-4">
      <Separator />

      <PersonaSelector
        active={persona}
        onSelect={(id) => {
          setPersona(id);
          setConfirmClear(false);
          setChatError(null);
        }}
        onLockedClick={(id) => setUpgradeModal(id)}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium">Porozmawiaj z {activePersonaName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agent ma dostęp do tego wpisu i może sprawdzić inne daty
          </p>
        </div>
        {messages.length > 0 && (
          <div className="flex items-center gap-2 ml-4">
            {confirmClear ? (
              <>
                <span className="text-xs text-muted-foreground">Na pewno?</span>
                <Button variant="destructive" size="sm" onClick={handleClearHistory} disabled={clearing}>
                  Tak
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)} disabled={clearing}>
                  Nie
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
                Wyczyść historię
              </Button>
            )}
          </div>
        )}
      </div>

      {!entry ? (
        <p className="text-sm text-muted-foreground">
          Najpierw zapisz wpis, żeby porozmawiać z agentem.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
            {loadingHistory ? (
              <p className="text-xs text-muted-foreground">Ładowanie...</p>
            ) : messages.length === 0 && !streamingText ? (
              <p className="text-xs text-muted-foreground">
                Zacznij rozmowę. Możesz zapytać o dzisiejszy wpis, poprosić o
                refleksję lub sprawdzić jak wyglądały poprzednie dni.
              </p>
            ) : null}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {streamingText && (
              <div className="flex justify-start">
                <div className="rounded-lg px-3 py-2 text-sm max-w-[85%] bg-muted text-foreground whitespace-pre-wrap">
                  {streamingText}
                  <span className="inline-block w-1 h-3.5 ml-0.5 bg-foreground/50 animate-pulse rounded-sm" />
                </div>
              </div>
            )}

            {streaming && !streamingText && (
              <div className="flex justify-start">
                <div className="rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground">
                  <span className="flex gap-1">
                    <span className="animate-bounce [animation-delay:0ms]">·</span>
                    <span className="animate-bounce [animation-delay:150ms]">·</span>
                    <span className="animate-bounce [animation-delay:300ms]">·</span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {chatError && (
            <p className="text-xs text-destructive">{chatError}</p>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Napisz wiadomość..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={disabled}
              size="icon"
              aria-label="Wyślij"
            >
              <Send size={16} />
            </Button>
          </div>
        </>
      )}

      {upgradeModal && (
        <PersonaUpgradeModal
          personaId={upgradeModal}
          onClose={() => setUpgradeModal(null)}
        />
      )}
    </div>
  );
}
