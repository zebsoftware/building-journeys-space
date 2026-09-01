import { supabase } from "@/integrations/supabase/client";
import type { Author } from "@/lib/posts";

export type CommentRow = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
  author?: Author | null;
};

export async function fetchComments(postId: string): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id,post_id,parent_id,author_id,content,created_at,author:profiles(id,username,display_name,avatar_url,bio)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CommentRow[];
}

export async function addComment(input: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
}) {
  const { error } = await supabase.from("comments").insert({
    post_id: input.postId,
    author_id: input.authorId,
    content: input.content,
    parent_id: input.parentId ?? null,
  });
  if (error) throw error;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchEngagement(postId: string, userId: string | null) {
  if (!userId) return { liked: false, bookmarked: false };
  const [{ data: like }, { data: bookmark }] = await Promise.all([
    supabase.from("likes").select("post_id").eq("post_id", postId).eq("user_id", userId).maybeSingle(),
    supabase.from("bookmarks").select("post_id").eq("post_id", postId).eq("user_id", userId).maybeSingle(),
  ]);
  return { liked: Boolean(like), bookmarked: Boolean(bookmark) };
}

export async function toggleLike(postId: string, userId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export async function toggleBookmark(postId: string, userId: string, bookmarked: boolean) {
  if (bookmarked) {
    const { error } = await supabase.from("bookmarks").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("bookmarks").insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export async function fetchBookmarkedPosts(userId: string) {
  const { data, error } = await supabase
    .from("bookmarks")
    .select(
      "created_at,post:posts(id,slug,title,subtitle,cover_image,category,tags,content,status,reflection_prompt,day_number,read_minutes,views,like_count,comment_count,published_at,created_at,author_id,author:profiles(id,username,display_name,avatar_url,bio))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => (row as unknown as { post: unknown }).post).filter(Boolean);
}

export async function incrementViews(postId: string) {
  await supabase.rpc("increment_post_views", { post_id: postId });
}
