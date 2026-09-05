
REVOKE ALL ON FUNCTION public.sync_like_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_comment_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.increment_post_views(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_post_views(text) TO anon, authenticated;
