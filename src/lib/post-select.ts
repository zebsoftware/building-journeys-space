export const POST_SUMMARY_SELECT =
  "id,slug,title,subtitle,cover_image,category,status,day_number,read_minutes,like_count,comment_count,published_at,created_at,author:profiles(display_name,avatar_url)";

export const POST_SELECT =
  "id,slug,title,subtitle,cover_image,category,tags,content,status,reflection_prompt,day_number,read_minutes,views,like_count,comment_count,published_at,created_at,author_id,author:profiles(id,username,display_name,avatar_url,bio)";
