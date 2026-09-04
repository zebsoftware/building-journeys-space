import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Container, SiteLayout } from "@/components/site/SiteLayout";
import { InitialAvatar } from "@/components/site/InitialAvatar";
import { PostRowItem } from "@/components/site/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { compactNumber } from "@/lib/format";
import { fetchAuthorPosts, fetchProfileByUsername } from "@/lib/posts";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — The Founder` },
      { name: "description", content: `Posts written by @${params.username} on The Founder.` },
      { property: "og:title", content: `@${params.username} — The Founder` },
      { property: "og:description", content: `Read what @${params.username} is building.` },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = useParams({ from: "/u/$username" });
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfileByUsername(username),
  });

  const isOwner = Boolean(user && profile && user.id === profile.id);

  const { data: posts = [] } = useQuery({
    queryKey: ["author-posts", profile?.id, isOwner],
    queryFn: () => (profile ? fetchAuthorPosts(profile.id, isOwner) : Promise.resolve([])),
    enabled: Boolean(profile?.id),
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <Container className="py-24 text-center text-sm text-inksoft">Loading…</Container>
      </SiteLayout>
    );
  }

  if (!profile) {
    return (
      <SiteLayout>
        <Container className="py-24 text-center">
          <h1 className="font-display text-3xl">No writer here</h1>
          <Link to="/" className="mt-6 inline-block underline-link text-sm text-inksoft">
            Back home
          </Link>
        </Container>
      </SiteLayout>
    );
  }

  const totalLikes = posts.reduce((sum, post) => sum + (post.like_count ?? 0), 0);

  return (
    <SiteLayout>
      <section className="border-b border-line bg-card">
        <Container className="flex flex-wrap items-center gap-6 py-14">
          <InitialAvatar name={profile.display_name} url={profile.avatar_url} size={84} />
          <div>
            <h1 className="font-display text-4xl tracking-tight">{profile.display_name}</h1>
            <p className="mt-1 text-sm text-inksoft">@{profile.username}</p>
            {profile.bio ? (
              <p className="mt-4 max-w-[56ch] text-sm leading-relaxed text-inksoft">{profile.bio}</p>
            ) : null}
          </div>
          <div className="ml-auto flex gap-8 text-sm">
            <div>
              <p className="font-display text-2xl">{posts.length}</p>
              <p className="text-xs uppercase tracking-[0.15em] text-inksoft">Posts</p>
            </div>
            <div>
              <p className="font-display text-2xl">{compactNumber(totalLikes)}</p>
              <p className="text-xs uppercase tracking-[0.15em] text-inksoft">Likes</p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        {posts.length === 0 ? (
          <p className="py-12 text-sm text-inksoft">Nothing published yet.</p>
        ) : (
          <div className="grid gap-x-12 md:grid-cols-2">
            {posts.map((post) => (
              <div key={post.id}>
                {post.status === "draft" ? (
                  <span className="mt-6 inline-block rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-inksoft">
                    Draft
                  </span>
                ) : null}
                <PostRowItem post={post} />
              </div>
            ))}
          </div>
        )}
      </Container>
    </SiteLayout>
  );
}
