-- Harden prompt memory SELECT policy to authenticated role only.
-- Keeps per-user and soft-delete filtering semantics unchanged.

drop policy if exists memory_select on public.prompt_memory_context;

create policy memory_select
on public.prompt_memory_context
for select
to authenticated
using ((auth.uid() = user_id) and (is_deleted = false));
