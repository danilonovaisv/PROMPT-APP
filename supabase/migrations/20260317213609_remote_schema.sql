create extension if not exists "hypopg" with schema "extensions";

create extension if not exists "index_advisor" with schema "extensions";

drop policy "categories_delete" on "public"."categories";

drop policy "categories_insert" on "public"."categories";

drop policy "categories_select" on "public"."categories";

drop policy "categories_update" on "public"."categories";

drop policy "context_menus_delete" on "public"."context_menus";

drop policy "context_menus_insert" on "public"."context_menus";

drop policy "context_menus_select" on "public"."context_menus";

drop policy "context_menus_update" on "public"."context_menus";

drop policy "prompts_delete" on "public"."prompts";

drop policy "prompts_insert" on "public"."prompts";

drop policy "prompts_select" on "public"."prompts";

drop policy "prompts_update" on "public"."prompts";

drop policy "templates_delete" on "public"."templates";

drop policy "templates_insert" on "public"."templates";

drop policy "templates_select" on "public"."templates";

drop policy "templates_update" on "public"."templates";

revoke delete on table "public"."templates" from "anon";

revoke insert on table "public"."templates" from "anon";

revoke references on table "public"."templates" from "anon";

revoke select on table "public"."templates" from "anon";

revoke trigger on table "public"."templates" from "anon";

revoke truncate on table "public"."templates" from "anon";

revoke update on table "public"."templates" from "anon";

revoke delete on table "public"."templates" from "authenticated";

revoke insert on table "public"."templates" from "authenticated";

revoke references on table "public"."templates" from "authenticated";

revoke select on table "public"."templates" from "authenticated";

revoke trigger on table "public"."templates" from "authenticated";

revoke truncate on table "public"."templates" from "authenticated";

revoke update on table "public"."templates" from "authenticated";

revoke delete on table "public"."templates" from "service_role";

revoke insert on table "public"."templates" from "service_role";

revoke references on table "public"."templates" from "service_role";

revoke select on table "public"."templates" from "service_role";

revoke trigger on table "public"."templates" from "service_role";

revoke truncate on table "public"."templates" from "service_role";

revoke update on table "public"."templates" from "service_role";

alter table "public"."context_menus" drop constraint "context_menus_options_jsonb_array_check";

alter table "public"."context_menus" drop constraint "context_menus_selection_mode_check";

alter table "public"."prompts" drop constraint "prompts_prompt_payload_jsonb_check";

alter table "public"."templates" drop constraint "templates_user_id_fkey";

alter table "public"."categories" drop constraint "categories_user_id_fkey";

alter table "public"."context_menus" drop constraint "context_menus_user_id_fkey";

alter table "public"."prompts" drop constraint "prompts_category_id_fkey";

alter table "public"."prompts" drop constraint "prompts_user_id_fkey";

alter table "public"."templates" drop constraint "templates_pkey";

drop index if exists "public"."context_menus_selection_mode_idx";

drop index if exists "public"."prompts_output_format_idx";

drop index if exists "public"."prompts_schema_version_idx";

drop index if exists "public"."templates_pkey";

drop table "public"."templates";

alter table "public"."categories" drop column "updated_at";

alter table "public"."categories" alter column "id" drop default;

alter table "public"."categories" alter column "id" add generated always as identity;

alter table "public"."categories" alter column "user_id" set default auth.uid();

alter table "public"."categories" alter column "user_id" set not null;

alter table "public"."context_menus" drop column "selection_mode";

alter table "public"."context_menus" alter column "id" drop default;

alter table "public"."context_menus" alter column "id" add generated always as identity;

alter table "public"."context_menus" alter column "options" set not null;

alter table "public"."context_menus" alter column "user_id" set default auth.uid();

alter table "public"."context_menus" alter column "user_id" set not null;

alter table "public"."prompts" drop column "language";

alter table "public"."prompts" drop column "output_format";

alter table "public"."prompts" drop column "prompt_payload_jsonb";

alter table "public"."prompts" drop column "reference_url";

alter table "public"."prompts" drop column "schema_version";

alter table "public"."prompts" drop column "selected_menu_ids";

