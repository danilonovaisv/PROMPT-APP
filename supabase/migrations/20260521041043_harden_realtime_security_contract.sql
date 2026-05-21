-- Harden the Supabase Realtime security contract without touching user data.
-- 1. Keep prompt_memory_context reads restricted to authenticated owners only.
-- 2. Prevent direct API execution of the internal trigger helper.

drop policy if exists memory_select on public.prompt_memory_context;

create policy memory_select
on public.prompt_memory_context
for select
to authenticated
using (((select auth.uid()) = user_id) and (is_deleted = false));

revoke execute on function public.broadcast_user_table_changes() from anon;
revoke execute on function public.broadcast_user_table_changes() from authenticated;
revoke execute on function public.broadcast_user_table_changes() from public;
