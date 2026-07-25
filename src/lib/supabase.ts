import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseConfigErrorMessage,
  resolveSupabaseConfig,
} from "@/lib/supabaseConfig";
import type { Database } from "@/lib/supabase.types";

// @ts-expect-error - import.meta.env is provided by Vite, but causes issues in Jest/ts-jest
const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env || process.env;
const resolvedSupabaseConfig = resolveSupabaseConfig(env);

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

export const supabase = createClient<Database>(
  resolvedSupabaseConfig.url || "https://placeholder.supabase.co",
  resolvedSupabaseConfig.anonKey || "placeholder",
);
