/* ======================================================
   Gerenciador de Assets e Atualizações
   ====================================================== */

import { db } from "@/db/database";
import { supabase } from "@/lib/supabase";
import { saveLocalBackup } from "@/utils/backupManager";
import {
  compilePromptPayload,
  getLegacyPromptColumns,
  getPrimaryReferenceUrl,
  getPromptSummaryFields,
  parsePromptPayload,
  parseUserSelection,
} from "@/models/promptSchema";
// Tipos utilizados para tipagem

export interface AssetUpdate {
  type: "category" | "prompt" | "menu";
  id: number;
  remoteId?: number;
  action: "created" | "updated" | "deleted";
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface ConflictResolution {
  strategy: "localWins" | "remoteWins" | "merge" | "askUser";
  timestamp: Date;
  resolved: boolean;
}

/**
 * Detecta conflitos entre dados locais e remotos
 */
export async function detectConflicts(): Promise<AssetUpdate[]> {
  const conflicts: AssetUpdate[] = [];
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return conflicts;

  try {
    // Buscar dados remotos
    const [catRes, promptRes] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", session.user.id),
      supabase.from("prompts").select("*").eq("user_id", session.user.id),
      // supabase.from('context_menus').select('*').eq('user_id', session.user.id),
    ]);

    // Verificar categorias
    const remoteCategories = catRes.data || [];
    const localCategories = await db.categories.toArray();

    const localCategoriesMap = new Map();
    for (const c of localCategories) {
      if (c.remoteId != null) localCategoriesMap.set(c.remoteId, c);
    }

    for (const remote of remoteCategories) {
      const local = localCategoriesMap.get(remote.id);
      if (local) {
        const remoteUpdated = new Date(remote.updated_at || remote.created_at);
        const localUpdated = new Date(
          (local as any).updatedAt || local.createdAt,
        );

        if (remoteUpdated > localUpdated) {
          conflicts.push({
            type: "category",
            id: local.id!,
            remoteId: remote.id,
            action: "updated",
            timestamp: remoteUpdated,
            data: remote,
          });
        }
      }
    }

    // Verificar prompts (similar para menus)
    const remotePrompts = promptRes.data || [];
    const localPrompts = await db.prompts.toArray();

    const localPromptsMap = new Map();
    for (const p of localPrompts) {
      if (p.remoteId != null) localPromptsMap.set(p.remoteId, p);
    }

    for (const remote of remotePrompts) {
      const local = localPromptsMap.get(remote.id);
      if (local) {
        const remoteUpdated = new Date(remote.updated_at || remote.created_at);
        const localUpdated = new Date(
          (local as any).updatedAt || local.createdAt,
        );

        if (remoteUpdated > localUpdated) {
          conflicts.push({
            type: "prompt",
            id: local.id!,
            remoteId: remote.id,
            action: "updated",
            timestamp: remoteUpdated,
            data: remote,
          });
        }
      }
    }

    return conflicts;
  } catch (error) {
    console.error("❌ Erro ao detectar conflitos:", error);
    return [];
  }
}

/**
 * Resolve conflitos de acordo com a estratégia escolhida
 */
export async function resolveConflicts(
  conflicts: AssetUpdate[],
  strategy: ConflictResolution["strategy"] = "remoteWins",
): Promise<void> {
  console.log(
    `🔄 Resolvendo ${conflicts.length} conflitos usando estratégia: ${strategy}`,
  );

  for (const conflict of conflicts) {
    try {
      switch (strategy) {
        case "remoteWins":
          await applyRemoteChanges(conflict);
          break;

        case "localWins":
          await pushLocalChanges(conflict);
          break;

        case "merge":
          await mergeChanges(conflict);
          break;

        case "askUser":
          // Implementar lógica para perguntar ao usuário
          console.log("❓ Conflito requer decisão do usuário:", conflict);
          break;
      }
    } catch (error) {
      console.error(
        `❌ Erro ao resolver conflito ${conflict.type} #${conflict.id}:`,
        error,
      );
    }
  }

  await saveLocalBackup();
  console.log("✅ Resolução de conflitos concluída");
}

/**
 * Aplica mudanças remotas aos dados locais
 */
