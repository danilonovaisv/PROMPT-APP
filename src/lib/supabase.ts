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

/**
 * Helper to identify if an error is caused by Supabase 402 Payment Required / Egress Quota Exceeded.
 */
export function isQuotaExceededError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (err.status === 402 || err.statusCode === 402 || err.code === '402') return true;
    const msg = String(err.message || err.details || err.hint || '').toLowerCase();
    if (
      msg.includes('quota') ||
      msg.includes('egress exceeded') ||
      msg.includes('fair use policy') ||
      msg.includes('restricted') ||
      msg.includes('payment required')
    ) {
      return true;
    }
  }
  return false;
}
