import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, Link2, MessageCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Container, SiteLayout } from "@/components/site/SiteLayout";
import { InitialAvatar } from "@/components/site/InitialAvatar";
import { PostRowItem } from "@/components/site/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { categoryLabel } from "@/lib/categories";
import { compactNumber, formatDate, timeAgo } from "@/lib/format";
import { coverFor } from "@/lib/post-images";
import { fetchPostBySlug, fetchPosts } from "@/lib/posts";
import {
  addComment,
  deleteComment,
  fetchComments,
  fetchEngagement,
  incrementViews,
  toggleBookmark,
  toggleLike,
} from "@/lib/engagement";

export const Route = createFileRoute("/post/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — The Founder` },
      { name: "description", content: "A story from The Founder community." },
      { property: "og:title", content: "The Founder" },
      { property: "og:description", content: "A story from The Founder community." },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const { slug } = useParams({ from: "/post/$slug" });
  const { user, profile, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => fetchPostBySlug(slug),
  });

  useEffect(() => {
    if (post) void incrementViews(slug);
  }, [post, slug]);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", post?.id],
    queryFn: () => fetchComments(post!.id),
    enabled: Boolean(post?.id),
  });

  const { data: engagement } = useQuery({
    queryKey: ["engagement", post?.id, user?.id ?? null],
    queryFn: () => fetchEngagement(post!.id, user?.id ?? null),
    enabled: Boolean(post?.id),
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related", post?.category],
    queryFn: () => fetchPosts({ category: post!.category, limit: 4 }),
    enabled: Boolean(post?.category),
  });

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(post!.id, user!.id, Boolean(engagement?.liked)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["engagement", post?.id] });
      void qc.invalidateQueries({ queryKey: ["post", slug] });
    },
    onError: () => toast.error("Couldn't update your like."),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => toggleBookmark(post!.id, user!.id, Boolean(engagement?.bookmarked)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["engagement", post?.id] });
      toast.success(engagement?.bookmarked ? "Removed from bookmarks" : "Saved to bookmarks");
    },
    onError: () => toast.error("Couldn't update your bookmark."),
  });

  const commentMutation = useMutation({
    mutationFn: () => addComment({ postId: post!.id, authorId: user!.id, body: draft.trim() }),
    onSuccess: () => {
      setDraft("");
      void qc.invalidateQueries({ queryKey: ["comments", post?.id] });
      void qc.invalidateQueries({ queryKey: ["post", slug] });
    },
    onError: () => toast.error("Couldn't post your comment."),
  });

  const removeComment = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["comments", post?.id] }),
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <Container className="py-24 text-center text-sm text-inksoft">Loading…</Container>
      </SiteLayout>
    );
  }

  if (!post) {
    return (
      <SiteLayout>
        <Container className="py-24 text-center">
          <h1 className="font-display text-3xl">This post doesn't exist</h1>
          <Link to="/" className="mt-6 inline-block underline-link text-sm text-inksoft">
            Back home
          </Link>
        </Container>
      </SiteLayout>
    );
  }

  const cover = coverFor(post);
  const canEdit = user?.id === post.author_id || isAdmin;

  return (
    <SiteLayout>
      <article>
        <Container className="max-w-[760px] py-14">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ember">{categoryLabel(post.category)}</p>
          <h1 className="mt-5 font-display text-4xl leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
          {post.subtitle ? (
            <p className="mt-5 text-xl leading-relaxed text-inksoft">{post.subtitle}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-4 border-y border-line py-5">
            <Link
              to="/u/$username"
              params={{ username: post.author?.username ?? "" }}
              className="flex items-center gap-3"
            >
              <InitialAvatar name={post.author?.display_name ?? "Anonymous"} url={post.author?.avatar_url} size={40} />
              <span>
                <span className="block text-sm">{post.author?.display_name ?? "Anonymous"}</span>
                <span className="block text-xs text-inksoft">
                  {formatDate(post.published_at ?? post.created_at)} · {post.read_minutes} min read
                </span>
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              {canEdit ? (
                <Link
                  to="/edit/$id"
                  params={{ id: post.id }}
                  className="rounded-full border border-line px-4 py-2 text-xs transition-colors hover:bg-muted"
                >
                  Edit
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    toast.error("Sign in to like posts.");
                    return;
                  }
                  likeMutation.mutate();
                }}
                className={`flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs transition-colors hover:bg-muted ${
                  engagement?.liked ? "bg-ember/10 text-emberdeep" : ""
                }`}
              >
                <Heart className={`size-3.5 ${engagement?.liked ? "fill-current" : ""}`} />
                {compactNumber(post.like_count)}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    toast.error("Sign in to save posts.");
                    return;
                  }
                  bookmarkMutation.mutate();
                }}
                aria-label="Bookmark"
                className={`grid size-9 place-items-center rounded-full border border-line transition-colors hover:bg-muted ${
                  engagement?.bookmarked ? "bg-ember/10 text-emberdeep" : ""
                }`}
              >
                <Bookmark className={`size-3.5 ${engagement?.bookmarked ? "fill-current" : ""}`} />
              </button>
              <button
                type="button"
                aria-label="Copy link"
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied");
                }}
                className="grid size-9 place-items-center rounded-full border border-line transition-colors hover:bg-muted"
              >
                <Link2 className="size-3.5" />
              </button>
            </div>
          </div>

          {cover ? (
            <img src={cover} alt={post.title} className="mt-10 w-full rounded-xl object-cover" />
          ) : null}

          {post.day_number ? (
            <p className="mt-10 inline-block rounded-full bg-ember/10 px-4 py-1.5 font-display text-sm text-emberdeep">
              Day {post.day_number}
            </p>
          ) : null}

          <div className="article-body mt-8" dangerouslySetInnerHTML={{ __html: post.content }} />

          {post.tags?.length ? (
            <div className="mt-10 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs text-inksoft">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          {post.reflection_prompt ? (
            <div className="mt-12 rounded-2xl bg-inverse px-8 py-10 text-inverse-foreground">
              <p className="text-[11px] uppercase tracking-[0.2em] opacity-70">Reflect</p>
              <p className="mt-4 font-display text-2xl leading-snug">{post.reflection_prompt}</p>
            </div>
          ) : null}
        </Container>

        {/* Comments */}
        <Container className="max-w-[760px] border-t border-line py-14">
          <h2 className="flex items-center gap-3 font-display text-2xl">
            <MessageCircle className="size-5 text-ember" /> {post.comment_count} responses
          </h2>

          {user ? (
            <div className="mt-6">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={4}
                placeholder={`Share your thoughts, ${profile?.display_name?.split(" ")[0] ?? "friend"}…`}
                className="w-full rounded-xl border border-line bg-card p-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                disabled={!draft.trim() || commentMutation.isPending}
                onClick={() => commentMutation.mutate()}
                className="mt-3 rounded-full bg-ink px-5 py-2.5 text-sm text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Post response
              </button>
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-line bg-card p-5 text-sm text-inksoft">
              <Link to="/auth" className="text-ember underline-link">
                Sign in
              </Link>{" "}
              to join the conversation.
            </p>
          )}

          <div className="mt-10 space-y-8">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <InitialAvatar
                  name={comment.author?.display_name ?? "Anonymous"}
                  url={comment.author?.avatar_url}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 text-xs text-inksoft">
                    <span className="text-ink">{comment.author?.display_name ?? "Anonymous"}</span>
                    <span>{timeAgo(comment.created_at)}</span>
                    {user && (user.id === comment.author_id || isAdmin) ? (
                      <button
                        type="button"
                        aria-label="Delete comment"
                        onClick={() => removeComment.mutate(comment.id)}
                        className="ml-auto text-inksoft hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{comment.body}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 ? (
              <p className="text-sm text-inksoft">No responses yet. Be the first.</p>
            ) : null}
          </div>
        </Container>

        {/* Related */}
        {related.filter((item) => item.id !== post.id).length ? (
          <Container className="max-w-[760px] border-t border-line py-14">
            <h2 className="font-display text-2xl">More in {categoryLabel(post.category)}</h2>
            <div className="mt-4">
              {related
                .filter((item) => item.id !== post.id)
                .slice(0, 3)
                .map((item) => (
                  <PostRowItem key={item.id} post={item} />
                ))}
            </div>
          </Container>
        ) : null}
      </article>
    </SiteLayout>
  );
}