async function applyRemoteChanges(update: AssetUpdate): Promise<void> {
  const remoteData = update.data;

  // Type assertions for remote data
  const rd = remoteData as Record<string, any>;

  switch (update.type) {
    case "category":
      if (remoteData) {
        await db.categories.update(update.id, {
          name: rd.name,
          icon: rd.icon,
          color: rd.color,
          // updatedAt: new Date(rd.updated_at || rd.created_at)
        });
        console.log(`📥 Categoria #${update.id} atualizada com dados remotos`);
      }
      break;

    case "prompt":
      if (remoteData) {
        const promptPayload = parsePromptPayload(
          rd.prompt_payload_jsonb,
          {
            title: rd.title,
            systemRole: rd.system_role,
            task: rd.task,
            context: rd.context,
            contextMenus: rd.context_menus,
            enabledMenuIds: rd.enabled_menu_ids,
            constraints: rd.constraints,
            negativePrompt: rd.negative_prompt,
            outputSchema: rd.output_schema,
            referenceUrl: rd.reference_url,
            language: rd.language,
            schemaVersion: rd.schema_version,
          },
        );
        const selectionPayload = parseUserSelection(
          rd.selection_payload_jsonb,
          promptPayload.meta.template_id,
          {
            title: rd.title,
            schemaVersion: rd.schema_version,
            language: rd.language,
            contextMenus: rd.context_menus,
            enabledMenuIds: rd.enabled_menu_ids,
          },
        );
        await db.prompts.update(update.id, {
          categoryId: rd.category_id,
          title: rd.title,
          promptPayload,
          selectionPayload,
          compiledPayload: rd.compiled_payload_jsonb ||
            compilePromptPayload(promptPayload, selectionPayload),
          schemaVersion: rd.schema_version || "1.0.0",
          language: rd.language || "pt-BR",
          outputFormat: rd.output_format || "markdown",
          referenceUrl: rd.reference_url || undefined,
          fewShotExamples: rd.few_shot_examples || [],
          updatedAt: new Date(rd.updated_at || rd.created_at),
        });
        console.log(`📥 Prompt #${update.id} atualizado com dados remotos`);
      }
      break;

    case "menu":
      if (remoteData) {
        await db.contextMenus.update(update.id, {
          menuId: rd.menu_id,
          menuName: rd.menu_name,
          description: rd.description,
          selectionMode: rd.selection_mode || "single",
          options: rd.options || [],
          updatedAt: new Date(rd.updated_at || rd.created_at),
        });
        console.log(`📥 Menu #${update.id} atualizado com dados remotos`);
      }
      break;
  }
}

/**
 * Envia mudanças locais para o servidor de forma inteligente
 */
async function pushLocalChanges(update: AssetUpdate): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const localItem = await getLocalItem(update.type, update.id);
  if (!localItem) return;

  console.log(`📤 Enviando mudanças locais para ${update.type} #${update.id}`);

  let table = "";
  let payload: any = {};

  switch (update.type) {
    case "category":
      table = "categories";
      payload = {
        name: localItem.name,
        icon: localItem.icon,
        color: localItem.color,
        user_id: session.user.id,
      };
      break;
    case "prompt":
      const promptSummary = getPromptSummaryFields(localItem.promptPayload);
      table = "prompts";
      payload = {
        category_id: localItem.categoryId,
        title: promptSummary.title,
        prompt_payload_jsonb: localItem.promptPayload,
        schema_version: promptSummary.schemaVersion,
        output_format: promptSummary.outputFormat,
        language: promptSummary.language,
        reference_url: getPrimaryReferenceUrl(localItem.promptPayload),
        few_shot_examples: localItem.fewShotExamples || [],
        user_id: session.user.id,
        ...getLegacyPromptColumns(
          localItem.promptPayload,
          localItem.selectionPayload,
          localItem.compiledPayload,
        ),
      };
      break;
    case "menu":
      table = "context_menus";
      payload = {
        menu_id: localItem.menuId,
        menu_name: localItem.menuName,
        description: localItem.description,
        selection_mode: localItem.selectionMode || "single",
        options: localItem.options || [],
        user_id: session.user.id,
      };
      break;
  }

  if (localItem.remoteId) {
    const { error } = await supabase
      .from(table)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", localItem.remoteId)
      .eq("user_id", session.user.id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from(table)
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;

    // Atualiza localmente com o novo remoteId
    await (db as any)[table !== "context_menus" ? table : "contextMenus"]
      .update(update.id, {
        remoteId: data.id,
        syncStatus: "synced",
      });
  }
}

/**
 * Mescla mudanças locais e remotas
 */
async function mergeChanges(update: AssetUpdate): Promise<void> {
  // Implementar lógica de merge mais sofisticada
  console.log(`🔄 Mesclando mudanças para ${update.type} #${update.id}`);

  // Por enquanto, usa a abordagem mais recente wins
  const remoteTimestamp = update.timestamp;
  const localItem = await getLocalItem(update.type, update.id);

  if (localItem) {
    const localTimestamp = new Date(localItem.updatedAt || localItem.createdAt);

    if (remoteTimestamp > localTimestamp) {
      await applyRemoteChanges(update);
    } else {
      await pushLocalChanges(update);
    }
  }
}

