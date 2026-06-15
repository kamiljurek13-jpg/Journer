import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { after } from "next/server";
import { buildSystemPrompt } from "@/lib/chatSystemPrompt";
import { GET_ENTRY_TOOL, MOOD_LABELS } from "@/lib/chat-agent";
import { hybridSearch, buildSearchContext } from "@/lib/journal-ops";
import type { PersonaId } from "@/lib/personas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

interface ChatRequestBody {
  entryBody: string;
  entryDate: string;
  entryTitle?: string;
  entryMood: number;
  message: string;
  accessToken: string;
  persona?: PersonaId;
}

export async function POST(request: Request) {
  const body: ChatRequestBody = await request.json();
  const {
    entryBody,
    entryDate,
    entryTitle,
    entryMood,
    message,
    accessToken,
    persona = "ryan",
  } = body;

  if (!message || !accessToken) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
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
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: historyRows } = await userSupabase
    .from("chat_messages")
    .select("role, content")
    .order("created_at", { ascending: true });

  const history: Anthropic.MessageParam[] = (historyRows ?? []).map((row) => ({
    role: row.role as "user" | "assistant",
    content: row.content as string,
  }));

  const plainText = (entryBody ?? "").replace(/<[^>]+>/g, "").trim();

  const searchResult = await hybridSearch(user.id, message).catch(() => null);
  const searchContext =
    searchResult && "data" in searchResult
      ? buildSearchContext(searchResult.data.results, entryDate)
      : undefined;

  const systemPrompt = buildSystemPrompt(
    {
      date: entryDate,
      title: entryTitle,
      plainText,
      mood: entryMood,
      searchContext: searchContext || undefined,
    },
    persona
  );

  const encoder = new TextEncoder();
  let finalText = "";

  after(async () => {
    if (!finalText) return;
    try {
      await userSupabase.from("chat_messages").insert([
        { user_id: user.id, role: "user", content: message, persona },
        { user_id: user.id, role: "assistant", content: finalText, persona },
      ]);
    } catch (err) {
      console.error("Failed to save chat messages:", err);
    }
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      let loopMessages: Anthropic.MessageParam[] = [
        ...history,
        { role: "user", content: message },
      ];

      try {
        const MAX_ITERATIONS = 5;

        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
          const textByIndex = new Map<number, string>();
          const toolsByIndex = new Map<
            number,
            { id: string; name: string; inputJson: string }
          >();
          let stopReason: string | null = null;

          const stream = anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            system: systemPrompt,
            messages: loopMessages,
            tools: [GET_ENTRY_TOOL],
            max_tokens: 1024,
          });

          for await (const event of stream) {
            switch (event.type) {
              case "content_block_start":
                if (event.content_block.type === "text") {
                  textByIndex.set(event.index, "");
                } else if (event.content_block.type === "tool_use") {
                  toolsByIndex.set(event.index, {
                    id: event.content_block.id,
                    name: event.content_block.name,
                    inputJson: "",
                  });
                }
                break;

              case "content_block_delta":
                if (event.delta.type === "text_delta") {
                  const prev = textByIndex.get(event.index) ?? "";
                  textByIndex.set(event.index, prev + event.delta.text);
                  finalText += event.delta.text;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
                    )
                  );
                } else if (event.delta.type === "input_json_delta") {
                  const tc = toolsByIndex.get(event.index);
                  if (tc) tc.inputJson += event.delta.partial_json;
                }
                break;

              case "message_delta":
                stopReason = event.delta.stop_reason;
                break;
            }
          }

          if (stopReason !== "tool_use" || toolsByIndex.size === 0) break;

          // Build assistant content preserving block order by index
          const allIndices = [
            ...[...textByIndex.keys()].map((idx) => ({ idx, type: "text" as const })),
            ...[...toolsByIndex.keys()].map((idx) => ({ idx, type: "tool" as const })),
          ].sort((a, b) => a.idx - b.idx);

          const assistantContent: Anthropic.ContentBlockParam[] = [];
          for (const { idx, type } of allIndices) {
            if (type === "text") {
              const text = textByIndex.get(idx) ?? "";
              if (text) assistantContent.push({ type: "text", text });
            } else {
              const tc = toolsByIndex.get(idx)!;
              let input: unknown = {};
              try {
                input = JSON.parse(tc.inputJson || "{}");
              } catch {}
              assistantContent.push({
                type: "tool_use",
                id: tc.id,
                name: tc.name,
                input,
              });
            }
          }

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const [, tc] of [...toolsByIndex.entries()].sort(
            ([a], [b]) => a - b
          )) {
            let input: unknown = {};
            try {
              input = JSON.parse(tc.inputJson || "{}");
            } catch {}

            let result = "";
            if (tc.name === "get_entry") {
              const { date } = input as { date: string };
              const { data: entry } = await userSupabase
                .from("entries")
                .select("date, title, body, mood")
                .eq("user_id", user.id)
                .eq("date", date)
                .maybeSingle();

              if (entry) {
                const bodyText = (entry.body as string)
                  .replace(/<[^>]+>/g, "")
                  .trim();
                const moodLabel =
                  MOOD_LABELS[entry.mood as number] ?? String(entry.mood);
                result = [
                  `Entry for ${entry.date}:`,
                  entry.title ? `Title: ${entry.title}` : null,
                  `Mood: ${moodLabel} (${entry.mood}/5)`,
                  "Content:",
                  bodyText || "(No content)",
                ]
                  .filter(Boolean)
                  .join("\n");
              } else {
                result = `No entry found for ${date}.`;
              }
            }

            toolResults.push({
              type: "tool_result",
              tool_use_id: tc.id,
              content: result,
            });
          }

          loopMessages = [
            ...loopMessages,
            { role: "assistant", content: assistantContent },
            { role: "user", content: toolResults },
          ];
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("Chat stream error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
