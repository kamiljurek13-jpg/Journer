const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

export function buildEmbeddingText(entry: {
  date: string;
  title: string | null;
  body: string;
}): string {
  const parts: string[] = [entry.date];
  if (entry.title) parts.push(entry.title);
  const plain = stripHtml(entry.body);
  if (plain) parts.push(plain);
  return parts.join("\n");
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("generateEmbedding: OPENAI_API_KEY not set");
    return null;
  }
  try {
    const res = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
    });
    if (!res.ok) {
      console.error("OpenAI embeddings error:", res.status, await res.text());
      return null;
    }
    const json = await res.json();
    return json.data[0].embedding as number[];
  } catch (err) {
    console.error("generateEmbedding fetch failed:", err);
    return null;
  }
}
