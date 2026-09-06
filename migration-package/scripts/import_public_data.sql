\set ON_ERROR_STOP on

BEGIN;

-- Target-only destructive step: replace the schema's demo rows with the
-- current source snapshot. Confirm the connection before running this file.
TRUNCATE TABLE
  public.reports,
  public.bookmarks,
  public.likes,
  public.comments,
  public.posts,
  public.user_roles,
  public.profiles
CASCADE;

-- Avoid count triggers changing the already-snapshotted post counters.
SET LOCAL session_replication_role = replica;

\copy public.profiles FROM 'data/profiles.csv' WITH (FORMAT csv, HEADER true)
\copy public.user_roles FROM 'data/user_roles.csv' WITH (FORMAT csv, HEADER true)
\copy public.posts FROM 'data/posts.csv' WITH (FORMAT csv, HEADER true)
\copy public.comments FROM 'data/comments.csv' WITH (FORMAT csv, HEADER true)
\copy public.likes FROM 'data/likes.csv' WITH (FORMAT csv, HEADER true)
\copy public.bookmarks FROM 'data/bookmarks.csv' WITH (FORMAT csv, HEADER true)
\copy public.reports FROM 'data/reports.csv' WITH (FORMAT csv, HEADER true)

SET LOCAL session_replication_role = origin;

COMMIT;

-- Reconcile counters from their source-of-truth engagement rows.
UPDATE public.posts p
SET like_count = (SELECT count(*) FROM public.likes l WHERE l.post_id = p.id),
    comment_count = (SELECT count(*) FROM public.comments c WHERE c.post_id = p.id);