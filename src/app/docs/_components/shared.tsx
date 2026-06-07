export function MethodBadge({ method }: { method: "GET" | "POST" | "DELETE" }) {
  const styles: Record<string, string> = {
    GET: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    POST: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-semibold ${styles[method]}`}
    >
      {method}
    </span>
  );
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg bg-zinc-950 text-zinc-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

export function ResponseBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg border border-border bg-muted/50 p-4 text-xs font-mono overflow-x-auto leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  );
}

export function ParamsTable({
  rows,
}: {
  rows: { name: string; type: string; required?: boolean; description: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-semibold text-muted-foreground py-2 pr-6">
              Name
            </th>
            <th className="text-left text-xs font-semibold text-muted-foreground py-2 pr-6">
              Type
            </th>
            <th className="text-left text-xs font-semibold text-muted-foreground py-2">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border/50">
              <td className="py-2.5 pr-6 align-top">
                <code className="text-xs font-mono">{row.name}</code>
                {row.required && <span className="ml-1.5 text-xs text-rose-500">*</span>}
              </td>
              <td className="py-2.5 pr-6 align-top">
                <code className="text-xs font-mono text-muted-foreground">{row.type}</code>
              </td>
              <td className="py-2.5 text-sm text-muted-foreground align-top">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SectionDivider() {
  return <hr className="border-border" />;
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
      {children}
    </div>
  );
}
