import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { createSnapshot } from "@/utils/backupManager";
import { syncCategories } from "./sync/categorySync";
import { syncMenus } from "./sync/menuSync";
import { syncPrompts } from "./sync/promptSync";
import { syncMemoryToCloud, downloadMemoryFromCloud } from "./sync/memorySync";
import { downloadCategories } from "./sync/categorySync";
import { downloadMenus } from "./sync/menuSync";
import { downloadPrompts } from "./sync/promptSync";

/** Phase result for aggregated reporting. */
interface PhaseResult {
  name: string;
  success: boolean;
  durationMs: number;
  error?: string;
}

/** Aggregate result for a full sync or download cycle. */
export interface SyncCycleResult {
  success: boolean;
  phases: PhaseResult[];
}

/**
 * Runs a single sync phase with timing and error capture.
 * Returns a PhaseResult instead of throwing — allows all phases to run.
 */
async function runPhase(
  name: string,
  fn: () => Promise<unknown>
): Promise<PhaseResult> {
  const start = Date.now();
  try {
    console.time(`☁️  ${name}`);
    await fn();
    console.timeEnd(`☁️  ${name}`);
    return { name, success: true, durationMs: Date.now() - start };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : String(e);
    console.timeEnd(`☁️  ${name}`);
    console.error(`❌ Fase "${name}" falhou:`, error);
    return { name, success: false, durationMs: Date.now() - start, error };
  }
}

export const syncToCloud = async (): Promise<boolean> => {
  assertSupabaseConfigured();

  const { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session;

  // Avoid hard-failing active users when refresh endpoint is flaky.
  // Only try refresh if no usable session is available.
  if (!session) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      throw new Error("Usuário não autenticado ou sessão expirada");
    }
    session = refreshData.session;
  }

  const userId = session.user.id;

  const snapshot = await createSnapshot();
  const phases: PhaseResult[] = [];

  // A ordem é CRÍTICA devido às chaves estrangeiras (IDs):
  // Categorias → Menus → Prompts → Memória

  // 1. Sincronizar Categorias
  let categoryMap: Map<number, number> = new Map();
  const catPhase = await runPhase("Categorias", async () => {
    categoryMap = await syncCategories(userId, snapshot.data.categories);
  });
  phases.push(catPhase);

  // 2. Sincronizar Menus de Contexto
  phases.push(
    await runPhase("Menus", () => syncMenus(userId, snapshot.data.contextMenus))
  );

  // 3. Sincronizar Prompts (depende do categoryMap da fase 1)
  phases.push(
    await runPhase("Prompts", () => syncPrompts(userId, snapshot.data.prompts, categoryMap))
  );

  // 4. Sincronizar Memória Fixa
  phases.push(
    await runPhase("Memória Fixa", () => syncMemoryToCloud(userId))
  );

  // Resumo
  const failed = phases.filter((p) => !p.success);
  const totalMs = phases.reduce((acc, p) => acc + p.durationMs, 0);

  if (failed.length === 0) {
    console.log(`✅ Sincronização concluída em ${totalMs}ms (${phases.length} fases OK)`);
    return true;
  } else {
    const names = failed.map((p) => p.name).join(", ");
    console.warn(`⚠️ Sincronização parcial: ${failed.length} fase(s) com erro — ${names}`);
    // Throw only if ALL phases failed
    if (failed.length === phases.length) {
      throw new Error(`Sincronização falhou em todas as fases: ${names}`);
    }
    return true; // Partial success — let caller decide via console warnings
  }
};

export const downloadFromCloud = async (): Promise<boolean> => {
  assertSupabaseConfigured();

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      throw new Error("Usuário não autenticado ou sessão expirada");
    }
  }

  console.log("☁️ Iniciando Download Atômico (Nuvem → Local)...");

  const phases: PhaseResult[] = [];

  // A ordem é CRÍTICA devido às chaves estrangeiras (IDs)
  let remoteToLocalCatMap: Map<number, number> = new Map();
  let remoteToLocalMenuMap: Map<number, number> = new Map();

  // 1. Categorias
  phases.push(
    await runPhase("Download Categorias", async () => {
      remoteToLocalCatMap = await downloadCategories();
    })
  );

  // 2. Menus
  phases.push(
    await runPhase("Download Menus", async () => {
      remoteToLocalMenuMap = await downloadMenus();
    })
  );

  // 3. Prompts (usa mapas para traduzir IDs)
  phases.push(
    await runPhase("Download Prompts", () =>
      downloadPrompts(remoteToLocalCatMap, remoteToLocalMenuMap)
    )
  );

  // 4. Memória Fixa
  phases.push(
    await runPhase("Download Memória Fixa", () => downloadMemoryFromCloud())
  );

  const failed = phases.filter((p) => !p.success);
  const totalMs = phases.reduce((acc, p) => acc + p.durationMs, 0);

  if (failed.length === 0) {
    console.log(`✅ Download concluído em ${totalMs}ms (${phases.length} fases OK)`);
  } else {
    const names = failed.map((p) => p.name).join(", ");
    console.warn(`⚠️ Download parcial: ${failed.length} fase(s) com erro — ${names}`);
    if (failed.length === phases.length) {
      throw new Error(`Download falhou em todas as fases: ${names}`);
    }
  }

  return true;
};
