# Deployment checklist — The Founder

## Required environment variables

Set these in your Vercel project for the appropriate environments:

- `VITE_SUPABASE_URL`: Supabase project URL (public)
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key (public)
- `SUPABASE_URL`: same project URL, server runtime
- `SUPABASE_PUBLISHABLE_KEY`: same publishable key, server runtime
- `SUPABASE_SERVICE_ROLE_KEY`: **secret server-only key** (never use a VITE_ prefix)

Apply every migration in `supabase/migrations/` to the **correct** Supabase project, after taking a production database backup. Confirm policies and grants with a nonadmin account. The migration dated 20261026 adds storage buckets and an admin aggregate RPC; the admin page needs this migration.

## Administrator setup

Create a normal user with Supabase Authentication first. Look up that account's UUID in Authentication > Users, then (after verifying the UUID is correct) run in SQL editor:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('REPLACE-WITH-EXISTING-USER-UUID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

Do not give the browser privileged keys and never make role assignment accessible to regular users.

## Deployment gates

1. Install with `npm ci`, run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
2. Set Vercel production variables and confirm deployment framework settings suit this TanStack Start/Nitro configuration.
3. Test signup, login, password reset and logout on the deployed domain.
4. Test draft privacy, rich post authoring, cover and inline images, profile avatars, bookmarks, comments, moderation and stats.
5. Verify RLS as an anonymous visitor, regular authenticated user and administrator.
6. Verify image uploads reject files of the wrong type and files over the size limit.
7. Check browser console, server logs, mobile layout and metadata.

**Do not claim production-ready until build, RLS, XSS, and end-to-end deployment checks pass.**

## Browser and database security rollout

- Apply the `20261117000000_lock_down_public_content.sql` migration to staging first.
  It preserves users and content, but previous profile links using email-based
  usernames will change. Those emails may still be in old links or search caches.
- Run `migration-package/verification/security_regression.sql` on a disposable
  staging database as the migration owner. The test uses synthetic accounts and
  rolls its changes back.
- In hosted Supabase Auth, separately match the app's signup/reset password
  requirements and review email and authentication rate limits. Check the
  Vercel project's Supabase URL before selecting a target for the migration.
- After deployment, verify the response headers on the real production host.
  The enforced policy blocks embedding and plug-in objects. The stricter script
  and resource directives only report violations in the browser console. Test
  signup, password reset, publishing and the editor before tightening them.
- Public view counts are an approximate engagement metric. The guest view-count
  endpoint is still public and does not provide abuse-resistant analytics.

## Image performance

- Still images are resized before upload. Covers use up to 1600 px on the longest
  side, inline images 1200 px and avatars 384 px. Smaller originals and supported
  animated images are preserved where appropriate.
- New uploads retain their random object keys and use long browser caching.
  Replace an image through the editor rather than rewriting an existing object.
- Vercel's image optimizer is enabled for this project's public Supabase cover
  URLs. GIFs and other origins are served directly. If optimization fails, the
  browser retries the original. Review image transformation usage in Vercel.
- On the preview, open a post with an existing cover and confirm the image
  request returns successfully. Upload a large JPEG in a test post and check
  the stored file dimensions, size, and content type in Supabase Storage.
