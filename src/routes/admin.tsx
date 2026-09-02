import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Container, SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { categoryLabel } from "@/lib/categories";
import { compactNumber, formatDate } from "@/lib/format";
import type { PostRow } from "@/lib/posts";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — The Founder" },
      { name: "description", content: "Moderate posts, comments and reports across The Founder." },
      { property: "og:title", content: "Admin dashboard — The Founder" },
      { property: "og:description", content: "Community moderation tools." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type ReportRow = {
  id: string;
  reason: string;
  resolved: boolean;
  created_at: string;
  post_id: string | null;
  comment_id: string | null;
};

function AdminPage() {
  const { isAdmin, loading, user } = useAuth();
  const qc = useQueryClient();

  const { data: posts = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,slug,title,category,status,views,like_count,comment_count,created_at,author_id")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as PostRow[];
    },
    enabled: isAdmin,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id,reason,resolved,created_at,post_id,comment_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReportRow[];
    },
    enabled: isAdmin,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "published" }) => {
      const { error } = await supabase.from("posts").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post updated");
    },
    onError: () => toast.error("Couldn't update the post."),
  });

  const removePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post deleted");
    },
  });

  const resolveReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").update({ resolved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  if (loading) {
    return (
      <SiteLayout>
        <Container className="py-24 text-center text-sm text-inksoft">Loading…</Container>
      </SiteLayout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <SiteLayout>
        <Container className="py-24 text-center">
          <h1 className="font-display text-3xl">Admins only</h1>
          <p className="mt-3 text-sm text-inksoft">This dashboard is restricted to moderators.</p>
          <Link to="/" className="mt-6 inline-block underline-link text-sm text-inksoft">
            Back home
          </Link>
        </Container>
      </SiteLayout>
    );
  }

  const published = posts.filter((post) => post.status === "published").length;
  const totalViews = posts.reduce((sum, post) => sum + (post.views ?? 0), 0);

  return (
    <SiteLayout>
      <Container className="py-14">
        <h1 className="font-display text-4xl tracking-tight">Admin dashboard</h1>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {[
            { label: "Posts", value: posts.length },
            { label: "Published", value: published },
            { label: "Views", value: compactNumber(totalViews) },
            { label: "Open reports", value: reports.filter((report) => !report.resolved).length },
          ].map((stat) => (
            <div key={stat.label} className="bg-background p-6">
              <p className="font-display text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.15em] text-inksoft">{stat.label}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 border-b border-line pb-4 font-display text-2xl">Posts</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.15em] text-inksoft">
                <th className="py-3">Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Views</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-t border-line">
                  <td className="max-w-[280px] truncate py-3 pr-4">
                    <Link to="/post/$slug" params={{ slug: post.slug }} className="underline-link">
                      {post.title}
                    </Link>
                  </td>
                  <td className="text-inksoft">{categoryLabel(post.category)}</td>
                  <td>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        post.status === "published" ? "bg-ember/10 text-emberdeep" : "bg-muted text-inksoft"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="text-inksoft">{compactNumber(post.views)}</td>
                  <td className="text-inksoft">{formatDate(post.created_at)}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setStatus.mutate({
                          id: post.id,
                          status: post.status === "published" ? "draft" : "published",
                        })
                      }
                      className="mr-2 rounded-full border border-line px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      {post.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removePost.mutate(post.id)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs text-destructive hover:bg-muted"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-14 border-b border-line pb-4 font-display text-2xl">Reports</h2>
        {reports.length === 0 ? (
          <p className="py-6 text-sm text-inksoft">No reports. The community is behaving.</p>
        ) : (
          <ul className="divide-y divide-line">
            {reports.map((report) => (
              <li key={report.id} className="flex items-center gap-4 py-4 text-sm">
                <span className="flex-1">{report.reason}</span>
                <span className="text-xs text-inksoft">{formatDate(report.created_at)}</span>
                {report.resolved ? (
                  <span className="text-xs text-inksoft">Resolved</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => resolveReport.mutate(report.id)}
                    className="rounded-full border border-line px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Resolve
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </SiteLayout>
  );
}
