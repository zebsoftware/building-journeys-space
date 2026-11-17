export async function fetchPublicPostRows<T>(
  params: Record<string, string>,
  signal: AbortSignal,
): Promise<T[] | null> {
  const base = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!base || !key) return null;

  try {
    const url = new URL("/rest/v1/posts", base);
    // Never use a visitor token or service-role key, and only query published posts.
    url.search = new URLSearchParams({ ...params, status: "eq.published" }).toString();
    const headers: Record<string, string> = { apikey: key };
    if (key.startsWith("eyJ")) headers["Authorization"] = `Bearer ${key}`;
    const response = await fetch(url, { headers, signal, cache: "no-store" });
    if (!response.ok) return null;
    const rows: unknown = await response.json();
    return Array.isArray(rows) ? (rows as T[]) : null;
  } catch {
    return null;
  }
}
