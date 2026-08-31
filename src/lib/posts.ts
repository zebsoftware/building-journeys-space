import { supabase } from "@/integrations/supabase/client";
import type { CategorySlug } from "@/lib/categories";

export type Author = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image: string | null;
  category: CategorySlug;
  tags: string[];
  content: string;
  status: "draft" | "published";
  reflection_prompt: string | null;
  day_number: number | null;
  read_minutes: number;
  views: number;
  like_count: number;
  comment_count: number;
  published_at: string | null;
  created_at: string;
  author_id: string;
  author?: Author | null;
};

const POST_SELECT =
  "id,slug,title,subtitle,cover_image,category,tags,content,status,reflection_prompt,day_number,read_minutes,views,like_count,comment_count,published_at,created_at,author_id,author:profiles(id,username,display_name,avatar_url,bio)";

export type Sort = "latest" | "popular" | "discussed";

function applySort<T>(query: T, sort: Sort): T {
  const q = query as unknown as {
    order: (column: string, options: { ascending: boolean; nullsFirst?: boolean }) => T;
  };
  if (sort === "popular") return q.order("like_count", { ascending: false });
  if (sort === "discussed") return q.order("comment_count", { ascending: false });
  return q.order("published_at", { ascending: false, nullsFirst: false });
}

export async function fetchPosts(options: {
  category?: CategorySlug;
  limit?: number;
  search?: string;
  sort?: Sort;
}): Promise<PostRow[]> {
  let query = supabase.from("posts").select(POST_SELECT).eq("status", "published");

  if (options.category) query = query.eq("category", options.category);
  if (options.search && options.search.trim()) {
    const term = options.search.trim().replace(/[%,()]/g, " ");
    query = query.or(`title.ilike.%${term}%,subtitle.ilike.%${term}%,content.ilike.%${term}%`);
  }
  query = applySort(query, options.sort ?? "latest");
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as PostRow[];
}

export async function fetchPostBySlug(slug: string): Promise<PostRow | null> {
  const { data, error } = await supabase.from("posts").select(POST_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as unknown as PostRow) ?? null;
}

export async function fetchAuthorPosts(authorId: string, includeDrafts = false): Promise<PostRow[]> {
  let query = supabase.from("posts").select(POST_SELECT).eq("author_id", authorId);
  if (!includeDrafts) query = query.eq("status", "published");
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PostRow[];
}

export async function fetchProfileByUsername(username: string): Promise<Author | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url,bio,created_at")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Author) ?? null;
}