/**
 * Obtém item local pelo tipo e ID
 */
async function getLocalItem(
  type: AssetUpdate["type"],
  id: number,
): Promise<any> {
  switch (type) {
    case "category":
      return await db.categories.get(id);
    case "prompt":
      return await db.prompts.get(id);
    case "menu":
      return await db.contextMenus.get(id);
    default:
      return null;
  }
}

/**
 * Sincronização inteligente bidirecional
 */
export async function smartSync(): Promise<{
  pulled: number;
  pushed: number;
  conflicts: number;
}> {
  console.log("🧠 Iniciando sincronização inteligente...");

  const result = { pulled: 0, pushed: 0, conflicts: 0 };

  try {
    // 1. Detectar conflitos
    const conflicts = await detectConflicts();
    result.conflicts = conflicts.length;

    if (conflicts.length > 0) {
      console.log(`⚠️ ${conflicts.length} conflito(s) detectado(s)`);
      await resolveConflicts(conflicts, "remoteWins");
    }

    // 2. Pull de dados remotos (dados mais recentes)
    const pullResult = await pullLatestChanges();
    result.pulled = pullResult.pulled;

    // 3. Push de dados locais pendentes
    const pushResult = await pushPendingChanges();
    result.pushed = pushResult.pushed;

    await saveLocalBackup();

    console.log(
      `✅ Sync inteligente concluído: ${result.pulled} recebidos, ${result.pushed} enviados, ${result.conflicts} conflitos`,
    );

    return result;
  } catch (error) {
    console.error("❌ Erro na sincronização inteligente:", error);
    throw error;
  }
}

/**
 * Puxa as últimas mudanças do servidor que não existem localmente
 */
async function pullLatestChanges(): Promise<{ pulled: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { pulled: 0 };

  console.log("📥 Puxando últimas mudanças do servidor...");
  let pulledCount = 0;

  // Buscar todos os IDs remotos
  const [catRes, promptRes, menuRes] = await Promise.all([
    supabase.from("categories").select("*").eq("user_id", session.user.id),
    supabase.from("prompts").select("*").eq("user_id", session.user.id),
    supabase.from("context_menus").select("*").eq("user_id", session.user.id),
  ]);

  const pullItems = async (
    remoteItems: any[] | null,
    localTable: any,
    type: AssetUpdate["type"],
  ) => {
    if (!remoteItems || remoteItems.length === 0) return;

    const localItems = await localTable.toArray();
    const existingRemoteIds = new Set(
      localItems
        .map((item: { remoteId?: number }) => item.remoteId)
        .filter((id): id is number => id != null)
    );

    for (const remote of remoteItems) {
      const exists = existingRemoteIds.has(remote.id);
      if (!exists) {
        await applyRemoteChanges({
          type,
          id: 0, // Novo item
          action: "created",
          timestamp: new Date(remote.created_at),
          data: remote,
        });
        pulledCount++;
      }
    }
  };

  await pullItems(catRes.data, db.categories, "category");
  await pullItems(promptRes.data, db.prompts, "prompt");
  await pullItems(menuRes.data, db.contextMenus, "menu");

  return { pulled: pulledCount };
}

/**
 * Envia mudanças locais pendentes que não têm remoteId ou estão com syncStatus 'pending'
 */
async function pushPendingChanges(): Promise<{ pushed: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { pushed: 0 };

  console.log("📤 Enviando mudanças locais pendentes...");
  let pushedCount = 0;

  const findPending = async (table: any, type: AssetUpdate["type"]) => {
    const pending = await table.where("syncStatus").equals("pending").toArray();
    for (const item of pending) {
      await pushLocalChanges({
        type,
        id: item.id!,
        action: item.remoteId ? "updated" : "created",
        timestamp: new Date(),
        data: item,
      });
      pushedCount++;
    }
  };

  await findPending(db.categories, "category");
  await findPending(db.prompts, "prompt");
  await findPending(db.contextMenus, "menu");

  return { pushed: pushedCount };
}

/**
 * Verifica se há atualizações disponíveis
 */
export async function checkForUpdates(): Promise<boolean> {
  const conflicts = await detectConflicts();
  return conflicts.length > 0;
}

/**
 * Monitora mudanças em tempo real e atualiza assets automaticamente
 */
export function setupAssetMonitoring() {
  // Esta função pode ser expandida para monitorar:
  // - Mudanças na conexão de internet
  // - Status de sincronização
  // - Notificações de atualizações disponíveis

  console.log("👀 Monitoramento de assets ativado");
}
