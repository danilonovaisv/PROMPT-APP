alter table public.prompts
  add column if not exists selection_payload_jsonb jsonb,
  add column if not exists compiled_payload_jsonb jsonb;

create or replace function public.is_valid_prompt_payload(payload jsonb)
returns boolean
language sql
immutable
as $$
  select
    jsonb_typeof(payload) = 'object'
    and (
      (
        payload ? 'meta'
        and payload ? 'prompt_definition'
        and payload ? 'menu_definitions'
        and payload ? 'output_contract'
        and jsonb_typeof(payload->'meta') = 'object'
        and jsonb_typeof(payload->'prompt_definition') = 'object'
        and jsonb_typeof(payload->'menu_definitions') = 'array'
        and jsonb_typeof(payload->'output_contract') = 'object'
        and coalesce(payload #>> '{meta,template_id}', '') <> ''
        and coalesce(payload #>> '{meta,template_name}', '') <> ''
        and coalesce(payload #>> '{meta,template_type}', '') <> ''
        and coalesce(payload #>> '{meta,schema_version}', '') <> ''
        and coalesce(payload #>> '{meta,language}', '') <> ''
        and coalesce(payload #>> '{meta,status}', '') <> ''
        and (payload->'output_contract' ? 'format')
        and (payload->'output_contract' ? 'language')
        and (payload->'output_contract' ? 'strict_mode')
        and (payload->'output_contract' ? 'required_fields')
        and (payload->'output_contract' ? 'response_rules')
      )
      or
      (
        payload ? 'meta'
        and payload ? 'role'
        and payload ? 'objective'
        and payload ? 'project'
        and payload ? 'scope'
        and payload ? 'selected_options'
        and payload ? 'rules'
        and payload ? 'policies'
        and payload ? 'output_contract'
        and jsonb_typeof(payload->'meta') = 'object'
        and jsonb_typeof(payload->'role') = 'object'
        and jsonb_typeof(payload->'objective') = 'object'
        and jsonb_typeof(payload->'project') = 'object'
        and jsonb_typeof(payload->'scope') = 'object'
        and jsonb_typeof(payload->'selected_options') = 'array'
        and jsonb_typeof(payload->'rules') = 'object'
        and jsonb_typeof(payload->'policies') = 'object'
        and jsonb_typeof(payload->'output_contract') = 'object'
        and coalesce(payload #>> '{meta,prompt_id}', '') <> ''
        and coalesce(payload #>> '{meta,name}', '') <> ''
      )
    );
$$;

create or replace function public.is_valid_selection_payload(payload jsonb)
returns boolean
language sql
immutable
as $$
  select
    payload is null
    or (
      jsonb_typeof(payload) = 'object'
      and payload ? 'template_id'
      and payload ? 'selected_menus'
      and payload ? 'free_inputs'
      and jsonb_typeof(payload->'selected_menus') = 'array'
      and jsonb_typeof(payload->'free_inputs') = 'object'
    );
$$;

create or replace function public.is_valid_compiled_payload(payload jsonb)
returns boolean
language sql
immutable
as $$
  select
    payload is null
    or (
      jsonb_typeof(payload) = 'object'
      and payload ? 'template_id'
      and payload ? 'meta'
      and payload ? 'compiled_context'
      and payload ? 'prompt_definition'
      and payload ? 'output_contract'
      and jsonb_typeof(payload->'meta') = 'object'
      and jsonb_typeof(payload->'compiled_context') = 'object'
      and jsonb_typeof(payload->'prompt_definition') = 'object'
      and jsonb_typeof(payload->'output_contract') = 'object'
    );
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'prompts_selection_payload_jsonb_check'
  ) then
    alter table public.prompts
      add constraint prompts_selection_payload_jsonb_check
      check (public.is_valid_selection_payload(selection_payload_jsonb));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'prompts_compiled_payload_jsonb_check'
  ) then
    alter table public.prompts
      add constraint prompts_compiled_payload_jsonb_check
      check (public.is_valid_compiled_payload(compiled_payload_jsonb));
  end if;
end $$;

create index if not exists prompts_selection_payload_gin_idx
  on public.prompts using gin (selection_payload_jsonb);

create index if not exists prompts_compiled_payload_gin_idx
  on public.prompts using gin (compiled_payload_jsonb);
