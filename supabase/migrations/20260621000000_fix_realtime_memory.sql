-- Migration: Habilitar Realtime e Replica Identity Full para prompt_memory_context
-- 1. Configura REPLICA IDENTITY FULL para que o payload antigo (old) envie todas as colunas nas atualizações/exclusões.
ALTER TABLE public.prompt_memory_context REPLICA IDENTITY FULL;

-- 2. Adiciona a tabela à publicação supabase_realtime para permitir a escuta ativa de mudanças no cliente.
ALTER PUBLICATION supabase_realtime ADD TABLE public.prompt_memory_context;
