import Anthropic from "@anthropic-ai/sdk";

export const GET_ENTRY_TOOL: Anthropic.Tool = {
  name: "get_entry",
  description:
    "Pobierz wpis dziennika użytkownika z konkretnego dnia. Użyj gdy user wspomina datę lub chcesz porównać wpisy.",
  input_schema: {
    type: "object" as const,
    properties: {
      date: {
        type: "string",
        description: "Data wpisu w formacie YYYY-MM-DD, np. '2026-06-01'",
      },
    },
    required: ["date"],
  },
};

export const MOOD_LABELS: Record<number, string> = {
  1: "Very bad",
  2: "Bad",
  3: "Okay",
  4: "Good",
  5: "Great",
};

interface AgentLoopParams {
  messages: Anthropic.MessageParam[];
  systemPrompt: string;
  anthropic: Anthropic;
  fetchEntry: (date: string) => Promise<string>;
}

export async function runAgentLoop({
  messages,
  systemPrompt,
  anthropic,
  fetchEntry,
}: AgentLoopParams): Promise<string> {
  let loopMessages: Anthropic.MessageParam[] = [...messages];
  let finalText = "";
  const MAX_ITERATIONS = 5;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      system: systemPrompt,
      messages: loopMessages,
      tools: [GET_ENTRY_TOOL],
      max_tokens: 1024,
    });

    for (const block of response.content) {
      if (block.type === "text") {
        finalText += block.text;
      }
    }

    if (response.stop_reason !== "tool_use") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === "tool_use") {
        let result = "";
        if (block.name === "get_entry") {
          const { date } = block.input as { date: string };
          result = await fetchEntry(date);
        }
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
      }
    }

    loopMessages = [
      ...loopMessages,
      { role: "assistant", content: response.content },
      { role: "user", content: toolResults },
    ];
  }

  return finalText;
}
