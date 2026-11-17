import { createServerFn } from "@tanstack/react-start";
import type { PostRow } from "@/lib/posts";

type Result =
  { status: "published"; post: PostRow } | { status: "missing" | "unavailable"; post: null };

export const loadPublicArticle = createServerFn({ method: "GET" })
  .validator((slug: string) => {
    if (typeof slug !== "string" || !slug || slug.length > 160)
      throw new Error("Invalid article URL");
    return slug;
  })
  .handler(async ({ data: slug }): Promise<Result> => {
    // This loader always uses public credentials, never the current user's token
    // or a service key. Drafts can only load through the authenticated client.
    const base = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
    const key =
      process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!base || !key) return { status: "unavailable", post: null };
    try {
      const { POST_SELECT } = await import("@/lib/posts");
      const url = new URL("/rest/v1/posts", base);
      url.search = new URLSearchParams({
        select: POST_SELECT,
        slug: `eq.${slug}`,
        status: "eq.published",
        limit: "1",
      }).toString();
      const headers: Record<string, string> = { apikey: key };
      if (key.startsWith("eyJ")) headers["Authorization"] = `Bearer ${key}`;
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(1500) });
      if (!response.ok) return { status: "unavailable", post: null };
      const rows = (await response.json()) as PostRow[];
      const post = rows[0];
      return post?.status === "published"
        ? { status: "published", post }
        : { status: "missing", post: null };
    } catch {
      return { status: "unavailable", post: null };
    }
  });
