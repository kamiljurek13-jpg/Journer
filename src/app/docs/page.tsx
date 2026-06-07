import Link from "next/link";

export const dynamic = "force-static";

const BASE_URL = "https://journer.vercel.app";

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-semibold ${
        method === "POST"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
      }`}
    >
      {method}
    </span>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg bg-zinc-950 text-zinc-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function ParamsTable({
  rows,
}: {
  rows: { name: string; type: string; required?: boolean; description: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-semibold text-muted-foreground py-2 pr-6">Name</th>
            <th className="text-left text-xs font-semibold text-muted-foreground py-2 pr-6">Type</th>
            <th className="text-left text-xs font-semibold text-muted-foreground py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border/50">
              <td className="py-2.5 pr-6 align-top">
                <code className="text-xs font-mono">{row.name}</code>
                {row.required && (
                  <span className="ml-1.5 text-xs text-rose-500">*</span>
                )}
              </td>
              <td className="py-2.5 pr-6 align-top">
                <code className="text-xs font-mono text-muted-foreground">{row.type}</code>
              </td>
              <td className="py-2.5 text-sm text-muted-foreground align-top">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResponseBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg border border-border bg-muted/50 p-4 text-xs font-mono overflow-x-auto leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 sticky top-0 h-screen border-r overflow-y-auto py-10 px-6 hidden md:flex flex-col gap-1">
        <Link href="/" className="text-sm font-semibold mb-6 block hover:opacity-80 transition-opacity">
          ← Journer
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          API Reference
        </p>
        <nav className="flex flex-col gap-0.5">
          <a
            href="#authentication"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Authentication
          </a>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-4 mb-2">
            Endpoints
          </p>
          <a
            href="#create"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 pl-2"
          >
            Create Entry
          </a>
          <a
            href="#ask"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 pl-2"
          >
            Ask
          </a>
          <a
            href="#read"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 pl-2"
          >
            Read Entry
          </a>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-3xl mx-auto px-8 py-12 space-y-20">

          {/* Header */}
          <div className="space-y-3 pb-4 border-b border-border">
            <h1 className="text-2xl font-bold">Journer API</h1>
            <p className="text-muted-foreground">
              HTTP API for programmatic access to your journal entries and AI agent. All endpoints are scoped to the authenticated user.
            </p>
            <p className="text-sm font-mono text-muted-foreground">
              Base URL: <code className="text-foreground">{BASE_URL}/api/v1</code>
            </p>
          </div>

          {/* Authentication */}
          <section id="authentication" className="space-y-5 scroll-mt-8">
            <div>
              <h2 className="text-lg font-semibold">Authentication</h2>
              <p className="text-sm text-muted-foreground mt-1">
                All API requests require a Personal Access Token (PAT) in the{" "}
                <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">Authorization</code> header.
              </p>
            </div>
            <CodeBlock>{`Authorization: Bearer jour_<your_token>`}</CodeBlock>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Generate your token in{" "}
              <Link href="/settings" className="text-foreground underline underline-offset-4 hover:no-underline">
                Settings → API Tokens
              </Link>
              . Tokens are shown only once on creation.
            </div>
          </section>

          {/* Divider */}
          <hr className="border-border" />

          {/* Create Entry */}
          <section id="create" className="space-y-6 scroll-mt-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MethodBadge method="POST" />
                <code className="text-sm font-mono">/api/v1/entries</code>
              </div>
              <h2 className="text-lg font-semibold mt-2">Create Entry</h2>
              <p className="text-sm text-muted-foreground">
                Creates a new journal entry for the specified date. If an entry for that date already exists, it is updated with the provided fields.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Request body</h3>
              <ParamsTable
                rows={[
                  { name: "mood", type: "integer", required: true, description: "Mood level from 1 (very bad) to 5 (great). Required when creating a new entry." },
                  { name: "title", type: "string", description: "Optional entry title." },
                  { name: "body", type: "string", description: "Entry content — plain text or HTML. Defaults to empty string." },
                  { name: "date", type: "string (YYYY-MM-DD)", description: "Date of the entry. Defaults to today." },
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
                  { name: "400", type: "", description: "Invalid date format, mood out of range, or mood missing for a new entry." },
                  { name: "401", type: "", description: "Missing or invalid token." },
                  { name: "500", type: "", description: "Database error." },
                ]}
              />
            </div>
          </section>

          {/* Ask */}
          <section id="ask" className="space-y-6 scroll-mt-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MethodBadge method="POST" />
                <code className="text-sm font-mono">/api/v1/ask</code>
              </div>
              <h2 className="text-lg font-semibold mt-2">Ask</h2>
              <p className="text-sm text-muted-foreground">
                Sends a message to the Ryan Holiday AI agent in the context of a journal entry. The agent uses the entry content and conversation history for that day to respond.
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
              An entry must exist for the given date before you can ask. Use{" "}
              <code className="text-xs font-mono">POST /api/v1/entries</code> first if needed.
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Request body</h3>
              <ParamsTable
                rows={[
                  { name: "message", type: "string", required: true, description: "Question or message to send to the agent." },
                  { name: "date", type: "string (YYYY-MM-DD)", description: "Entry date to use as context. Defaults to today." },
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
                Each day has its own conversation thread. Subsequent calls with the same date continue the same conversation, giving the agent full context of your earlier messages.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Error codes</h3>
              <ParamsTable
                rows={[
                  { name: "400", type: "", description: "Missing message or invalid date format." },
                  { name: "401", type: "", description: "Missing or invalid token." },
                  { name: "404", type: "", description: "No entry found for the given date." },
                  { name: "500", type: "", description: "Database or AI provider error." },
                ]}
              />
            </div>
          </section>

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
                <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">null</code> if no entry exists for that date.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Path parameters</h3>
              <ParamsTable
                rows={[
                  { name: "date", type: "string (YYYY-MM-DD)", required: true, description: "The date of the entry to retrieve." },
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
                  { name: "400", type: "", description: "Invalid date format. Use YYYY-MM-DD." },
                  { name: "401", type: "", description: "Missing or invalid token." },
                  { name: "500", type: "", description: "Database error." },
                ]}
              />
            </div>
          </section>

          <div className="pt-8 border-t border-border text-xs text-muted-foreground">
            Journer API — responses are JSON. All timestamps are ISO 8601 (UTC).
          </div>
        </div>
      </main>
    </div>
  );
}
