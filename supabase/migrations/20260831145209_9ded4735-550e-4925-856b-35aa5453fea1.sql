
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TYPE public.post_category AS ENUM ('stories','journeys','ideas','creativity','learning');
CREATE TYPE public.post_status AS ENUM ('draft','published');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- POSTS
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  cover_image text,
  category public.post_category NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  content text NOT NULL DEFAULT '',
  status public.post_status NOT NULL DEFAULT 'draft',
  reflection_prompt text,
  day_number int,
  read_minutes int NOT NULL DEFAULT 3,
  views int NOT NULL DEFAULT 0,
  like_count int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_category_idx ON public.posts (category, published_at DESC);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_public_read" ON public.posts FOR SELECT USING (status = 'published');
CREATE POLICY "posts_read_own" ON public.posts FOR SELECT TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "posts_admin_read" ON public.posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_admin_update" ON public.posts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));

-- COMMENTS
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_post_idx ON public.comments (post_id, created_at);
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_public_read" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));

-- LIKES
CREATE TABLE public.likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT ON public.likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_public_read" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- BOOKMARKS
CREATE TABLE public.bookmarks (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks_own" ON public.bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- REPORTS
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  reason text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_admin_read" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "reports_admin_update" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "reports_admin_delete" ON public.reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- COUNTERS
CREATE OR REPLACE FUNCTION public.sync_like_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSE
    UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER likes_count_trg AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION public.sync_like_count();

CREATE OR REPLACE FUNCTION public.sync_comment_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSE
    UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER comments_count_trg AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.sync_comment_count();

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER posts_touch BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.increment_post_views(_slug text) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.posts SET views = views + 1 WHERE slug = _slug AND status = 'published';
$$;
GRANT EXECUTE ON FUNCTION public.increment_post_views(text) TO anon, authenticated;

-- DEMO CONTENT
INSERT INTO public.profiles (id, username, display_name, bio, avatar_url) VALUES
 ('11111111-1111-1111-1111-111111111111','avamireles','Ava Mireles','Writing about the parts of university nobody puts on a brochure.',null),
 ('22222222-2222-2222-2222-222222222222','omarsade','Omar Sade','Reading slowly, on purpose. Notes on books and thinking.',null),
 ('33333333-3333-3333-3333-333333333333','lenafarkas','Lena Farkas','Learning to build software in public. Day by day.',null),
 ('44444444-4444-4444-4444-444444444444','noorhaddad','Noor Haddad','Trails, patience, and questions worth asking.',null),
 ('55555555-5555-5555-5555-555555555555','ravihalden','Ravi Halden','Painting from memory. Mostly badly, occasionally not.',null),
 ('66666666-6666-6666-6666-666666666666','martaklein','Marta Klein','One page a day. Poems in between.',null),
 ('77777777-7777-7777-7777-777777777777','nadiarook','Nadia Rook','Film photographer chasing fog.',null);

INSERT INTO public.posts (author_id, slug, title, subtitle, category, tags, content, status, reflection_prompt, day_number, read_minutes, views, like_count, published_at) VALUES
 ('11111111-1111-1111-1111-111111111111','the-morning-i-almost-quit-university','The morning I almost quit university','I packed my bag on a Tuesday, convinced I was the only person who didn''t belong.','stories','{"university","belonging","failure"}','<p>I packed my bag on a Tuesday. Not dramatically — I folded the shirts, zipped the case, and sat on the end of the bed for an hour.</p><p>What I found in that empty lecture hall changed how I understand failure. There were three other people there, at 7am, none of them talking. All of us convinced we were the only one.</p><h2>What I know now</h2><p>Belonging is not a feeling you arrive with. It is something you accumulate by staying one more week than you wanted to.</p>','published','What is something you''ve been postponing because you''re afraid of failing?',null,7,4210,312,now() - interval '3 days'),
 ('22222222-2222-2222-2222-222222222222','what-this-book-changed-about-how-i-think','What this book changed about how I think','Reading slowly, on purpose, is a discipline worth more than speed.','learning','{"books","thinking","discipline"}','<p>I used to count books. Now I count re-reads.</p><p>The shift happened with one paragraph I could not get past for four days. I kept returning to it the way you return to a sore tooth.</p><h2>Three things I kept</h2><p>Slowness is not laziness. Marginalia is thinking made visible. A book you argue with teaches more than one you admire.</p>','published','What is a book you should have read slower?',null,5,1830,164,now() - interval '6 days'),
 ('33333333-3333-3333-3333-333333333333','day-47-built-it-without-a-tutorial','Day 47: I finally built it without a tutorial','The blank file is the hardest part. The first hour is the whole point.','journeys','{"code","learning","day47"}','<p>Forty-seven days ago I could not explain what a function was without opening a tab.</p><p>Today I opened an empty file and closed it four hours later with something that worked. Not something good. Something that worked.</p>','published','What would you build if nobody was going to see it?',47,4,3120,241,now() - interval '1 day'),
 ('44444444-4444-4444-4444-444444444444','the-trail-that-taught-me-about-patience','The trail that taught me about patience','You can''t rush a ridge. You can only keep climbing toward it.','stories','{"travel","patience","mountains"}','<p>The ridge looked an hour away for six hours.</p><p>That is the entire lesson, and I paid for it in blisters.</p>','published',null,null,6,2410,198,now() - interval '9 days'),
 ('44444444-4444-4444-4444-444444444444','what-if-universities-taught-failure','What if universities taught failure before graduation?','A workshop on graceful collapse, before the real world asks for it.','ideas','{"education","failure"}','<p>We teach people to pass. We do not teach them what to do the first time they don''t.</p><p>Imagine a required final-year unit: run a small thing, let it fail, write the honest post-mortem.</p>','published','What would your post-mortem say?',null,3,2890,218,now() - interval '4 days'),
 ('22222222-2222-2222-2222-222222222222','measure-days-by-curiosity','We should measure days by how curious we were','Productivity tracks output. I''d rather track the questions I asked.','ideas','{"curiosity","productivity"}','<p>My to-do list has never once asked me a question.</p><p>So I started keeping a second list: things I wondered about today. It is a much better record of a life.</p>','published',null,null,3,1640,131,now() - interval '11 days'),
 ('11111111-1111-1111-1111-111111111111','a-tiny-library-for-people-who-rent-rooms','A tiny library for people who rent rooms','What if every city ran a shelf you could borrow from, no card needed?','ideas','{"community","books"}','<p>People who move every year cannot keep books. That is a quiet kind of loss.</p><p>One shelf, one street, no card, no fines. Just a shelf that assumes the best of people.</p>','published',null,null,3,3010,301,now() - interval '13 days'),
 ('55555555-5555-5555-5555-555555555555','learning-to-paint-from-memory','Learning to paint from memory','The sketchbook is getting less afraid, and so am I.','journeys','{"art","watercolor"}','<p>Day ninety-two. I painted the kitchen window without looking at the kitchen window.</p><p>It was wrong in every measurable way and right in the only one I care about.</p>','published',null,92,4,1210,142,now() - interval '2 days'),
 ('66666666-6666-6666-6666-666666666666','writing-a-novel-one-page-a-day','Writing a novel, one page a day','The first page is never good. I keep writing it anyway.','journeys','{"writing","novel"}','<p>Fifteen days, fifteen pages, and about eleven of them are unusable.</p><p>That leaves four. Four is more than I had.</p>','published',null,15,3,860,77,now() - interval '5 hours'),
 ('55555555-5555-5555-5555-555555555555','watercolor-study-in-terracotta','Watercolor study in terracotta','A morning spent on one wash.','creativity','{"painting","watercolor"}','<p>One colour, one hour, one sheet of very expensive paper.</p>','published',null,null,2,940,88,now() - interval '7 days'),
 ('77777777-7777-7777-7777-777777777777','fog-series-coastal-cliffs','Fog series: coastal cliffs at dawn','Six mornings, one roll of film, almost nothing visible.','creativity','{"photography","film"}','<p>Fog is the only subject that refuses to be composed.</p>','published',null,null,2,1420,163,now() - interval '8 days'),
 ('66666666-6666-6666-6666-666666666666','still-a-poem','still','A poem about the pause before starting.','creativity','{"poetry"}','<p><em>still</em></p><p>the kettle knows<br/>the exact length of my hesitation</p>','published','What are you still waiting to begin?',null,1,720,109,now() - interval '10 days'),
 ('33333333-3333-3333-3333-333333333333','how-i-learned-to-stop-procrastinating','How I learned to stop procrastinating','It was never about discipline. It was about the size of the first step.','learning','{"habits","focus"}','<p>Every task I avoided was a task I had written down too large.</p><p>"Write the chapter" became "open the file". That was the entire fix.</p>','published','What task could you make ten times smaller?',null,4,2260,187,now() - interval '12 days'),
 ('11111111-1111-1111-1111-111111111111','five-things-my-first-failure-taught-me','5 things my first failure taught me','The ideas that didn''t work taught me more than the ones that did.','learning','{"failure","lessons"}','<p>One: nobody remembers it as long as you do.</p><p>Two: the post-mortem is the product.</p><p>Three: momentum is a skill, not a mood.</p>','published',null,null,5,3340,254,now() - interval '15 days');
