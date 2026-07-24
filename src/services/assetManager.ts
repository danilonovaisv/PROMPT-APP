/* ======================================================
   Gerenciador de Assets e Atualizações
   ====================================================== */

import { type Table } from "dexie";
import { db } from "@/db/database";
import { supabase } from "@/lib/supabase";
import { saveLocalBackup } from "@/utils/backupManager";
import {
  compilePromptPayload,
  getLegacyPromptColumns,
  getPromptSummaryFields,
  parsePromptPayload,
  parseUserSelection,
  type LegacyContextMenuSelection,
} from "@/models/promptSchema";
import type { Category, ContextMenu, Prompt, PromptMemory, FewShotExample, RemoteCategory, RemoteContextMenu, RemotePrompt, RemotePromptMemory } from "@/models/types";
// Tipos utilizados para tipagem

export interface AssetUpdate {
  type: "category" | "prompt" | "menu" | "memory";
  id: number;
  remoteId?: number | string;
  action: "created" | "updated" | "deleted";
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface ConflictResolution {
  strategy: "localWins" | "remoteWins" | "merge" | "askUser";
  timestamp: Date;
  resolved: boolean;
}

type NumericRemoteEntity = Category | Prompt | ContextMenu;
type SyncableEntity = NumericRemoteEntity | PromptMemory;
type RemoteCategorySummary = Pick<RemoteCategory, "id" | "created_at" | "updated_at" | "is_deleted">;
type RemotePromptSummary = Pick<RemotePrompt, "id" | "created_at" | "updated_at" | "is_deleted">;
type RemoteMenuSummary = Pick<RemoteContextMenu, "id" | "created_at" | "updated_at" | "is_deleted">;
type RemoteMemorySummary = Pick<RemotePromptMemory, "id" | "template_id" | "key" | "created_at" | "updated_at" | "is_deleted">;

const REMOTE_METADATA_SELECT = "id, created_at, updated_at, is_deleted";
const REMOTE_MEMORY_METADATA_SELECT = "id, template_id, key, created_at, updated_at, is_deleted";

function getLocalUpdatedAt(item: Category | Prompt | ContextMenu | PromptMemory): Date {
  return new Date(item.updatedAt || item.createdAt);
}

async function fetchRemoteSummaries(userId: string): Promise<{
  categories: RemoteCategorySummary[];
  prompts: RemotePromptSummary[];
  menus: RemoteMenuSummary[];
  memory: RemoteMemorySummary[];
}> {
  const [catRes, promptRes, menuRes, memoryRes] = await Promise.all([
    supabase.from("categories").select(REMOTE_METADATA_SELECT).eq("user_id", userId),
    supabase.from("prompts").select(REMOTE_METADATA_SELECT).eq("user_id", userId),
    supabase.from("context_menus").select(REMOTE_METADATA_SELECT).eq("user_id", userId),
    supabase.from("prompt_memory_context").select(REMOTE_MEMORY_METADATA_SELECT).eq("user_id", userId),
  ]);

  if (catRes.error) throw catRes.error;
  if (promptRes.error) throw promptRes.error;
  if (menuRes.error) throw menuRes.error;
  if (memoryRes.error) throw memoryRes.error;

  return {
    categories: (catRes.data || []) as RemoteCategorySummary[],
    prompts: (promptRes.data || []) as RemotePromptSummary[],
    menus: (menuRes.data || []) as RemoteMenuSummary[],
    memory: (memoryRes.data || []) as RemoteMemorySummary[],
  };
}

async function hydrateAssetUpdates(
  userId: string,
  updates: AssetUpdate[],
): Promise<AssetUpdate[]> {
  const categoryIds = updates
    .filter((update) => update.type === "category" && typeof update.remoteId === "number")
    .map((update) => update.remoteId as number);
  const promptIds = updates
    .filter((update) => update.type === "prompt" && typeof update.remoteId === "number")
    .map((update) => update.remoteId as number);
  const menuIds = updates
    .filter((update) => update.type === "menu" && typeof update.remoteId === "number")
    .map((update) => update.remoteId as number);
  const memoryIds = updates
    .filter((update) => update.type === "memory" && typeof update.remoteId === "string")
    .map((update) => update.remoteId as string);

  const [catRes, promptRes, menuRes, memoryRes] = await Promise.all([
    categoryIds.length > 0
      ? supabase.from("categories").select("*").eq("user_id", userId).in("id", categoryIds)
      : Promise.resolve({ data: [] as RemoteCategory[], error: null }),
    promptIds.length > 0
      ? supabase.from("prompts").select("*").eq("user_id", userId).in("id", promptIds)
      : Promise.resolve({ data: [] as RemotePrompt[], error: null }),
    menuIds.length > 0
      ? supabase.from("context_menus").select("*").eq("user_id", userId).in("id", menuIds)
      : Promise.resolve({ data: [] as RemoteContextMenu[], error: null }),
    memoryIds.length > 0
      ? supabase.from("prompt_memory_context").select("*").eq("user_id", userId).in("id", memoryIds)
      : Promise.resolve({ data: [] as RemotePromptMemory[], error: null }),
  ]);

  if (catRes.error) throw catRes.error;
  if (promptRes.error) throw promptRes.error;
  if (menuRes.error) throw menuRes.error;
  if (memoryRes.error) throw memoryRes.error;

  const categories = new Map((catRes.data || []).map((item) => [item.id, item]));
  const prompts = new Map((promptRes.data || []).map((item) => [item.id, item]));
  const menus = new Map((menuRes.data || []).map((item) => [item.id, item]));
  const memory = new Map((memoryRes.data || []).map((item) => [item.id, item]));

  return updates.map((update) => {
    if (update.data) return update;

    if (update.type === "category" && typeof update.remoteId === "number") {
      return { ...update, data: categories.get(update.remoteId) as unknown as Record<string, unknown> | undefined };
    }

    if (update.type === "prompt" && typeof update.remoteId === "number") {
      return { ...update, data: prompts.get(update.remoteId) as unknown as Record<string, unknown> | undefined };
    }

    if (update.type === "menu" && typeof update.remoteId === "number") {
      return { ...update, data: menus.get(update.remoteId) as unknown as Record<string, unknown> | undefined };
    }

    if (update.type === "memory" && typeof update.remoteId === "string") {
      return { ...update, data: memory.get(update.remoteId) as unknown as Record<string, unknown> | undefined };
    }

    return update;
  });
}

/**
 * Detecta conflitos entre dados locais e remotos
 */
export async function detectConflicts(): Promise<AssetUpdate[]> {
  const conflicts: AssetUpdate[] = [];
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return conflicts;

  try {
    const remote = await fetchRemoteSummaries(session.user.id);

    // Verificar categorias
    const remoteCategories = remote.categories;
    const remoteCatIds = remoteCategories.map((c) => c.id);
    const localCategories = remoteCatIds.length > 0
      ? await db.categories.where('remoteId').anyOf(remoteCatIds).toArray()
      : [];

    const localCategoriesMap = new Map(localCategories.filter((c) => c.remoteId != null).map((c) => [c.remoteId!, c]));

    for (const remote of remoteCategories) {
      const local = localCategoriesMap.get(remote.id);
      if (local) {
        const remoteUpdated = new Date(remote.updated_at || remote.created_at);
        const localUpdated = getLocalUpdatedAt(local);

        if (remoteUpdated > localUpdated) {
          conflicts.push({
            type: "category",
            id: local.id!,
            remoteId: remote.id,
            action: remote.is_deleted ? "deleted" : "updated",
            timestamp: remoteUpdated,
          });
        }
      }
    }

    // Verificar prompts
    const remotePrompts = remote.prompts;
    const remotePromptIds = remotePrompts.map((p) => p.id);
    const localPrompts = remotePromptIds.length > 0
      ? await db.prompts.where('remoteId').anyOf(remotePromptIds).toArray()
      : [];

    const localPromptsMap = new Map(localPrompts.filter((p) => p.remoteId != null).map((p) => [p.remoteId!, p]));

    for (const remote of remotePrompts) {
      const local = localPromptsMap.get(remote.id);
      if (local) {
        const remoteUpdated = new Date(remote.updated_at || remote.created_at);
        const localUpdated = new Date(
          local.updatedAt || local.createdAt,
        );

        if (remoteUpdated > localUpdated) {
          conflicts.push({
            type: "prompt",
            id: local.id!,
            remoteId: remote.id,
            action: remote.is_deleted ? "deleted" : "updated",
            timestamp: remoteUpdated,
          });
        }
      }
    }

    const remoteMenus = remote.menus;
    const remoteMenuIds = remoteMenus.map((m) => m.id);
    const localMenus = remoteMenuIds.length > 0
      ? await db.contextMenus.where('remoteId').anyOf(remoteMenuIds).toArray()
      : [];

    const localMenusMap = new Map(localMenus.filter((menu) => menu.remoteId != null).map((menu) => [menu.remoteId!, menu]));

    for (const remote of remoteMenus) {
      const local = localMenusMap.get(remote.id);
      if (local) {
        const remoteUpdated = new Date(remote.updated_at || remote.created_at);
        const localUpdated = new Date(local.updatedAt || local.createdAt);

        if (remoteUpdated > localUpdated) {
          conflicts.push({
            type: "menu",
            id: local.id!,
            remoteId: remote.id,
            action: remote.is_deleted ? "deleted" : "updated",
            timestamp: remoteUpdated,
          });
        }
      }
    }

    const remoteMemory = remote.memory;
    const remoteMemoryKeys = remoteMemory.map((m) => [m.template_id, m.key] as [string, string]);
    const localMemory = remoteMemoryKeys.length > 0
      ? await db.promptMemory.where('[templateId+key]').anyOf(remoteMemoryKeys).toArray()
      : [];
    const localMemoryMap = new Map(localMemory.map((memory) => [`${memory.templateId}|${memory.key}`, memory]));

    for (const remote of remoteMemory) {
      const local = localMemoryMap.get(`${remote.template_id}|${remote.key}`);
      if (local) {
        const remoteUpdated = new Date(remote.updated_at || remote.created_at);
        const localUpdated = new Date(local.updatedAt || local.createdAt);

        if (remoteUpdated > localUpdated) {
          conflicts.push({
            type: "memory",
            id: local.id!,
            remoteId: remote.id,
            action: remote.is_deleted ? "deleted" : "updated",
            timestamp: remoteUpdated,
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
  const { data: { session } } = await supabase.auth.getSession();
  const hydratedConflicts =
    session && (strategy === "remoteWins" || strategy === "merge")
      ? await hydrateAssetUpdates(session.user.id, conflicts)
      : conflicts;

  console.log(
    `🔄 Resolvendo ${hydratedConflicts.length} conflitos usando estratégia: ${strategy}`,
  );

  for (const conflict of hydratedConflicts) {
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

interface AssetRemoteData {
  id: number | string;
  name?: string;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
  category_id?: number;
  title?: string;
  prompt_payload_jsonb?: unknown;
  system_role?: string;
  task?: string;
  context?: string;
  context_menus?: Record<string, unknown>;
  enabled_menu_ids?: string[];
  constraints?: string[];
  negative_prompt?: string[];
  output_schema?: { formato?: string; estrutura?: string };
  reference_url?: string;
  language?: string;
  schema_version?: string;
  selection_payload_jsonb?: unknown;
  compiled_payload_jsonb?: unknown;
  output_format?: "markdown" | "json";
  few_shot_examples?: unknown[];
  menu_id?: string;
  menu_name?: string;
  description?: string;
  selection_mode?: "single" | "multiple";
  options?: unknown;
  key?: string;
  value?: string;
  template_id?: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

  // Type assertions for remote data
  const rd = remoteData as unknown as AssetRemoteData;

  switch (update.type) {
    case "category":
      if (remoteData) {
        if (rd.is_deleted) {
          await db.categories.delete(update.id);
          console.log(`🧹 Categoria #${update.id} removida por soft delete remoto`);
          break;
        }

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
        if (rd.is_deleted) {
          await db.prompts.delete(update.id);
          console.log(`🧹 Prompt #${update.id} removido por soft delete remoto`);
          break;
        }

        const promptPayload = parsePromptPayload(
          rd.prompt_payload_jsonb,
          {
            title: rd.title,
            systemRole: rd.system_role,
            task: rd.task,
            context: rd.context,
            contextMenus: rd.context_menus as Record<string, LegacyContextMenuSelection> | undefined,
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
            contextMenus: rd.context_menus as Record<string, LegacyContextMenuSelection> | undefined,
            enabledMenuIds: rd.enabled_menu_ids,
          },
        );
        await db.prompts.update(update.id, {
          categoryId: rd.category_id,
          title: rd.title,
          promptPayload,
          selectionPayload,
          compiledPayload: (rd.compiled_payload_jsonb ||
            compilePromptPayload(promptPayload, selectionPayload)) as unknown as Prompt["compiledPayload"],
          schemaVersion: rd.schema_version || "1.0.0",
          language: rd.language || "pt-BR",
          outputFormat: rd.output_format || "markdown",
          fewShotExamples: (rd.few_shot_examples || []) as FewShotExample[],
          updatedAt: new Date((rd.updated_at || rd.created_at || new Date().toISOString()) as string),
        });
        console.log(`📥 Prompt #${update.id} atualizado com dados remotos`);
      }
      break;

    case "menu":
      if (remoteData) {
        if (rd.is_deleted) {
          await db.contextMenus.delete(update.id);
          console.log(`🧹 Menu #${update.id} removido por soft delete remoto`);
          break;
        }

        await db.contextMenus.update(update.id, {
          menuId: rd.menu_id,
          menuName: rd.menu_name,
          description: rd.description,
          selectionMode: rd.selection_mode || "single",
          options: (rd.options || []) as unknown as ContextMenu["options"],
          updatedAt: new Date((rd.updated_at || rd.created_at || new Date().toISOString()) as string),
        });
        console.log(`📥 Menu #${update.id} atualizado com dados remotos`);
      }
      break;

    case "memory":
      if (remoteData) {
        if (rd.is_deleted) {
          if (update.id > 0) {
            await db.promptMemory.update(update.id, {
              isDeleted: true,
              syncStatus: "synced",
              updatedAt: new Date((rd.updated_at || rd.deleted_at || new Date().toISOString()) as string),
            });
          }
          break;
        }

        const memoryData: Omit<PromptMemory, "id"> = {
          remoteId: typeof rd.id === "string" ? rd.id : String(rd.id),
          key: rd.key || "",
          value: rd.value || "",
          templateId: rd.template_id || "global",
          isDeleted: false,
          syncStatus: "synced",
          createdAt: new Date((rd.created_at || new Date().toISOString()) as string),
          updatedAt: new Date((rd.updated_at || rd.created_at || new Date().toISOString()) as string),
        };

        if (update.id > 0) {
          await db.promptMemory.update(update.id, memoryData);
        } else {
          await db.promptMemory.add(memoryData);
        }
        console.log(`📥 Memória fixa #${update.id || memoryData.key} atualizada com dados remotos`);
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
  let payload: Record<string, unknown> = {};

  switch (update.type) {
    case "category": {
      const category = localItem as Category;
      table = "categories";
      payload = {
        name: category.name,
        icon: category.icon,
        color: category.color,
        user_id: session.user.id,
      };
      break;
    }
    case "prompt": {
      const prompt = localItem as Prompt;
      const promptSummary = getPromptSummaryFields(prompt.promptPayload as Parameters<typeof getPromptSummaryFields>[0]);
      table = "prompts";
      payload = {
        category_id: prompt.categoryId,
        title: promptSummary.title,
        prompt_payload_jsonb: prompt.promptPayload,
        schema_version: promptSummary.schemaVersion,
        output_format: promptSummary.outputFormat,
        language: promptSummary.language,
        reference_url: null,
        few_shot_examples: prompt.fewShotExamples || [],
        user_id: session.user.id,
        ...getLegacyPromptColumns(
          prompt.promptPayload as Parameters<typeof getLegacyPromptColumns>[0],
          prompt.selectionPayload as Parameters<typeof getLegacyPromptColumns>[1],
          prompt.compiledPayload as Parameters<typeof getLegacyPromptColumns>[2],
        ),
      };
      break;
    }
    case "menu": {
      const menu = localItem as ContextMenu;
      table = "context_menus";
      payload = {
        menu_id: menu.menuId,
        menu_name: menu.menuName,
        description: menu.description,
        selection_mode: menu.selectionMode || "single",
        options: menu.options || [],
        user_id: session.user.id,
      };
      break;
    }
    case "memory": {
      const memory = localItem as PromptMemory;
      table = "prompt_memory_context";
      payload = {
        template_id: memory.templateId,
        key: memory.key,
        value: memory.value,
        is_deleted: !!memory.isDeleted,
        deleted_at: memory.isDeleted ? memory.updatedAt.toISOString() : null,
        user_id: session.user.id,
      };
      break;
    }
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
    const localTableName =
      table === "context_menus"
        ? "contextMenus"
        : table === "prompt_memory_context"
          ? "promptMemory"
          : table;

    await (db as unknown as Record<string, { update: (id: number, changes: object) => Promise<number> }>)[localTableName]
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
): Promise<Category | Prompt | ContextMenu | PromptMemory | null> {
  switch (type) {
    case "category":
      return (await db.categories.get(id)) || null;
    case "prompt":
      return (await db.prompts.get(id)) || null;
    case "menu":
      return (await db.contextMenus.get(id)) || null;
    case "memory":
      return (await db.promptMemory.get(id)) || null;
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
  const remote = await fetchRemoteSummaries(session.user.id);
  const pendingUpdates: AssetUpdate[] = [];

  const pullItems = async <T extends NumericRemoteEntity>(
    remoteItems: Array<RemoteCategorySummary | RemotePromptSummary | RemoteMenuSummary>,
    localTable: Table<T, number>,
    type: "category" | "prompt" | "menu",
  ) => {
    if (remoteItems.length === 0) return;

    const remoteIdsToCheck = remoteItems.map((r) => r.id);
    const matchingLocalItems = await localTable.where('remoteId').anyOf(remoteIdsToCheck).toArray();
    const localByRemoteId = new Map(
      matchingLocalItems
        .filter((item) => item.remoteId != null)
        .map((item) => [item.remoteId!, item]),
    );

    for (const remote of remoteItems) {
      const local = localByRemoteId.get(remote.id);
      const remoteTimestamp = new Date((remote.updated_at || remote.created_at) as string);

      if (!local) {
        pendingUpdates.push({
          type,
          id: 0,
          remoteId: remote.id,
          action: "created",
          timestamp: remoteTimestamp,
        });
        continue;
      }

      if (local.syncStatus === "synced" && remoteTimestamp > getLocalUpdatedAt(local)) {
        pendingUpdates.push({
          type,
          id: local.id!,
          remoteId: remote.id,
          action: remote.is_deleted ? "deleted" : "updated",
          timestamp: remoteTimestamp,
        });
      }
    }
  };

  await pullItems(remote.categories, db.categories as Table<NumericRemoteEntity, number>, "category");
  await pullItems(remote.prompts, db.prompts as Table<NumericRemoteEntity, number>, "prompt");
  await pullItems(remote.menus, db.contextMenus as Table<NumericRemoteEntity, number>, "menu");

  const remoteMemory = remote.memory;
  if (remoteMemory.length > 0) {
    const remoteKeys = remoteMemory.map((memory) => [memory.template_id, memory.key] as [string, string]);
    const matchingLocalMemory = await db.promptMemory
      .where('[templateId+key]')
      .anyOf(remoteKeys)
      .toArray();
    const localMemoryMap = new Map(
      matchingLocalMemory.map((memory) => [`${memory.templateId}|${memory.key}`, memory]),
    );

    for (const remote of remoteMemory) {
      const local = localMemoryMap.get(`${remote.template_id}|${remote.key}`);
      const remoteTimestamp = new Date(remote.updated_at || remote.created_at || new Date().toISOString());

      if (!local && !remote.is_deleted) {
        pendingUpdates.push({
          type: "memory",
          id: 0,
          remoteId: remote.id,
          action: "created",
          timestamp: remoteTimestamp,
        });
        continue;
      }

      if (local && local.syncStatus === "synced" && remoteTimestamp > getLocalUpdatedAt(local)) {
        pendingUpdates.push({
          type: "memory",
          id: local.id!,
          remoteId: remote.id,
          action: remote.is_deleted ? "deleted" : "updated",
          timestamp: remoteTimestamp,
        });
      }
    }
  }

  const hydratedUpdates = await hydrateAssetUpdates(session.user.id, pendingUpdates);
  for (const update of hydratedUpdates) {
    if (!update.data && update.action !== "deleted") {
      continue;
    }

    await applyRemoteChanges(update);
    pulledCount++;
  }

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

  const findPending = async <T extends SyncableEntity>(
    table: Table<T, number>,
    type: AssetUpdate["type"],
  ) => {
    const pending = await table.where("syncStatus").equals("pending")
      .toArray();
    for (const item of pending) {
      await pushLocalChanges({
        type,
        id: item.id!,
        action: item.remoteId ? "updated" : "created",
        timestamp: new Date(),
        data: item as unknown as Record<string, unknown>,
      });
      pushedCount++;
    }
  };

  await findPending(db.categories as Table<SyncableEntity, number>, "category");
  await findPending(db.prompts as Table<SyncableEntity, number>, "prompt");
  await findPending(db.contextMenus as Table<SyncableEntity, number>, "menu");
  await findPending(db.promptMemory as Table<SyncableEntity, number>, "memory");

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
