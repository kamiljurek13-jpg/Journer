import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase-admin";
import { validatePAT } from "@/lib/api-auth";
import { buildSystemPrompt } from "@/lib/chatSystemPrompt";
import { runAgentLoop, MOOD_LABELS } from "@/lib/chat-agent";
import { todayString } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  const userId = await validatePAT(request.headers.get("authorization"));
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const message: string = typeof body.message === "string" ? body.message.trim() : "";
  const date: string = typeof body.date === "string" ? body.date : todayString();

  if (!message) return json({ error: "message is required" }, 400);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "Invalid date format. Use YYYY-MM-DD." }, 400);
  }

  const admin = createAdminClient();

  const { data: entry, error: entryError } = await admin
    .from("entries")
    .select("id, date, title, body, mood")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (entryError) return json({ error: "Failed to fetch entry" }, 500);
  if (!entry) {
    return json({ error: `No entry found for ${date}. Create an entry first using POST /api/v1/entries.` }, 404);
  }

  const { data: historyRows } = await admin
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", userId)
    .eq("entry_id", entry.id)
    .order("created_at", { ascending: true });

  const history: Anthropic.MessageParam[] = (historyRows ?? []).map((row) => ({
    role: row.role as "user" | "assistant",
    content: row.content as string,
  }));

  const plainText = ((entry.body as string) ?? "").replace(/<[^>]+>/g, "").trim();
  const systemPrompt = buildSystemPrompt({
    date: entry.date as string,
    title: (entry.title as string | null) ?? undefined,
    plainText,
    mood: entry.mood as number,
  });

  const answer = await runAgentLoop({
    messages: [...history, { role: "user", content: message }],
    systemPrompt,
    anthropic,
    fetchEntry: async (targetDate: string) => {
      const { data: targetEntry } = await admin
        .from("entries")
        .select("date, title, body, mood")
        .eq("user_id", userId)
        .eq("date", targetDate)
        .maybeSingle();

      if (!targetEntry) return `No entry found for ${targetDate}.`;

      const bodyText = ((targetEntry.body as string) ?? "").replace(/<[^>]+>/g, "").trim();
      const moodLabel = MOOD_LABELS[targetEntry.mood as number] ?? String(targetEntry.mood);
      return [
        `Entry for ${targetEntry.date}:`,
        targetEntry.title ? `Title: ${targetEntry.title}` : null,
        `Mood: ${moodLabel} (${targetEntry.mood}/5)`,
        "Content:",
        bodyText || "(No content)",
      ]
        .filter(Boolean)
        .join("\n");
    },
  });

  await admin.from("chat_messages").insert([
    { user_id: userId, entry_id: entry.id, role: "user", content: message },
    { user_id: userId, entry_id: entry.id, role: "assistant", content: answer },
  ]);

  return json({ answer });
}
