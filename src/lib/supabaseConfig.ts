export interface SupabaseEnv {
  [key: string]: unknown;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY?: string;
}

export interface SupabaseResolvedConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  missingVars: string[];
}

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function resolveSupabaseConfig(
  env: SupabaseEnv,
): SupabaseResolvedConfig {
  const url = normalize(env.VITE_SUPABASE_URL);
  const anonKey = normalize(env.VITE_SUPABASE_ANON_KEY) ||
    normalize(env.VITE_SUPABASE_PUBLISHABLE_KEY) ||
    normalize(env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY);

  const missingVars: string[] = [];
  if (!url) {
    missingVars.push("VITE_SUPABASE_URL");
  }
  if (!anonKey) {
    missingVars.push("VITE_SUPABASE_ANON_KEY");
  }

  return {
    url,
    anonKey,
    isConfigured: missingVars.length === 0,
    missingVars,
  };
}

export function getSupabaseConfigErrorMessage(missingVars: string[]): string {
  const required = missingVars.join(" e ");
  return `Configuração do Supabase ausente. Defina ${required}.`;
}
