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
  Vercel HTML responses use an enforced script policy with a fresh nonce for
  each response. Do not cache that HTML at Cloudflare or reuse the nonce.
  Verify signup, password reset, publishing, the editor, and preview flows.
  Keep Trusted Types enforcement off until the editor and article renderer
  are compatible with it. Review DevTools Issues for any actual policy failure.
- Public view counts are an approximate engagement metric. The guest view-count
  endpoint is still public and does not provide abuse-resistant analytics.

## Image performance

- Uploaded images are stored unchanged within the existing bucket limits. New
  uploads use unique object keys and long cache lifetimes. Replace an image by
  uploading a new object, not by rewriting an existing one.
- Vercel serves responsive WebP copies of public covers and avatars. The
  original remains the HTML image URL and fallback. GIFs and other origins
  are served directly. Review image transformation usage in Vercel.
- On the preview, check a published article's canonical URL and social
  image in View Source. Confirm that a mobile browser requests a smaller
  image variant and that the original still loads when needed.

## Real-user performance monitoring

1. In the Vercel project, open **Speed Insights** and select **Enable** if it
   is not already active. Deploy or redeploy after enabling.
2. Visit the production home page and a public article. Once the page loads,
   check that the Speed Insights script is served successfully. The integration
   excludes account and writing routes and groups article and profile URLs by
   route pattern without query strings.
3. Use **Production → Mobile** to view real-user data as visits come in. Compare
   the same public URLs in PageSpeed Insights after deployment. The local
   tests and the documentation's example dashboard are not production data.

## Homepage delivery

The homepage streams its hero and navigation before the public post summaries
are ready. Only published summaries are requested from Supabase with the public
key, and the feed requests run in parallel with a bounded deadline. Do not add
shared caching to the HTML because its CSP nonce is unique per response.
The local font files retain their original Latin and extended glyph coverage,
with the weight axes limited to the ranges used by the stylesheet.

## Search discovery

The canonical `/sitemap.xml` is generated from published Supabase rows and
cached at the CDN for up to five minutes. Drafts, admin routes and URL
parameters are not listed. The route needs the existing public Supabase
configuration only. If that backend is unavailable, the endpoint returns
503 rather than replacing the sitemap with an empty list.
The `robots.txt` file points crawlers to the canonical sitemap.

Submit `sitemap.xml` once in the Search Console property for
`https://thefounderblogs.com/` if it has not already been submitted there.
New articles are included automatically after publication and cache expiry.
Search engines decide when and whether to index each article.
