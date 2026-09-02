import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage } from "@/components/site/CategoryPage";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Stories — The Founder" },
      {
        name: "description",
        content: "Real experiences and memorable moments: university, childhood, friendship, travel and the hard days.",
      },
      { property: "og:title", content: "Stories — The Founder" },
      { property: "og:description", content: "Share the moments that made you." },
    ],
  }),
  component: () => <CategoryPage slug="stories" />,
});
