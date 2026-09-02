import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage } from "@/components/site/CategoryPage";

export const Route = createFileRoute("/ideas")({
  head: () => ({
    meta: [
      { title: "Ideas — The Founder" },
      { name: "description", content: "Startups, opinions, problems worth solving and every 'what if?' that won't leave you alone." },
      { property: "og:title", content: "Ideas — The Founder" },
      { property: "og:description", content: "Explore what you're imagining." },
    ],
  }),
  component: () => <CategoryPage slug="ideas" />,
});
