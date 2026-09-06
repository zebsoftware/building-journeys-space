# The Founder: Supabase migration package

This package recreates The Founder's backend in an empty, user-owned Supabase project while leaving the current Lovable Cloud source unchanged.

## Source inventory

- Tables: `profiles`, `user_roles`, `posts`, `comments`, `likes`, `bookmarks`, `reports`
- Enum types: `app_role`, `post_category`, `post_status`
- Functions: `has_role`, `increment_post_views`, `sync_comment_count`, `sync_like_count`, `touch_updated_at`
- Triggers: comment and like counters; updated timestamps for posts and profiles
- Storage buckets: none
- Authentication used by the app: email and password
- Source snapshot at packaging time: 8 profiles, 1 role, 14 posts, 0 comments, 0 likes, 0 bookmarks, 0 reports

## Safety rules

1. Run every command against a new, empty target project only.
2. Never use the source database URL as `TARGET_DATABASE_URL`.
3. Keep auth exports outside source control. They contain sensitive password hashes and identity data.
4. Preserve auth user UUIDs. Public profile and role records depend on them.
5. Do not switch application environment variables until every verification step passes.

## 1. Create and connect the target

Create an empty Supabase project that you own. Copy its direct or session-pooler Postgres connection string into a local environment variable named `TARGET_DATABASE_URL`. Do not commit it.

This existing Lovable project is already attached to Lovable Cloud and cannot replace that connection. Use either a new Lovable project connected to the target in Project Settings → Integrations, or deploy the code elsewhere with the target environment variables.

## 2. Export and import authentication users

Use **Cloud → Advanced settings → Export data** to export the source database/auth data. Import the auth schema into the empty target using Supabase's documented database restore flow. This must happen before public profile/content import so user UUIDs remain valid.

Auth data is intentionally not stored in this repository or migration archive.

After import, confirm the expected user IDs exist in the target before continuing.

## 3. Apply the schema

From this package directory:

```bash
psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -f schema/001_schema_and_seed.sql
psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -f schema/002_function_permissions.sql
```

The files are exact copies of the source migrations. The first includes the original demo content. The public-data import in the next step replaces it with the current source snapshot.

## 4. Import current public data

Place the exported CSV files in `data/`, then run:

```bash
psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/import_public_data.sql
```

The script truncates only the seven application tables in the **target**, temporarily suppresses triggers during the load, preserves IDs/timestamps, and restores trigger behavior afterward.

## 5. Recreate authentication configuration

In the target project's authentication settings:

- Enable email/password sign-in.
- Keep email confirmation enabled unless you intentionally want immediate sign-in after signup.
- Set Site URL to the final app origin.
- Add redirect URLs for the preview and production origins, including `/reset-password`.
- Recreate custom SMTP and email templates if you configured any outside this repository.
- No social login provider is currently used by the app.

## 6. Configure application secrets

Set these values on the new Lovable project or external host:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose it with a `VITE_` prefix)

Never place secret values in this repository.

## 7. Verify the target

```bash
psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -f verification/verify_target.sql
```

Expected snapshot counts are in `verification/expected_counts.csv`. Also test in the app:

1. Sign in with the migrated account.
2. Open the profile and admin pages.
3. Read a published post and confirm drafts remain private.
4. Create/edit a post, then test a like, comment, and bookmark.
5. Confirm counters change once per action.
6. Run the target project's database security checks.

## 8. Cut over and roll back

Only after verification, deploy the app with target credentials and update traffic/domain settings. Keep the original Lovable project unchanged. Rollback is simply directing traffic back to the original deployment; do not write migrated activity to both backends after cutover.