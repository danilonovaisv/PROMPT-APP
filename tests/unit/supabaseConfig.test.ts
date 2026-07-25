import {
  getSupabaseConfigErrorMessage,
  resolveSupabaseConfig,
  type SupabaseEnv,
} from "@/lib/supabaseConfig";

describe("resolveSupabaseConfig", () => {
  test("considera configuração válida quando URL e ANON key existem", () => {
    const env: SupabaseEnv = {
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "anon-key",
    };

    const config = resolveSupabaseConfig(env);

    expect(config.isConfigured).toBe(true);
    expect(config.url).toBe("https://example.supabase.co");
    expect(config.anonKey).toBe("anon-key");
    expect(config.missingVars).toEqual([]);
  });

  test("falha explicitamente quando anon key está ausente", () => {
    const env: SupabaseEnv = {
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "",
    };

    const config = resolveSupabaseConfig(env);

    expect(config.isConfigured).toBe(false);
    expect(config.missingVars).toEqual(["VITE_SUPABASE_ANON_KEY"]);
    expect(getSupabaseConfigErrorMessage(config.missingVars)).toContain(
      "VITE_SUPABASE_ANON_KEY",
    );
  });

  test("aceita fallback VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY para compatibilidade", () => {
    const env: SupabaseEnv = {
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "publishable-key",
    };

    const config = resolveSupabaseConfig(env);

    expect(config.isConfigured).toBe(true);
    expect(config.anonKey).toBe("publishable-key");
    expect(config.missingVars).toEqual([]);
  });

  test("aceita VITE_SUPABASE_PUBLISHABLE_KEY como chave pública atual", () => {
    const env: SupabaseEnv = {
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    };

    const config = resolveSupabaseConfig(env);

    expect(config.isConfigured).toBe(true);
    expect(config.anonKey).toBe("publishable-key");
    expect(config.missingVars).toEqual([]);
  });

  test("normaliza valores com whitespace e ignora entradas não string", () => {
    const env: SupabaseEnv = {
      VITE_SUPABASE_URL: "  https://example.supabase.co  ",
      VITE_SUPABASE_PUBLISHABLE_KEY: " publishable-key ",
      INVALID_VAL: 123,
    };

    const config = resolveSupabaseConfig(env);

    expect(config.isConfigured).toBe(true);
    expect(config.url).toBe("https://example.supabase.co");
    expect(config.anonKey).toBe("publishable-key");
  });

  test("lista ambas as variáveis obrigatórias quando nenhuma foi definida", () => {
    const env: SupabaseEnv = {};

    const config = resolveSupabaseConfig(env);

    expect(config.isConfigured).toBe(false);
    expect(config.missingVars).toEqual([
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_ANON_KEY",
    ]);
    expect(getSupabaseConfigErrorMessage(config.missingVars)).toContain(
      "VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY",
    );
  });
});
