import { createServerFn } from "@tanstack/react-start";
import { POST_SELECT } from "@/lib/post-select";
import { fetchPublicPostRows } from "@/lib/public-posts.server";
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
    const rows = await fetchPublicPostRows<PostRow>(
      { select: POST_SELECT, slug: `eq.${slug}`, limit: "1" },
      AbortSignal.timeout(1500),
    );
    if (!rows) return { status: "unavailable", post: null };
    const post = rows[0];
    return post?.status === "published"
      ? { status: "published", post }
      : { status: "missing", post: null };
  });
