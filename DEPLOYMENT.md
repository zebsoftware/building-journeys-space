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
