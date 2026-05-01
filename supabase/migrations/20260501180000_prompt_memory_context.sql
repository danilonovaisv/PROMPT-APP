-- Create table for prompt memory context
CREATE TABLE IF NOT EXISTS public.prompt_memory_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, key)
);

-- Enable RLS
ALTER TABLE public.prompt_memory_context ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own memory context"
    ON public.prompt_memory_context
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS 55647
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
55647 language 'plpgsql';

CREATE TRIGGER on_prompt_memory_context_updated
    BEFORE UPDATE ON public.prompt_memory_context
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
