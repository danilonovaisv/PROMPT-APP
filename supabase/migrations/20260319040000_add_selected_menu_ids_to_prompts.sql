alter table prompts
add column selected_menu_ids jsonb default '[]'::jsonb;
