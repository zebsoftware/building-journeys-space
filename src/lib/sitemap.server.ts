import { fetchPublicPostRows } from "./public-posts.server";

const origin = "https://thefounderblogs.com";
const publicPaths = ["/", "/stories", "/journeys", "/ideas", "/creativity", "/learning"];
const batchSize = 500;
const maxUrls = 50_000;
const uuid = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

type SitemapPost = { id: string; slug: string; status: string };

async function publishedPaths(signal: AbortSignal): Promise<string[] | null> {
  const paths = new Set(publicPaths);
  let cursor: string | undefined;

  while (paths.size < maxUrls) {
    const rows = await fetchPublicPostRows<SitemapPost>(
      {
        select: "id,slug,status",
        order: "id.asc",
        limit: String(Math.min(batchSize, maxUrls - paths.size)),
        ...(cursor ? { id: `gt.${cursor}` } : {}),
      },
      signal,
    );
    if (!rows) return null;
    if (!rows.length) break;

    for (const { status, slug } of rows) {
      if (status !== "published" || typeof slug !== "string" || !slug || slug.length > 160) {
        continue;
      }
      if (slug === "." || slug === ".." || slug.includes("/")) continue;
      paths.add(`/post/${encodeURIComponent(slug)}`);
    }

    const next = rows.at(-1)?.id;
    if (!next || !uuid.test(next) || (cursor && next <= cursor)) return null;
    cursor = next;
  }

  return [...paths];
}

export async function serveSitemap(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(4000)]);
  const paths = await publishedPaths(signal);
  if (!paths) {
    return new Response(request.method === "HEAD" ? null : "Sitemap temporarily unavailable.", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "60" },
    });
  }

  const urls = paths.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(request.method === "HEAD" ? null : xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
