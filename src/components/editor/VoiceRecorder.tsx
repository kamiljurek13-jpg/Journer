"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

type State = "idle" | "recording" | "transcribing";

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const [state, setState] = useState<State>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (typeof window === "undefined" || !window.MediaRecorder) return null;

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: mimeType });
      await transcribe(blob, mimeType);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setState("recording");
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setState("transcribing");
  }

  async function transcribe(blob: Blob, mimeType: string) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const form = new FormData();
      form.append("audio", blob, mimeType.includes("webm") ? "recording.webm" : "recording.ogg");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: form,
      });

      if (res.ok) {
        const { text } = await res.json();
        if (text) onTranscription(text);
      }
    } finally {
      setState("idle");
    }
  }

  function handleClick() {
    if (state === "idle") startRecording();
    else if (state === "recording") stopRecording();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "transcribing"}
      title={state === "recording" ? "Zatrzymaj nagrywanie" : "Nagraj głos"}
      className={`px-2 py-1 text-sm rounded transition-colors ${
        state === "recording"
          ? "bg-red-500 text-white hover:bg-red-600"
          : "hover:bg-muted"
      } disabled:opacity-50`}
    >
      {state === "transcribing" ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : state === "recording" ? (
        <Square className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}
