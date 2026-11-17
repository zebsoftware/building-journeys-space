BEGIN;

-- Do not let clients set counters or database-controlled timestamps on INSERT.
REVOKE INSERT ON public.posts FROM PUBLIC, anon, authenticated;
GRANT INSERT (
  author_id, slug, title, subtitle, cover_image, category, tags, content, status,
  reflection_prompt, day_number, read_minutes, published_at
) ON public.posts TO authenticated;

-- Ownership remains subject to the existing row-level policies.
REVOKE UPDATE ON public.posts FROM PUBLIC, anon, authenticated;
GRANT UPDATE (
  title, subtitle, cover_image, category, tags, content, status,
  reflection_prompt, day_number, read_minutes, published_at
) ON public.posts TO authenticated;

-- Role assignment stays a trusted administrative operation.
REVOKE ALL ON public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- A caller should only be able to look up their own role.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT _user_id IS NOT NULL AND _user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Inherit draft visibility from the post's RLS. Authors and admins retain access.
DROP POLICY IF EXISTS comments_public_read ON public.comments;
CREATE POLICY comments_read_visible_post ON public.comments
FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.posts WHERE posts.id = comments.post_id));

DROP POLICY IF EXISTS comments_insert_own ON public.comments;
CREATE POLICY comments_insert_own ON public.comments
FOR INSERT TO authenticated WITH CHECK (
  author_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = comments.post_id AND posts.status = 'published'
  )
);

-- Validate the parent separately to avoid a self-reference in the RLS policy.
CREATE FUNCTION public.check_comment_parent_post()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.comments AS parent
    WHERE parent.id = NEW.parent_id AND parent.post_id = NEW.post_id
  ) THEN
    RAISE EXCEPTION 'Comment parent must exist on the same post' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_comment_parent_post() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER comments_check_parent_post
BEFORE INSERT OR UPDATE OF parent_id, post_id ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.check_comment_parent_post();

-- Counts stay public on published posts, but individual likes are private.
DROP POLICY IF EXISTS likes_public_read ON public.likes;
REVOKE SELECT ON public.likes FROM PUBLIC, anon;
CREATE POLICY likes_read_own ON public.likes
FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS likes_insert_own ON public.likes;
CREATE POLICY likes_insert_own ON public.likes
FOR INSERT TO authenticated WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = likes.post_id AND posts.status = 'published'
  )
);

DROP POLICY IF EXISTS bookmarks_own ON public.bookmarks;
CREATE POLICY bookmarks_read_own ON public.bookmarks
FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY bookmarks_delete_own ON public.bookmarks
FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY bookmarks_insert_own ON public.bookmarks
FOR INSERT TO authenticated WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = bookmarks.post_id AND posts.status = 'published'
  )
);

-- Only admins can resolve reports. A reporter cannot insert a pre-resolved report.
REVOKE INSERT, UPDATE ON public.reports FROM PUBLIC, anon, authenticated;
GRANT INSERT (reporter_id, post_id, comment_id, reason) ON public.reports TO authenticated;
GRANT UPDATE (resolved) ON public.reports TO authenticated;

-- The web signup already relies on this trigger to create the profile. Use an
-- opaque handle instead of exposing an address in public profiles and URLs.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested_name text := btrim(NEW.raw_user_meta_data ->> 'display_name');
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    'user_' || replace(NEW.id::text, '-', ''),
    CASE
      WHEN requested_name IS NULL OR requested_name = '' OR position('@' IN requested_name) > 0
      THEN 'New Writer'
      ELSE left(requested_name, 80)
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- The profile editor only updates presentation fields. Do not let direct API
-- inserts bypass the signup trigger or allow a client to rewrite its handle.
REVOKE INSERT, UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (display_name, bio, avatar_url) ON public.profiles TO authenticated;

-- Hide legacy email-based usernames without deleting users, posts, or profiles.
UPDATE public.profiles
SET username = 'user_' || replace(id::text, '-', '')
WHERE username LIKE '%@%';

UPDATE public.profiles
SET display_name = 'Writer'
WHERE btrim(display_name) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';

COMMIT;
