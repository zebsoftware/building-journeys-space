-- Harden author updates: authors may edit article content, not counters or ownership.
REVOKE UPDATE ON public.posts FROM authenticated;
GRANT UPDATE (title, subtitle, cover_image, category, tags, content, status, reflection_prompt, day_number, read_minutes, published_at) ON public.posts TO authenticated;
-- Existing administrator moderation uses the same authenticated role; status updates remain available.
-- Keep counters writable only through trusted SECURITY DEFINER trigger/functions.

-- Supabase Storage buckets for gallery uploads.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-covers','post-covers',true,5242880,ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public=EXCLUDED.public, file_size_limit=EXCLUDED.file_size_limit, allowed_mime_types=EXCLUDED.allowed_mime_types;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-avatars','profile-avatars',true,2097152,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=EXCLUDED.public, file_size_limit=EXCLUDED.file_size_limit, allowed_mime_types=EXCLUDED.allowed_mime_types;

CREATE POLICY "users_upload_own_post_images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-covers' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "users_upload_own_avatars" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

-- Accurate site-wide admin statistics without fetching all post records.
CREATE OR REPLACE FUNCTION public.admin_site_stats()
RETURNS TABLE (total_posts bigint, published_posts bigint, total_views bigint, open_reports bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT (SELECT count(*) FROM public.posts),
        (SELECT count(*) FROM public.posts WHERE status = 'published'),
        (SELECT coalesce(sum(views),0)::bigint FROM public.posts),
        (SELECT count(*) FROM public.reports WHERE NOT resolved)
 WHERE public.has_role((SELECT auth.uid()), 'admin');
$$;
REVOKE ALL ON FUNCTION public.admin_site_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_site_stats() TO authenticated;
