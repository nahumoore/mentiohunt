-- notification_platform_update_reads only had insert+select — but the
-- client marks a read via .upsert(), which compiles to INSERT ... ON
-- CONFLICT DO UPDATE whenever the (user_id, platform_update_id) row already
-- exists. With no UPDATE grant/policy, that conflict path was rejected
-- outright (empty permission error surfaced client-side as "{}").

grant update on public.notification_platform_update_reads to authenticated;

create policy "Users can update their own platform update reads"
  on public.notification_platform_update_reads for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
