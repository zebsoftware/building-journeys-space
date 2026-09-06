\set ON_ERROR_STOP on

SELECT 'bookmarks' AS table_name, count(*) AS row_count FROM public.bookmarks
UNION ALL SELECT 'comments', count(*) FROM public.comments
UNION ALL SELECT 'likes', count(*) FROM public.likes
UNION ALL SELECT 'posts', count(*) FROM public.posts
UNION ALL SELECT 'profiles', count(*) FROM public.profiles
UNION ALL SELECT 'reports', count(*) FROM public.reports
UNION ALL SELECT 'user_roles', count(*) FROM public.user_roles
ORDER BY table_name;

SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles','user_roles','posts','comments','likes','bookmarks','reports')
ORDER BY c.relname;

SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer,
       p.proacl::text AS privileges
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('has_role','increment_post_views','sync_comment_count','sync_like_count','touch_updated_at')
ORDER BY p.proname;

SELECT c.relname AS table_name, t.tgname AS trigger_name,
       pg_get_triggerdef(t.oid, true) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- Every result below should be empty.
SELECT 'posts_without_profile' AS problem, p.id
FROM public.posts p LEFT JOIN public.profiles pr ON pr.id = p.author_id
WHERE pr.id IS NULL
UNION ALL
SELECT 'comments_without_profile', c.id
FROM public.comments c LEFT JOIN public.profiles pr ON pr.id = c.author_id
WHERE pr.id IS NULL
UNION ALL
SELECT 'real_profiles_without_auth_user', p.id
FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL
  AND p.id NOT IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    '77777777-7777-7777-7777-777777777777'
  );

SELECT p.id, p.slug, p.like_count, count(DISTINCT l.user_id) AS actual_likes,
       p.comment_count, count(DISTINCT c.id) AS actual_comments
FROM public.posts p
LEFT JOIN public.likes l ON l.post_id = p.id
LEFT JOIN public.comments c ON c.post_id = p.id
GROUP BY p.id
HAVING p.like_count <> count(DISTINCT l.user_id)
    OR p.comment_count <> count(DISTINCT c.id);