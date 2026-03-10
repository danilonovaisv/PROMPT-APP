alter table public.prompts
  add column if not exists reference_url text,
  add column if not exists prompt_payload_jsonb jsonb,
  add column if not exists schema_version text not null default '1.0.0',
  add column if not exists output_format text not null default 'markdown',
  add column if not exists language text not null default 'pt-BR';

alter table public.context_menus
  add column if not exists selection_mode text not null default 'single';

update public.context_menus
set selection_mode = case
  when selection_mode in ('single', 'multiple') then selection_mode
  else 'single'
end;

create or replace function public.is_valid_prompt_payload(payload jsonb)
returns boolean
language sql
immutable
as $$
  select
    jsonb_typeof(payload) = 'object'
    and payload ? 'meta'
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
    and coalesce(payload #>> '{meta,schema_version}', '') <> ''
    and coalesce(payload #>> '{meta,language}', '') <> ''
    and coalesce(payload #>> '{meta,owner}', '') <> ''
    and coalesce(payload #>> '{role,id}', '') <> ''
    and (payload->'policies' ? 'must')
    and (payload->'policies' ? 'must_not')
    and (payload->'output_contract' ? 'format')
    and (payload->'output_contract' ? 'language')
    and (payload->'output_contract' ? 'strict_mode')
    and (payload->'output_contract' ? 'require_evidence_for_claims')
    and (payload->'output_contract' ? 'required_sections')
    and (payload->'output_contract' ? 'route_audit_order')
    and (payload->'output_contract' ? 'ordered_evaluation_blocks')
    and (payload->'output_contract' ? 'acceptance_criteria')
    and (payload->'output_contract' ? 'status_enum')
    and (payload->'output_contract' ? 'severity_enum');
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'prompts_prompt_payload_jsonb_check'
  ) then
    alter table public.prompts
      add constraint prompts_prompt_payload_jsonb_check
      check (public.is_valid_prompt_payload(prompt_payload_jsonb));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'context_menus_selection_mode_check'
  ) then
    alter table public.context_menus
      add constraint context_menus_selection_mode_check
      check (selection_mode in ('single', 'multiple'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'context_menus_options_jsonb_array_check'
  ) then
    alter table public.context_menus
      add constraint context_menus_options_jsonb_array_check
      check (jsonb_typeof(options) = 'array');
  end if;
end $$;

update public.prompts
set prompt_payload_jsonb = jsonb_build_object(
  'meta', jsonb_build_object(
    'prompt_id', regexp_replace(lower(coalesce(title, 'prompt')), '[^a-z0-9]+', '_', 'g'),
    'name', coalesce(title, 'Prompt'),
    'schema_version', coalesce(nullif(schema_version, ''), '1.0.0'),
    'language', coalesce(nullif(language, ''), 'pt-BR'),
    'owner', 'webapp'
  ),
  'role', jsonb_build_object(
    'id', regexp_replace(lower(coalesce(system_role, 'custom_role')), '[^a-z0-9]+', '_', 'g'),
    'description', coalesce(system_role, '')
  ),
  'objective', jsonb_build_object(
    'task', coalesce(task, ''),
    'focus', '[]'::jsonb,
    'priority_order', '[]'::jsonb
  ),
  'project', jsonb_build_object(
    'name', 'PROMPT-APP',
    'production_url', 'https://prompt-app-dan.netlify.app',
    'repository_url', '',
    'reference_urls', case
      when nullif(reference_url, '') is not null then to_jsonb(array[reference_url])
      else '[]'::jsonb
    end,
    'target_environment', '["web_desktop","web_mobile"]'::jsonb,
    'app_type', 'prompt_management_webapp',
    'context', coalesce(context, '')
  ),
  'scope', jsonb_build_object(
    'audit_areas_minimum', '[]'::jsonb,
    'critical_flows', '[]'::jsonb,
    'route_discovery', jsonb_build_object(
      'mode', 'auto',
      'spa_fallback', true,
      'fallback_route', '/',
      'include_internal_states', true
    )
  ),
  'selected_options', (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'group', menu_group,
          'option', menu_value->>'option',
          'sub_options', coalesce(
            (
              select jsonb_agg(sub_option)
              from jsonb_array_elements_text(
                case
                  when jsonb_typeof(menu_value->'subOptions') = 'array' then menu_value->'subOptions'
                  when jsonb_typeof(menu_value->'sub_opcoes') = 'array' then menu_value->'sub_opcoes'
                  else '[]'::jsonb
                end
              ) as sub_option
            ),
            '[]'::jsonb
          )
        )
      ) filter (where coalesce(menu_value->>'option', '') <> ''),
      '[]'::jsonb
    )
    from jsonb_each(coalesce(context_menus, '{}'::jsonb)) as menu_entry(menu_group, menu_value)
  ),
  'rules', '{}'::jsonb,
  'policies', jsonb_build_object(
    'must', coalesce(constraints, '[]'::jsonb),
    'must_not', coalesce(negative_prompt, '[]'::jsonb)
  ),
  'output_contract', jsonb_build_object(
    'format', coalesce(nullif(output_format, ''), coalesce(output_schema->>'formato', 'markdown')),
    'language', coalesce(nullif(language, ''), 'pt-BR'),
    'strict_mode', true,
    'require_evidence_for_claims', true,
    'required_sections', '[]'::jsonb,
    'route_audit_order', '[]'::jsonb,
    'ordered_evaluation_blocks', '[]'::jsonb,
    'acceptance_criteria', '[]'::jsonb,
    'status_enum', '["approved","approved_with_issues","failed"]'::jsonb,
    'severity_enum', '["critical","high","medium","low"]'::jsonb,
    'structure_notes', coalesce(output_schema->>'estrutura', '')
  )
)
where prompt_payload_jsonb is null
   or prompt_payload_jsonb = '{}'::jsonb;

update public.prompts
set schema_version = coalesce(prompt_payload_jsonb #>> '{meta,schema_version}', '1.0.0'),
    output_format = coalesce(prompt_payload_jsonb #>> '{output_contract,format}', 'markdown'),
    language = coalesce(prompt_payload_jsonb #>> '{output_contract,language}', 'pt-BR');

alter table public.prompts
  alter column prompt_payload_jsonb set not null;

create index if not exists prompts_schema_version_idx
  on public.prompts (schema_version);

create index if not exists prompts_output_format_idx
  on public.prompts (output_format);

create index if not exists context_menus_selection_mode_idx
  on public.context_menus (selection_mode);
