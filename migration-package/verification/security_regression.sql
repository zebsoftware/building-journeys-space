-- Run on a disposable database as the migration owner after applying all migrations.
BEGIN;

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-000000000071', 'security-author@example.invalid', '{"display_name":"Security Author"}'),
  ('00000000-0000-4000-8000-000000000072', 'security-reader@example.invalid', '{"display_name":"security-reader@example.invalid"}'),
  ('00000000-0000-4000-8000-000000000073', 'security-admin@example.invalid', '{}');
INSERT INTO public.user_roles (user_id, role)
VALUES ('00000000-0000-4000-8000-000000000073', 'admin');

INSERT INTO public.posts (id, author_id, slug, title, category, status) VALUES
  ('00000000-0000-4000-8000-000000000081', '00000000-0000-4000-8000-000000000071', 'security-test-draft', 'Draft', 'stories', 'draft'),
  ('00000000-0000-4000-8000-000000000082', '00000000-0000-4000-8000-000000000071', 'security-test-published', 'Published', 'stories', 'published');
INSERT INTO public.comments (post_id, author_id, body)
VALUES ('00000000-0000-4000-8000-000000000081', '00000000-0000-4000-8000-000000000071', 'Previously public comment');

DO $$
BEGIN
  IF (SELECT count(*) FROM public.profiles
      WHERE id IN ('00000000-0000-4000-8000-000000000071', '00000000-0000-4000-8000-000000000072', '00000000-0000-4000-8000-000000000073')
        AND username LIKE 'user!_%' ESCAPE '!' AND position('@' IN display_name) = 0) <> 3
  THEN RAISE EXCEPTION 'Signup did not create three private handles'; END IF;
END;
$$;

SET LOCAL ROLE anon;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.posts WHERE slug = 'security-test-draft')
    OR EXISTS (SELECT 1 FROM public.comments WHERE post_id = '00000000-0000-4000-8000-000000000081')
  THEN RAISE EXCEPTION 'Anonymous reader can see the draft or its comments'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE slug = 'security-test-published')
  THEN RAISE EXCEPTION 'Anonymous reader cannot see the published post'; END IF;
END;
$$;
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000072', true);
DO $$
BEGIN
  IF public.has_role('00000000-0000-4000-8000-000000000073', 'admin')
    OR EXISTS (SELECT 1 FROM public.admin_site_stats())
  THEN RAISE EXCEPTION 'Reader has access to administrator information'; END IF;

  UPDATE public.posts SET title = 'Unauthorized' WHERE slug = 'security-test-published';
  IF FOUND THEN RAISE EXCEPTION 'Reader can edit an article they do not own'; END IF;

  BEGIN
    INSERT INTO public.posts (author_id, slug, title, category, views)
    VALUES (auth.uid(), 'security-invalid-counter', 'Invalid', 'stories', 9999);
    RAISE EXCEPTION 'Reader could supply a custom counter';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    INSERT INTO public.comments (post_id, author_id, body)
    VALUES ('00000000-0000-4000-8000-000000000081', auth.uid(), 'Private draft');
    RAISE EXCEPTION 'Reader could comment on a draft';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  INSERT INTO public.comments (post_id, author_id, body)
  VALUES ('00000000-0000-4000-8000-000000000082', auth.uid(), 'Public post');
  INSERT INTO public.likes (post_id, user_id)
  VALUES ('00000000-0000-4000-8000-000000000082', auth.uid());

  IF NOT EXISTS (SELECT 1 FROM public.likes WHERE user_id = auth.uid())
  THEN RAISE EXCEPTION 'Reader cannot read their own likes'; END IF;

  INSERT INTO public.posts (author_id, slug, title, category)
  VALUES (auth.uid(), 'security-valid-author-insert', 'Allowed', 'stories');
END;
$$;

SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000071', true);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.comments WHERE post_id = '00000000-0000-4000-8000-000000000081')
  THEN RAISE EXCEPTION 'Author cannot moderate their own draft'; END IF;
  IF EXISTS (SELECT 1 FROM public.likes WHERE post_id = '00000000-0000-4000-8000-000000000082')
  THEN RAISE EXCEPTION 'Author can see another user’s likes'; END IF;
END;
$$;

SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000073', true);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_site_stats())
  THEN RAISE EXCEPTION 'Admin does not have access to statistics'; END IF;
  UPDATE public.posts SET status = 'draft' WHERE slug = 'security-test-published';
  IF NOT FOUND THEN RAISE EXCEPTION 'Admin cannot moderate a post'; END IF;
END;
$$;
RESET ROLE;
ROLLBACK;
