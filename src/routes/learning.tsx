import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage } from "@/components/site/CategoryPage";

export const Route = createFileRoute("/learning")({
  head: () => ({
    meta: [
      { title: "Learning & Growth — The Founder" },
      { name: "description", content: "Books, skills, lessons, mistakes and the quiet discipline of getting better." },
      { property: "og:title", content: "Learning & Growth — The Founder" },
      { property: "og:description", content: "Share what you're becoming." },
    ],
  }),
  component: () => <CategoryPage slug="learning" />,
});
