import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Container, SiteLayout } from "@/components/site/SiteLayout";
import { PostRowItem } from "@/components/site/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { fetchBookmarkedPosts } from "@/lib/engagement";
import type { PostRow } from "@/lib/posts";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks — The Founder" },
      { name: "description", content: "Posts you saved to read again on The Founder." },
      { property: "og:title", content: "Bookmarks — The Founder" },
      { property: "og:description", content: "Your saved reading list." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const { user, loading } = useAuth();
  const { data: posts = [] } = useQuery({
    queryKey: ["bookmarks", user?.id],
    queryFn: async () => (await fetchBookmarkedPosts(user!.id)) as PostRow[],
    enabled: Boolean(user?.id),
  });

  return (
    <SiteLayout>
      <Container className="py-14">
        <h1 className="font-display text-4xl tracking-tight">Bookmarks</h1>
        {loading ? (
          <p className="mt-8 text-sm text-inksoft">Loading…</p>
        ) : !user ? (
          <p className="mt-6 text-sm text-inksoft">
            <Link to="/auth" className="text-ember underline-link">
              Sign in
            </Link>{" "}
            to save posts for later.
          </p>
        ) : posts.length === 0 ? (
          <p className="mt-8 text-sm text-inksoft">You haven't saved anything yet.</p>
        ) : (
          <div className="mt-8 grid gap-x-12 md:grid-cols-2">
            {posts.map((post) => (
              <PostRowItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </Container>
    </SiteLayout>
  );
}
