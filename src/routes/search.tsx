import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import { useState } from "react";

import { Container, SiteLayout } from "@/components/site/SiteLayout";
import { PostRowItem } from "@/components/site/PostCard";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import { fetchPosts } from "@/lib/posts";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — The Founder" },
      { name: "description", content: "Search stories, journeys, ideas, creative work and lessons on The Founder." },
      { property: "og:title", content: "Search — The Founder" },
      { property: "og:description", content: "Find the writing you're looking for." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState<CategorySlug | "all">("all");

  const { data: posts = [], isFetching } = useQuery({
    queryKey: ["search", term, category],
    queryFn: () =>
      fetchPosts({
        search: term,
        ...(category === "all" ? {} : { category }),
      }),
  });

  return (
    <SiteLayout>
      <section className="border-b border-line bg-card">
        <Container className="py-14">
          <h1 className="font-display text-4xl tracking-tight">Search</h1>
          <div className="mt-6 flex items-center gap-3 rounded-full border border-line bg-background px-5 py-3">
            <SearchIcon className="size-4 text-inksoft" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search titles, subtitles and writing…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                category === "all" ? "bg-ink text-background" : "text-inksoft hover:bg-muted"
              }`}
            >
              Everything
            </button>
            {CATEGORIES.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setCategory(item.slug)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  category === item.slug ? "bg-ink text-background" : "text-inksoft hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-12">
        {isFetching ? (
          <p className="py-12 text-sm text-inksoft">Searching…</p>
        ) : posts.length === 0 ? (
          <p className="py-12 text-sm text-inksoft">No posts matched that search.</p>
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
