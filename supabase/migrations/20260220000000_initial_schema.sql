-- Initial schema for Prompt App: core tables creation
-- This migration runs before 'templates' setup to ensure dependencies exist.

DO $$
BEGIN
  -- 1. Categories Table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
    CREATE TABLE public.categories (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Table public.categories created';
  END IF;

  -- 2. Context Menus Table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'context_menus') THEN
    CREATE TABLE public.context_menus (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      menu_id TEXT NOT NULL,
      menu_name TEXT NOT NULL,
      description TEXT,
      options JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Table public.context_menus created';
  END IF;

  -- 3. Prompts Table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prompts') THEN
    CREATE TABLE public.prompts (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      category_id BIGINT REFERENCES public.categories(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Table public.prompts created';
  END IF;
END $$;
