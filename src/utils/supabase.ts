import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseConfig } from '@/lib/supabaseConfig';

const resolvedSupabaseConfig = resolveSupabaseConfig(import.meta.env);

const supabase = createClient(
  resolvedSupabaseConfig.url || 'https://placeholder.supabase.co',
  resolvedSupabaseConfig.anonKey || 'placeholder',
);

export default supabase;
