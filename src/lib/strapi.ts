export class StrapiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`Strapi request failed with status ${status}`);
    this.name = "StrapiError";
    this.status = status;
    this.body = body;
  }
}

function getConfig(): { baseUrl: string; token: string } {
  const baseUrl = process.env.STRAPI_API_URL;
  const token = process.env.STRAPI_API_TOKEN;
  if (!baseUrl) throw new Error("STRAPI_API_URL is not configured");
  if (!token) throw new Error("STRAPI_API_TOKEN is not configured");
  return { baseUrl, token };
}

export async function strapiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, token } = getConfig();

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new StrapiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
