-- Adiciona o campo selection_mode aos menus do template
ALTER TABLE public.context_menus 
ADD COLUMN IF NOT EXISTS selection_mode TEXT DEFAULT 'single';
