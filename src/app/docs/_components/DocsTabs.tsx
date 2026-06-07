"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TokenBanner } from "./TokenBanner";
import {
  MethodBadge,
  CodeBlock,
  ResponseBlock,
  ParamsTable,
  SectionDivider,
  Note,
  Warning,
} from "./shared";

const BASE_URL = "https://journer.vercel.app";
const MCP_URL = `${BASE_URL}/api/mcp`;

type Tab = "api" | "mcp";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-medium px-3 py-1 rounded-md transition-colors ${
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ApiContent() {
  return (
    <div className="space-y-20">
      {/* Authentication */}
      <section id="authentication" className="space-y-5 scroll-mt-8">
        <div>
          <h2 className="text-lg font-semibold">Authentication</h2>
          <p className="text-sm text-muted-foreground mt-1">
            All API requests require a Personal Access Token (PAT) in the{" "}
            <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
              Authorization
            </code>{" "}
            header.
          </p>
        </div>
        <CodeBlock>{`Authorization: Bearer jour_<your_token>`}</CodeBlock>
        <Note>
          Generate your token above. Tokens are shown only once on creation.
        </Note>
      </section>

      <SectionDivider />

      {/* Create Entry */}
      <section id="create" className="space-y-6 scroll-mt-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MethodBadge method="POST" />
            <code className="text-sm font-mono">/api/v1/entries</code>
          </div>
          <h2 className="text-lg font-semibold mt-2">Create Entry</h2>
          <p className="text-sm text-muted-foreground">
            Creates a new journal entry for the specified date. If an entry for
            that date already exists, it is updated with the provided fields.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Request body</h3>
          <ParamsTable
            rows={[
              {
                name: "mood",
                type: "integer",
                required: true,
                description:
                  "Mood level from 1 (very bad) to 5 (great). Required when creating a new entry.",
              },
              { name: "title", type: "string", description: "Optional entry title." },
              {
                name: "body",
                type: "string",
                description: "Entry content — plain text or HTML. Defaults to empty string.",
              },
              {
                name: "date",
                type: "string (YYYY-MM-DD)",
                description: "Date of the entry. Defaults to today.",
              },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            <span className="text-rose-500">*</span> required when creating a new entry
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Example request</h3>
          <CodeBlock>{`curl -X POST ${BASE_URL}/api/v1/entries \\
  -H "Authorization: Bearer jour_<token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mood": 4,
    "title": "Good day",
    "body": "Finished the project. Feeling accomplished."
  }'`}</CodeBlock>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Response</h3>
          <ResponseBlock>{`{
  "entry": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-06-07",
    "title": "Good day",
    "body": "Finished the project. Feeling accomplished.",
    "mood": 4,
    "createdAt": "2026-06-07T10:00:00.000Z",
    "updatedAt": "2026-06-07T10:00:00.000Z"
  }
}`}</ResponseBlock>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Error codes</h3>
          <ParamsTable
            rows={[
              {
                name: "400",
                type: "",
                description:
                  "Invalid date format, mood out of range, or mood missing for a new entry.",
              },
              { name: "401", type: "", description: "Missing or invalid token." },
              { name: "500", type: "", description: "Database error." },
            ]}
          />
        </div>
      </section>

      <SectionDivider />

      {/* Ask */}
      <section id="ask" className="space-y-6 scroll-mt-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MethodBadge method="POST" />
            <code className="text-sm font-mono">/api/v1/ask</code>
          </div>
          <h2 className="text-lg font-semibold mt-2">Ask</h2>
          <p className="text-sm text-muted-foreground">
            Sends a message to the Ryan Holiday AI agent in the context of a journal
            entry. The agent uses the entry content and conversation history for that
            day to respond.
          </p>
        </div>

        <Warning>
          An entry must exist for the given date before you can ask. Use{" "}
          <code className="text-xs font-mono">POST /api/v1/entries</code> first if needed.
        </Warning>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Request body</h3>
          <ParamsTable
            rows={[
              {
                name: "message",
                type: "string",
                required: true,
                description: "Question or message to send to the agent.",
              },
              {
                name: "date",
                type: "string (YYYY-MM-DD)",
                description: "Entry date to use as context. Defaults to today.",
              },
            ]}
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Example request</h3>
          <CodeBlock>{`curl -X POST ${BASE_URL}/api/v1/ask \\
  -H "Authorization: Bearer jour_<token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What should I focus on today?",
    "date": "2026-06-07"
  }'`}</CodeBlock>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Response</h3>
          <ResponseBlock>{`{
  "answer": "You finished the project — good. Now the question is what you do with the momentum. Seneca: 'While we wait for life to begin, life passes.' What's the next problem worth solving?"
}`}</ResponseBlock>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Conversation history</h3>
          <p className="text-sm text-muted-foreground">
            Each day has its own conversation thread. Subsequent calls with the same
            date continue the same conversation, giving the agent full context of your
            earlier messages.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Error codes</h3>
          <ParamsTable
            rows={[
              { name: "400", type: "", description: "Missing message or invalid date format." },
              { name: "401", type: "", description: "Missing or invalid token." },
              { name: "404", type: "", description: "No entry found for the given date." },
              {
                name: "500",
                type: "",
                description: "Database or AI provider error.",
              },
            ]}
          />
        </div>
      </section>

      <SectionDivider />

      {/* Read Entry */}
      <section id="read" className="space-y-6 scroll-mt-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MethodBadge method="GET" />
            <code className="text-sm font-mono">/api/v1/entries/:date</code>
          </div>
          <h2 className="text-lg font-semibold mt-2">Read Entry</h2>
          <p className="text-sm text-muted-foreground">
            Returns the journal entry for a specific date. Returns{" "}
            <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">null</code>{" "}
            if no entry exists for that date.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Path parameters</h3>
          <ParamsTable
            rows={[
              {
                name: "date",
                type: "string (YYYY-MM-DD)",
                required: true,
                description: "The date of the entry to retrieve.",
              },
            ]}
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Example request</h3>
          <CodeBlock>{`curl ${BASE_URL}/api/v1/entries/2026-06-07 \\
  -H "Authorization: Bearer jour_<token>"`}</CodeBlock>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Response — entry found</h3>
          <ResponseBlock>{`{
  "entry": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-06-07",
    "title": "Good day",
    "body": "Finished the project. Feeling accomplished.",
    "mood": 4,
    "createdAt": "2026-06-07T10:00:00.000Z",
    "updatedAt": "2026-06-07T10:00:00.000Z"
  }
}`}</ResponseBlock>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Response — no entry</h3>
          <ResponseBlock>{`{
  "entry": null
}`}</ResponseBlock>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Error codes</h3>
          <ParamsTable
            rows={[
              {
                name: "400",
                type: "",
                description: "Invalid date format. Use YYYY-MM-DD.",
              },
              { name: "401", type: "", description: "Missing or invalid token." },
              { name: "500", type: "", description: "Database error." },
            ]}
          />
        </div>
      </section>
    </div>
  );
}

function McpContent() {
  return (
    <div className="space-y-20">
      {/* Connect */}
      <section id="mcp-connect" className="space-y-5 scroll-mt-8">
        <div>
          <h2 className="text-lg font-semibold">Connect your MCP client</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Journer exposes a Remote HTTP MCP server. Any client that supports the{" "}
            <a
              href="https://spec.modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:no-underline"
            >
              MCP Streamable HTTP transport
            </a>{" "}
            (spec 2025-03-26) can connect.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Server URL</h3>
          <CodeBlock>{MCP_URL}</CodeBlock>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Required header</h3>
          <CodeBlock>{`Authorization: Bearer jour_<your_token>`}</CodeBlock>
          <Note>
            Use the same{" "}
            <code className="text-xs font-mono">jour_</code> token from the generator
            above. Tokens are scoped to your account and can be revoked anytime from{" "}
            <Link href="/settings" className="underline underline-offset-4 hover:no-underline">
              Settings
            </Link>
            .
          </Note>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Transport</h3>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground font-medium">Streamable HTTP</strong> —
            stateless, one session per request, supports both JSON and SSE responses.
            No persistent connection required.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* Tools */}
      <section id="mcp-tools" className="space-y-8 scroll-mt-8">
        <div>
          <h2 className="text-lg font-semibold">Available tools</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The MCP server exposes three tools that mirror the REST API. All operations
            are scoped to the authenticated user.
          </p>
        </div>

        {/* create_entry */}
        <div className="space-y-4">
          <div className="space-y-1">
            <code className="text-sm font-mono font-semibold">create_entry</code>
            <p className="text-sm text-muted-foreground">
              Creates a new journal entry or updates an existing one for the given date.
              If an entry already exists for that date, only the provided fields are
              updated.
            </p>
          </div>
          <ParamsTable
            rows={[
              {
                name: "mood",
                type: "integer",
                required: true,
                description:
                  "Mood from 1 (very bad) to 5 (great). Required when creating a new entry.",
              },
              { name: "title", type: "string", description: "Optional entry title." },
              { name: "body", type: "string", description: "Entry text content." },
              {
                name: "date",
                type: "string (YYYY-MM-DD)",
                description: "Entry date. Defaults to today.",
              },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            <span className="text-rose-500">*</span> required when creating a new entry
          </p>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Returns
            </p>
            <ResponseBlock>{`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2026-06-07",
  "title": "Good day",
  "body": "Finished the project.",
  "mood": 4,
  "createdAt": "2026-06-07T10:00:00.000Z",
  "updatedAt": "2026-06-07T10:00:00.000Z"
}`}</ResponseBlock>
          </div>
        </div>

        <SectionDivider />

        {/* get_entry */}
        <div className="space-y-4">
          <div className="space-y-1">
            <code className="text-sm font-mono font-semibold">get_entry</code>
            <p className="text-sm text-muted-foreground">
              Returns the journal entry for a specific date. Returns a &quot;No entry found&quot;
              message if no entry exists for that date.
            </p>
          </div>
          <ParamsTable
            rows={[
              {
                name: "date",
                type: "string (YYYY-MM-DD)",
                required: true,
                description: "The date of the entry to retrieve.",
              },
            ]}
          />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Returns
            </p>
            <ResponseBlock>{`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2026-06-07",
  "title": "Good day",
  "body": "Finished the project.",
  "mood": 4,
  "createdAt": "2026-06-07T10:00:00.000Z",
  "updatedAt": "2026-06-07T10:00:00.000Z"
}`}</ResponseBlock>
          </div>
        </div>

        <SectionDivider />

        {/* ask */}
        <div className="space-y-4">
          <div className="space-y-1">
            <code className="text-sm font-mono font-semibold">ask</code>
            <p className="text-sm text-muted-foreground">
              Sends a message to the Ryan Holiday (Stoic philosophy) AI agent in the
              context of a journal entry. The agent reads the entry and the full
              conversation history for that day before responding. An entry must exist
              for the given date — call{" "}
              <code className="text-xs font-mono">create_entry</code> first if needed.
            </p>
          </div>
          <ParamsTable
            rows={[
              {
                name: "message",
                type: "string",
                required: true,
                description: "Your question or message to the agent.",
              },
              {
                name: "date",
                type: "string (YYYY-MM-DD)",
                description: "Entry date to use as context. Defaults to today.",
              },
            ]}
          />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Returns
            </p>
            <ResponseBlock>{`You finished the project — good. Now the question is what you do with the momentum. Seneca: 'While we wait for life to begin, life passes.' What's the next problem worth solving?`}</ResponseBlock>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Auth */}
      <section id="mcp-auth" className="space-y-5 scroll-mt-8">
        <div>
          <h2 className="text-lg font-semibold">Authentication</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Every request to{" "}
            <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
              /api/mcp
            </code>{" "}
            must include an{" "}
            <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
              Authorization
            </code>{" "}
            header with a valid{" "}
            <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
              jour_
            </code>{" "}
            token. The server validates the token on every call and scopes all tool
            operations to your account — entries from other users are never accessible.
          </p>
        </div>
        <Note>
          Tokens never expire automatically. Revoke them anytime from{" "}
          <Link href="/settings" className="text-foreground underline underline-offset-4 hover:no-underline">
            Settings → API Tokens
          </Link>
          . You can generate multiple tokens for different clients and revoke them
          individually.
        </Note>
      </section>
    </div>
  );
}

export function DocsTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("api");

  useEffect(() => {
    if (window.location.hash === "#mcp") setActiveTab("mcp");
  }, []);

  useEffect(() => {
    window.location.hash = activeTab === "mcp" ? "#mcp" : "#api";
  }, [activeTab]);

  const apiNav = (
    <>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        API Reference
      </p>
      <nav className="flex flex-col gap-0.5">
        <a href="#authentication" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
          Authentication
        </a>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-2">
          Endpoints
        </p>
        <a href="#create" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 pl-2">
          Create Entry
        </a>
        <a href="#ask" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 pl-2">
          Ask
        </a>
        <a href="#read" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 pl-2">
          Read Entry
        </a>
      </nav>
    </>
  );

  const mcpNav = (
    <>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        MCP Reference
      </p>
      <nav className="flex flex-col gap-0.5">
        <a href="#mcp-connect" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
          Connect
        </a>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-2">
          Tools
        </p>
        <a href="#mcp-tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 pl-2">
          create_entry
        </a>
        <a href="#mcp-tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 pl-2">
          get_entry
        </a>
        <a href="#mcp-tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 pl-2">
          ask
        </a>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-2">
          Security
        </p>
        <a href="#mcp-auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
          Authentication
        </a>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 sticky top-0 h-screen border-r overflow-y-auto py-10 px-6 hidden md:flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm font-semibold mb-4 block hover:opacity-80 transition-opacity"
        >
          ← Journer
        </Link>

        {/* Tab switcher in sidebar */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-lg bg-muted/50 border border-border">
          <TabButton active={activeTab === "api"} onClick={() => setActiveTab("api")}>
            API
          </TabButton>
          <TabButton active={activeTab === "mcp"} onClick={() => setActiveTab("mcp")}>
            MCP
          </TabButton>
        </div>

        {activeTab === "api" ? apiNav : mcpNav}
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="space-y-3 pb-4 border-b border-border mb-8">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold">
                Journer {activeTab === "mcp" ? "MCP" : "API"}
              </h1>
              {/* Tab switcher in header (mobile + desktop) */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border md:hidden">
                <TabButton active={activeTab === "api"} onClick={() => setActiveTab("api")}>
                  API
                </TabButton>
                <TabButton active={activeTab === "mcp"} onClick={() => setActiveTab("mcp")}>
                  MCP
                </TabButton>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              {activeTab === "api"
                ? "HTTP API for programmatic access to your journal entries and AI agent. All endpoints are scoped to the authenticated user."
                : "Remote HTTP MCP server — connect any MCP-compatible AI agent to read and write journal entries."}
            </p>
            <p className="text-sm font-mono text-muted-foreground">
              {activeTab === "api" ? (
                <>
                  Base URL:{" "}
                  <code className="text-foreground">{BASE_URL}/api/v1</code>
                </>
              ) : (
                <>
                  MCP URL:{" "}
                  <code className="text-foreground">{MCP_URL}</code>
                </>
              )}
            </p>
          </div>

          {/* Token banner — always visible */}
          <TokenBanner />

          {/* Tab content */}
          {activeTab === "api" ? <ApiContent /> : <McpContent />}

          <div className="pt-8 mt-16 border-t border-border text-xs text-muted-foreground">
            Journer API &amp; MCP — responses are JSON. All timestamps are ISO 8601 (UTC).
          </div>
        </div>
      </main>
    </div>
  );
}
