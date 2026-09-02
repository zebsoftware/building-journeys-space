import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage } from "@/components/site/CategoryPage";

export const Route = createFileRoute("/creativity")({
  head: () => ({
    meta: [
      { title: "Creativity — The Founder" },
      { name: "description", content: "Art, photography, sketches, poetry, music and design from the community." },
      { property: "og:title", content: "Creativity — The Founder" },
      { property: "og:description", content: "Show what you create." },
    ],
  }),
  component: () => <CategoryPage slug="creativity" />,
});
