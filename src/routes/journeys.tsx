import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage } from "@/components/site/CategoryPage";

export const Route = createFileRoute("/journeys")({
  head: () => ({
    meta: [
      { title: "Journeys — The Founder" },
      { name: "description", content: "Careers, studies, skills, fitness and long projects documented over time." },
      { property: "og:title", content: "Journeys — The Founder" },
      { property: "og:description", content: "Document where you're going." },
    ],
  }),
  component: () => <CategoryPage slug="journeys" />,
});
