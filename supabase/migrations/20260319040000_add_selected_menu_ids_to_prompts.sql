alter table prompts
alter column selected_menu_ids drop default,
alter column selected_menu_ids type jsonb using coalesce(to_jsonb(selected_menu_ids), '[]'::jsonb),
alter column selected_menu_ids set default '[]'::jsonb;
