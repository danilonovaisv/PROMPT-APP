alter table "public"."prompts"
  add column if not exists "reference_url" text,
  add column if not exists "prompt_payload_jsonb" jsonb not null default '{}'::jsonb,
  add column if not exists "schema_version" text not null default '1.0.0',
  add column if not exists "output_format" text not null default 'markdown',
  add column if not exists "language" text not null default 'pt-BR',
  add column if not exists "selected_menu_ids" bigint[] default '{}'::bigint[];

create index if not exists "prompts_schema_version_idx" on "public"."prompts" ("schema_version");
create index if not exists "prompts_output_format_idx" on "public"."prompts" ("output_format");
