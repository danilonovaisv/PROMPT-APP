-- Security Hardening: Storage Buckets and RLS tightening
-- Target: attachments bucket and prompt_memory_context

BEGIN;

-- 1. Create attachments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Add storage policies for attachments
-- Allow authenticated users to upload files to their own folder
DROP POLICY IF EXISTS "Allow authenticated users to upload attachments" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to view their own attachments
DROP POLICY IF EXISTS "Allow users to view their own attachments" ON storage.objects;
CREATE POLICY "Allow users to view their own attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own attachments
DROP POLICY IF EXISTS "Allow users to delete their own attachments" ON storage.objects;
CREATE POLICY "Allow users to delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Tighten RLS for prompt_memory_context
-- We explicitly set the owner check and remove the subquery for better performance/clarity.
ALTER TABLE public.prompt_memory_context ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memory_select" ON public.prompt_memory_context;
CREATE POLICY "memory_select" ON public.prompt_memory_context
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "memory_insert" ON public.prompt_memory_context;
CREATE POLICY "memory_insert" ON public.prompt_memory_context
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "memory_update" ON public.prompt_memory_context;
CREATE POLICY "memory_update" ON public.prompt_memory_context
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "memory_delete" ON public.prompt_memory_context;
CREATE POLICY "memory_delete" ON public.prompt_memory_context
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Fix potential missing RLS on categories (Audit mentioned prompt_categories)
-- Ensuring categories is definitely protected
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

COMMIT;
