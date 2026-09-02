import { createFileRoute } from "@tanstack/react-router";

import { PostForm } from "@/components/site/PostForm";

export const Route = createFileRoute("/write")({
  head: () => ({
    meta: [
      { title: "Write a post — The Founder" },
      { name: "description", content: "Write and publish your story, journey, idea or creative work on The Founder." },
      { property: "og:title", content: "Write a post — The Founder" },
      { property: "og:description", content: "Everyone is building something. Share yours." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <PostForm />,
});
