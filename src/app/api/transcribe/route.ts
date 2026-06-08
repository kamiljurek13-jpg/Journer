import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.replace("Bearer ", "").trim();

  if (!accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const {
    data: { user },
  } = await userSupabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!audio || !(audio instanceof Blob)) {
    return Response.json({ error: "Missing audio" }, { status: 400 });
  }

  const groqForm = new FormData();
  groqForm.append("file", audio, "recording.webm");
  groqForm.append("model", "whisper-large-v3-turbo");
  groqForm.append("language", "pl");
  groqForm.append("response_format", "json");
  groqForm.append(
    "prompt",
    "To jest nagranie do pamiętnika. Używaj interpunkcji: kropek, przecinków, wielkich liter. Zachowaj naturalny, potoczny ton wypowiedzi."
  );

  const groqRes = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: groqForm,
    }
  );

  if (!groqRes.ok) {
    const err = await groqRes.text();
    console.error("Groq transcription error:", err);
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }

  const result = await groqRes.json();
  return Response.json({ text: result.text ?? "" });
}
