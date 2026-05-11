create extension if not exists "http" with schema "extensions";

create schema if not exists "api";

create extension if not exists "pg_jsonschema" with schema "public";

create type "public"."modo_de_selecao" as enum ('unica', 'multipla');

drop policy "context_menus_select" on "public"."context_menus";

drop policy "memory_select" on "public"."prompt_memory_context";

drop type "public"."http_header";

drop type "public"."http_request";

drop type "public"."http_response";

drop index if exists "public"."prompts_compiled_payload_gin_idx";

drop index if exists "public"."prompts_selection_payload_gin_idx";

alter table "public"."prompt_memory_context" add column "deleted_at" timestamp with time zone;

alter table "public"."prompt_memory_context" add column "is_deleted" boolean default false;

alter table "public"."prompts" add column "selected_menu_ids_jsonb" jsonb default '[]'::jsonb;

drop extension if exists "http";

CREATE INDEX context_menus_created_at_idx ON public.context_menus USING btree (created_at);

CREATE INDEX context_menus_deleted_at_idx ON public.context_menus USING btree (deleted_at);

CREATE INDEX context_menus_is_deleted_idx ON public.context_menus USING btree (is_deleted);

CREATE INDEX context_menus_menu_id_idx ON public.context_menus USING btree (menu_id);

CREATE INDEX context_menus_selection_mode_idx ON public.context_menus USING btree (selection_mode);

CREATE INDEX context_menus_updated_at_idx ON public.context_menus USING btree (updated_at);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;


  create policy "context_menus_select"
  on "public"."context_menus"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) AND (is_deleted = false)));



  create policy "memory_select"
  on "public"."prompt_memory_context"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) AND (is_deleted = false)));


-- Removed in repository: prompt mutations must not trigger Netlify deploy hooks.

drop policy "Allow listening for broadcasts for authenticated users only" on "realtime"."messages";


  create policy "Allow listening for broadcasts for authenticated users only"
  on "realtime"."messages"
  as permissive
  for select
  to authenticated
using (((topic ~~ 'room:%'::text) OR (topic ~~ 'room:%:messages'::text) OR (extension = 'broadcast'::text)));


