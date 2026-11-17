import { createServerFn } from "@tanstack/react-start";
import type { CategorySlug } from "@/lib/categories";
import type { PostSummary } from "@/lib/posts";
import { POST_SUMMARY_SELECT } from "@/lib/post-select";
import { fetchPublicPostRows } from "@/lib/public-posts.server";

export const loadPublicHome = createServerFn({ method: "GET" }).handler(async () => {
  const deadline = AbortSignal.timeout(1800);

  async function list(limit: number, category?: CategorySlug) {
    const rows = await fetchPublicPostRows<PostSummary>(
      {
        select: POST_SUMMARY_SELECT,
        order: "published_at.desc.nullslast",
        limit: String(limit),
        ...(category ? { category: `eq.${category}` } : {}),
      },
      deadline,
    );
    return rows?.filter((post) => post.status === "published") ?? null;
  }

  const [latest, journeys, ideas, creativity] = await Promise.all([
    list(4),
    list(3, "journeys"),
    list(4, "ideas"),
    list(6, "creativity"),
  ]);
  return { latest, journeys, ideas, creativity };
});
