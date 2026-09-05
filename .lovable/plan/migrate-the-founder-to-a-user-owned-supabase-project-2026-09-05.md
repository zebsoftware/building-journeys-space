# Migrate The Founder to a User-Owned Supabase Project

## Goal
Recreate the complete backend in the user-owned Supabase project while keeping the current Lovable Cloud database unchanged and available as the rollback source.

## Important platform constraint
This project already uses Lovable Cloud, so its backend connection cannot be detached or replaced with an external Supabase connection. The migrated backend can be used by:
- a new Lovable project connected to the user-owned Supabase project before Cloud is enabled, or
- a deployment of this code outside Lovable with the new environment variables.

The source project will not be modified during extraction or target setup.

## Migration work
1. **Freeze and inventory the source**
   - Record table schemas, indexes, enum types, grants, RLS policies, functions, triggers, and function permissions.
   - Confirm storage is empty and document that no bucket or object transfer is required.
   - Record row counts and IDs for reconciliation.

2. **Create a portable schema package**
   - Preserve the two existing migrations byte-for-byte.
   - Add a target-safe bootstrap/runbook that applies migrations in order.
   - Include verification queries for tables, policies, triggers, grants, and function permissions.
   - Do not run any write or schema operation against the source.

3. **Transfer authentication identities**
   - Export auth users using the source project's supported data-export flow so password hashes and identity records remain intact.
   - Import auth schema data into the empty target before profile/content rows.
   - Preserve user UUIDs so profiles, posts, comments, likes, bookmarks, reports, and admin roles remain linked.
   - Treat auth exports as sensitive and never commit them to the repository.

4. **Transfer application data**
   - Export each public table and import in dependency order: profiles, user_roles, posts, comments, likes, bookmarks, reports.
   - Preserve primary keys and timestamps.
   - Prevent counter triggers from double-counting during import, then reconcile post like/comment counters from source rows.
   - Verify row counts and relationship integrity after import.

5. **Recreate authentication configuration**
   - Enable email/password authentication with the same confirmation behavior.
   - Set the target Site URL and allowed redirect URLs for sign-in, email confirmation, and `/reset-password`.
   - Recreate email templates and SMTP settings if custom settings exist.
   - No social provider is currently used by the app.

6. **Storage configuration**
   - No storage buckets currently exist, so record this as an intentional no-op.

7. **Validate before cutover**
   - Test sign-in for a migrated account, profile loading, public and draft post visibility, writing/editing, likes, comments, bookmarks, reports, and admin access.
   - Compare source and target row counts and key constraints.
   - Run security checks on the target.

8. **Cut over safely**
   - Connect a new Lovable project to the user-owned Supabase project, or configure an external deployment with the target URL, publishable key, server publishable key, and service-role key.
   - Deploy the same application code, verify the production callback URLs, and only then direct traffic to the new deployment.
   - Keep the original project and database unchanged for rollback.

## Required user actions
- Create an empty Supabase target project.
- Use Cloud → Advanced settings → Export data for the source auth/data export; full database dumps cannot be produced by this chat session.
- Connect the new target to a new Lovable project through Project Settings → Integrations, or provide the target environment variables to the external host.
- Supply target URL/domain values when configuring redirect URLs.

## Deliverables
- Source schema and security inventory.
- Ordered migration/runbook files.
- Data import order and verification scripts.
- Auth and storage configuration checklist.
- Cutover and rollback checklist.
