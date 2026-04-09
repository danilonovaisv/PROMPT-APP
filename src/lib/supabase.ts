import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseConfigErrorMessage,
  resolveSupabaseConfig,
} from "@/lib/supabaseConfig";

const resolvedSupabaseConfig = resolveSupabaseConfig(import.meta.env);

export const isSupabaseConfigured = resolvedSupabaseConfig.isConfigured;
export const missingSupabaseVars = resolvedSupabaseConfig.missingVars;
export const supabaseConfigErrorMessage = getSupabaseConfigErrorMessage(
  missingSupabaseVars,
);

if (!isSupabaseConfigured) {
  console.warn(
    `${supabaseConfigErrorMessage} Recursos em nuvem serão desativados.`,
  );
}

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigErrorMessage);
  }
}

export const supabase = createClient(
  resolvedSupabaseConfig.url || "https://placeholder.supabase.co",
  resolvedSupabaseConfig.anonKey || "placeholder",
);
