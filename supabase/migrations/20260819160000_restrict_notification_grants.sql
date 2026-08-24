-- The original notifications migration ran GRANT statements assuming a bare
-- table, but Supabase's default privileges already hand anon/authenticated
-- full arwdD on any new public table at CREATE TABLE time — GRANT is
-- additive, so the earlier `grant select` / `grant update (read_at)` never
-- narrowed anything. RLS still scoped every row to its owner, but a user
-- could rewrite their own notification's title/body via the API, not just
-- flip read_at. Revoke the default grant first, then re-grant only what the
-- client actually needs.

revoke all on public.notifications from authenticated, anon;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

revoke all on public.notification_platform_updates from authenticated, anon;
grant select on public.notification_platform_updates to authenticated;

revoke all on public.notification_platform_update_reads from authenticated, anon;
grant select, insert on public.notification_platform_update_reads to authenticated;
