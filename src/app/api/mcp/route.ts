import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { validatePAT } from "@/lib/api-auth";
import { createOrUpdateEntry, getEntry, askAgent } from "@/lib/journal-ops";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function buildServer(userId: string): McpServer {
  const server = new McpServer({ name: "journer", version: "1.0.0" });

  server.registerTool(
    "create_entry",
    {
      title: "Create or Update Journal Entry",
      description:
        "Creates a new journal entry or updates an existing one for the given date. " +
        "If an entry already exists for that date, only provided fields are updated. " +
        "mood is required when creating a new entry.",
      inputSchema: {
        mood: z.number().int().min(1).max(5).optional().describe(
          "Mood from 1 (very bad) to 5 (great). Required when creating a new entry."
        ),
        title: z.string().optional().describe("Optional entry title."),
        body: z.string().optional().describe("Entry text content."),
        date: z.string().optional().describe(
          "Date in YYYY-MM-DD format. Defaults to today."
        ),
      },
    },
    async (args) => {
      const result = await createOrUpdateEntry(userId, args);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: `Error ${result.status}: ${result.error}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(result.data.entry, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_entry",
    {
      title: "Read Journal Entry",
      description:
        "Returns the journal entry for a specific date. Returns null if no entry exists for that date.",
      inputSchema: {
        date: z.string().describe("Date in YYYY-MM-DD format."),
      },
    },
    async ({ date }) => {
      const result = await getEntry(userId, date);
      if ("error" in result) {
        return {
          content: [{ type: "text", text: `Error ${result.status}: ${result.error}` }],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: result.data.entry
              ? JSON.stringify(result.data.entry, null, 2)
              : "No entry found for this date.",
          },
        ],
      };
    }
  );

  server.registerTool(
    "ask",
    {
      title: "Ask the Ryan Holiday AI Agent",
      description:
        "Sends a message to the Ryan Holiday (Stoic philosophy) AI agent in the context of " +
        "a journal entry. The agent uses the entry content and full conversation history for " +
        "that day to respond. An entry must exist for the given date — call create_entry first if needed.",
      inputSchema: {
        message: z.string().describe("Your question or message to the agent."),
        date: z.string().optional().describe(
          "Entry date to use as context (YYYY-MM-DD). Defaults to today."
        ),
      },
    },
    async ({ message, date }) => {
      const result = await askAgent(userId, { message, date });
      if ("error" in result) {
        return {
          content: [{ type: "text", text: `Error ${result.status}: ${result.error}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: result.data.answer }],
      };
    }
  );

  return server;
}

async function handle(request: Request): Promise<Response> {
  const userId = await validatePAT(request.headers.get("authorization"));
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  const server = buildServer(userId);
  await server.connect(transport);
  return transport.handleRequest(request);
}

export { handle as GET, handle as POST, handle as DELETE };