alter table "public"."prompts" alter column "enabled_menu_ids" drop default;
alter table "public"."prompts" alter column "enabled_menu_ids" set data type jsonb using to_jsonb("enabled_menu_ids");
alter table "public"."prompts" alter column "enabled_menu_ids" set default '[]'::jsonb;

alter table "public"."prompts" alter column "id" drop default;

alter table "public"."prompts" alter column "id" add generated always as identity;

alter table "public"."prompts" alter column "user_id" set default auth.uid();

alter table "public"."prompts" alter column "user_id" set not null;

drop sequence if exists "public"."categories_id_seq";

drop sequence if exists "public"."context_menus_id_seq";

drop sequence if exists "public"."prompts_id_seq";

drop sequence if exists "public"."templates_id_seq";

CREATE UNIQUE INDEX context_menus_user_id_menu_id_key ON public.context_menus USING btree (user_id, menu_id);

CREATE INDEX idx_categories_user_id ON public.categories USING btree (user_id);

CREATE INDEX idx_context_menus_user_id ON public.context_menus USING btree (user_id);

CREATE INDEX idx_prompts_category_id ON public.prompts USING btree (category_id);

CREATE INDEX idx_prompts_user_id ON public.prompts USING btree (user_id);

alter table "public"."context_menus" add constraint "context_menus_user_id_menu_id_key" UNIQUE using index "context_menus_user_id_menu_id_key";

alter table "public"."categories" add constraint "categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."categories" validate constraint "categories_user_id_fkey";

alter table "public"."context_menus" add constraint "context_menus_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."context_menus" validate constraint "context_menus_user_id_fkey";

alter table "public"."prompts" add constraint "prompts_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL not valid;

alter table "public"."prompts" validate constraint "prompts_category_id_fkey";

alter table "public"."prompts" add constraint "prompts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."prompts" validate constraint "prompts_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
;


  create policy "Controle Total Categorias"
  on "public"."categories"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Individual access"
  on "public"."categories"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "categories_delete_authenticated"
  on "public"."categories"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "categories_insert_authenticated"
  on "public"."categories"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "categories_owner_delete"
  on "public"."categories"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "categories_owner_insert"
  on "public"."categories"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "categories_owner_read"
  on "public"."categories"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "categories_owner_update"
  on "public"."categories"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "categories_select_authenticated"
  on "public"."categories"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "categories_update_authenticated"
  on "public"."categories"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Controle Total Menus"
  on "public"."context_menus"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Individual access"
  on "public"."context_menus"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "context_menus_delete_authenticated"
  on "public"."context_menus"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "context_menus_insert_authenticated"
  on "public"."context_menus"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "context_menus_owner_delete"
  on "public"."context_menus"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "context_menus_owner_insert"
  on "public"."context_menus"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "context_menus_owner_read"
  on "public"."context_menus"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "context_menus_owner_update"
  on "public"."context_menus"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "context_menus_select_authenticated"
  on "public"."context_menus"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "context_menus_update_authenticated"
  on "public"."context_menus"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Controle Total Prompts"
  on "public"."prompts"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Individual access"
  on "public"."prompts"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "prompts_delete_authenticated"
  on "public"."prompts"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "prompts_delete_own"
  on "public"."prompts"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "prompts_insert_authenticated"
  on "public"."prompts"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "prompts_insert_own"
  on "public"."prompts"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "prompts_owner_delete"
  on "public"."prompts"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "prompts_owner_insert"
  on "public"."prompts"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "prompts_owner_read"
  on "public"."prompts"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "prompts_owner_update"
  on "public"."prompts"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "prompts_select_authenticated"
  on "public"."prompts"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "prompts_select_own"
  on "public"."prompts"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "prompts_update_authenticated"
  on "public"."prompts"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "prompts_update_own"
  on "public"."prompts"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


CREATE TRIGGER context_menus_set_updated_at BEFORE UPDATE ON public.context_menus FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER "Netfly" AFTER INSERT OR DELETE OR UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://api.netlify.com/build_hooks/69a3b3ec1ecf120e04816abf', 'POST', '{"Content-type":"application/json"}', '{}', '5000');

CREATE TRIGGER prompts_set_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


  create policy "Allow listening for broadcasts for authenticated users only"
  on "realtime"."messages"
  as permissive
  for select
  to authenticated
using ((extension = 'broadcast'::text));



