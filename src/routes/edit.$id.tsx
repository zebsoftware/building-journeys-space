import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PostForm } from "@/components/site/PostForm";
import { Container, SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import type { PostRow } from "@/lib/posts";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit post — The Founder" },
      { name: "description", content: "Edit and republish your post on The Founder." },
      { property: "og:title", content: "Edit post — The Founder" },
      { property: "og:description", content: "Refine your writing before you publish." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditPage,
});

function EditPage() {
  const { id } = useParams({ from: "/edit/$id" });
  const { user, isAdmin, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["post-edit", id, user?.id],
    enabled: !loading && Boolean(user),
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (row as unknown as PostRow) ?? null;
    },
  });

  if (loading || isLoading) {
    return (
      <SiteLayout>
        <Container className="py-24 text-center text-sm text-inksoft">Loading…</Container>
      </SiteLayout>
    );
  }

  if (!user || !data || (data.author_id !== user.id && !isAdmin)) {
    return (
      <SiteLayout>
        <Container className="py-24 text-center">
          <h1 className="font-display text-3xl">Post not found</h1>
        </Container>
      </SiteLayout>
    );
  }

  return <PostForm existing={data} />;
}
