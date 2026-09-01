import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Container, SiteLayout } from "@/components/site/SiteLayout";
import { CreativityCard, JourneyCard, PostRowItem } from "@/components/site/PostCard";
import { CATEGORY_BY_SLUG, type CategorySlug } from "@/lib/categories";
import { fetchPosts, type Sort } from "@/lib/posts";

const SORTS: { key: Sort; label: string }[] = [
  { key: "latest", label: "Latest" },
  { key: "popular", label: "Most liked" },
  { key: "discussed", label: "Most discussed" },
];

export function CategoryPage({ slug }: { slug: CategorySlug }) {
  const meta = CATEGORY_BY_SLUG[slug];
  const [sort, setSort] = useState<Sort>("latest");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", slug, sort],
    queryFn: () => fetchPosts({ category: slug, sort }),
  });

  return (
    <SiteLayout>
      <section className="border-b border-line bg-card">
        <Container className="py-16">
          <p className="font-display text-sm text-ember">{meta.index}</p>
          <h1 className="mt-4 font-display text-5xl tracking-tight">{meta.label}</h1>
          <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-inksoft">{meta.blurb}</p>
        </Container>
      </section>

      <Container className="py-12">
        <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-line pb-4">
          {SORTS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSort(option.key)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                sort === option.key ? "bg-ink text-background" : "text-inksoft hover:bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-inksoft">{posts.length} posts</span>
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-inksoft">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="py-16 text-center text-sm text-inksoft">
            Nothing here yet — this could be your story.
          </p>
        ) : slug === "creativity" ? (
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            {posts.map((post) => (
              <CreativityCard key={post.id} post={post} />
            ))}
          </div>
        ) : slug === "journeys" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <JourneyCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="grid gap-x-12 md:grid-cols-2">
            {posts.map((post) => (
              <PostRowItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </Container>
    </SiteLayout>
  );
}
