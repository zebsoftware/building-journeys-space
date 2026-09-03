import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import heroRoad from "@/assets/hero-road.jpg";
import { Container, SectionHeading, SiteLayout } from "@/components/site/SiteLayout";
import { CreativityCard, JourneyCard, PostCard, PostRowItem } from "@/components/site/PostCard";
import { CATEGORIES } from "@/lib/categories";
import { fetchPosts } from "@/lib/posts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Founder — Everyone is building something" },
      {
        name: "description",
        content:
          "Read and write honest stories, journeys, ideas, creative work and lessons from people building something.",
      },
      { property: "og:title", content: "The Founder — Everyone is building something" },
      {
        property: "og:description",
        content: "A warm, editorial community for the process, not just the finish line.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: latest = [] } = useQuery({
    queryKey: ["posts", "latest"],
    queryFn: () => fetchPosts({ limit: 12 }),
  });
  const { data: journeys = [] } = useQuery({
    queryKey: ["posts", "journeys", "home"],
    queryFn: () => fetchPosts({ category: "journeys", limit: 3 }),
  });
  const { data: ideas = [] } = useQuery({
    queryKey: ["posts", "ideas", "home"],
    queryFn: () => fetchPosts({ category: "ideas", limit: 4 }),
  });
  const { data: creativity = [] } = useQuery({
    queryKey: ["posts", "creativity", "home"],
    queryFn: () => fetchPosts({ category: "creativity", limit: 6 }),
  });

  const [hero, ...rest] = latest;

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="border-b border-line">
        <Container className="grid gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
          <div className="rise">
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              Everyone is building something.
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-inksoft">
              The Founder is a home for the honest middle of the work — the stories, journeys, ideas and
              creative attempts that rarely make it to a highlight reel.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/write"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm text-background transition-opacity hover:opacity-90"
              >
                Start writing <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/stories"
                className="rounded-full border border-line px-6 py-3 text-sm transition-colors hover:bg-muted"
              >
                Read stories
              </Link>
            </div>
          </div>
          <div className="rise rise-2 overflow-hidden rounded-2xl bg-muted">
            <img
              src={heroRoad}
              alt="A quiet road at golden hour"
              className="aspect-[5/4] w-full object-cover"
            />
          </div>
        </Container>
      </section>

      {/* Categories */}
      <section className="border-b border-line">
        <Container className="py-14">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                to={category.path}
                className="group bg-background p-6 transition-colors hover:bg-card"
              >
                <p className="font-display text-xs text-ember">{category.index}</p>
                <h3 className="mt-4 font-display text-lg font-medium">{category.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-inksoft">{category.tagline}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured */}
      <section className="border-b border-line">
        <Container className="py-16">
          <SectionHeading
            eyebrow="Featured"
            title="Fresh from the community"
            action={
              <Link to="/search" className="underline-link text-sm text-inksoft">
                Browse all
              </Link>
            }
          />
          {hero ? (
            <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr]">
              <PostCard post={hero} featured />
              <div>
                {rest.slice(0, 4).map((post) => (
                  <PostRowItem key={post.id} post={post} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-inksoft">No posts published yet.</p>
          )}
        </Container>
      </section>

      {/* Journeys */}
      {journeys.length ? (
        <section className="border-b border-line bg-card">
          <Container className="py-16">
            <SectionHeading
              eyebrow="In progress"
              title="Journeys worth following"
              action={
                <Link to="/journeys" className="underline-link text-sm text-inksoft">
                  All journeys
                </Link>
              }
            />
            <div className="grid gap-6 md:grid-cols-3">
              {journeys.map((post) => (
                <JourneyCard key={post.id} post={post} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Ideas */}
      {ideas.length ? (
        <section className="border-b border-line">
          <Container className="py-16">
            <SectionHeading
              eyebrow="Thinking out loud"
              title="Ideas in the open"
              action={
                <Link to="/ideas" className="underline-link text-sm text-inksoft">
                  All ideas
                </Link>
              }
            />
            <div className="grid gap-x-10 md:grid-cols-2">
              {ideas.map((post) => (
                <PostRowItem key={post.id} post={post} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Creativity */}
      {creativity.length ? (
        <section className="border-b border-line">
          <Container className="py-16">
            <SectionHeading
              eyebrow="Made by hand"
              title="Creativity"
              action={
                <Link to="/creativity" className="underline-link text-sm text-inksoft">
                  All work
                </Link>
              }
            />
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
              {creativity.map((post) => (
                <CreativityCard key={post.id} post={post} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* About */}
      <section>
        <Container className="py-20">
          <div className="rise rounded-2xl bg-inverse px-8 py-16 text-inverse-foreground sm:px-14 sm:py-20">
            <h2 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">The Founder</h2>
            <p className="mt-5 max-w-[34ch] text-lg leading-relaxed opacity-75">
              Everyone is building something. A place for the process, not just the finish line.
            </p>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <Link to="/write" className="underline-link inline-flex items-center gap-2 opacity-80 transition-opacity hover:opacity-100">
                Start Writing <ArrowRight className="size-4" />
              </Link>
              <Link to="/search" className="underline-link opacity-80 transition-opacity hover:opacity-100">
                Search
              </Link>
              <Link to="/stories" className="underline-link opacity-80 transition-opacity hover:opacity-100">
                Stories
              </Link>
              <Link to="/journeys" className="underline-link opacity-80 transition-opacity hover:opacity-100">
                Journeys
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
