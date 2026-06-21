/* ======================================================
   Serviço de Realtime do Supabase
   ====================================================== */

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { db } from "@/db/database";
import type {
  Category,
  ContextMenu,
  Prompt,
  FewShotExample,
  PromptMemory,
} from "@/models/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { saveLocalBackup } from "@/utils/backupManager";
import { normalizeContextMenuOptions } from "@/utils/contextMenuOptions";
import {
  compilePromptPayload,
  parsePromptPayload,
  parseUserSelection,
} from "@/models/promptSchema";
import type { LegacyContextMenuSelection } from "@/models/promptSchema";

type RealtimeChannelName = "categories" | "prompts" | "menus" | "memory";
type RealtimeChannelState = "subscribed" | "error" | "timed_out" | "closed" | "skipped";

export interface RealtimeSetupResult {
  success: boolean;
  channels: Record<RealtimeChannelName, RealtimeChannelState>;
  errors: string[];
}

const REALTIME_SUBSCRIBE_TIMEOUT_MS = 5000;

const createEmptySetupResult = (state: RealtimeChannelState = "skipped"): RealtimeSetupResult => ({
  success: false,
  channels: {
    categories: state,
    prompts: state,
    menus: state,
    memory: state,
  },
  errors: [],
});

// Canais de realtime para cada tabela
let categoriesChannel: RealtimeChannel | null = null;
let promptsChannel: RealtimeChannel | null = null;
let menusChannel: RealtimeChannel | null = null;
let memoryChannel: RealtimeChannel | null = null;

let _backupTimeout: ReturnType<typeof setTimeout> | null = null;
const debouncedSaveLocalBackup = () => {
    if (_backupTimeout) clearTimeout(_backupTimeout);
    _backupTimeout = setTimeout(async () => {
        try {
            await saveLocalBackup();
        } catch (e) {
            console.error('Erro ao salvar backup em background', e);
        }
    }, 5000); // 5 seconds debounce
};

/**
 * Inicializa os listeners de realtime do Supabase
 */
export async function setupRealtimeListeners(): Promise<RealtimeSetupResult> {
  // Evita canais duplicados em cenários de re-init (mount + auth change + reconnect)
  cleanupRealtimeListeners();

  if (!isSupabaseConfigured) {
    const result = createEmptySetupResult();
    result.errors.push("Supabase is not configured");
    return result;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const result = createEmptySetupResult();
    result.errors.push("No active Supabase session");
    return result;
  }

  const result = createEmptySetupResult("closed");

  // Canal para Categorias
  categoriesChannel = supabase
    .channel("categories_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "categories",
      },
      async (payload) => {
        await handleCategoryChange(payload);
        debouncedSaveLocalBackup();
      },
    );

  // Canal para Prompts
  promptsChannel = supabase
    .channel("prompts_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "prompts",
      },
      async (payload) => {
        await handlePromptChange(payload);
        debouncedSaveLocalBackup();
      },
    );

  // Canal para Menus de Contexto
  menusChannel = supabase
    .channel("context_menus_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "context_menus",
      },
      async (payload) => {
        await handleMenuChange(payload);
        debouncedSaveLocalBackup();
      },
    );

  // Canal para Memória Fixa por template
  memoryChannel = supabase
    .channel("prompt_memory_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "prompt_memory_context",
      },
      async (payload) => {
        await handleMemoryChange(payload);
        debouncedSaveLocalBackup();
      },
    );

  await Promise.all([
    subscribeWithStatus("categories", categoriesChannel, result),
    subscribeWithStatus("prompts", promptsChannel, result),
    subscribeWithStatus("menus", menusChannel, result),
    subscribeWithStatus("memory", memoryChannel, result),
  ]);

  result.success = Object.values(result.channels).every((state) => state === "subscribed");
  return result;
}

function subscribeWithStatus(
  name: RealtimeChannelName,
  channel: RealtimeChannel,
  result: RealtimeSetupResult,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (state: RealtimeChannelState, error?: Error | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      result.channels[name] = state;
      if (error) {
        result.errors.push(`${name}: ${error.message}`);
      }
      if (state === "subscribed") {
        console.log(`✅ Realtime channel subscribed: ${name}`);
      } else {
        console.warn(`⚠️ Realtime channel ${name} status: ${state}`);
      }
      resolve();
    };

    const timeout = setTimeout(() => {
      settle("timed_out", new Error("Realtime subscription timed out"));
    }, REALTIME_SUBSCRIBE_TIMEOUT_MS);

    channel.subscribe((status, error) => {
      if (status === "SUBSCRIBED") {
        settle("subscribed");
        return;
      }

      if (status === "CHANNEL_ERROR") {
        settle("error", error || new Error("Realtime channel error"));
        return;
      }

      if (status === "TIMED_OUT") {
        settle("timed_out", error || new Error("Realtime channel timed out"));
        return;
      }

      if (status === "CLOSED") {
        settle("closed", error || null);
      }
    });
  });
}

interface RealtimeCategoryPayload {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

/**
 * Trata mudanças em categorias vindas do realtime
 */
async function handleCategoryChange(payload: {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
}) {
  const remoteData = payload.new || payload.old;
  const eventType = payload.eventType;

  if (!remoteData) return;

  const rd = remoteData as unknown as RealtimeCategoryPayload;

  try {
    switch (eventType) {
      case "INSERT":
      case "UPDATE": {
        if (rd.is_deleted) {
          const deletedLocal = await db.categories
            .where("remoteId")
            .equals(rd.id)
            .first();

          if (deletedLocal) {
            await db.categories.delete(deletedLocal.id!);
            console.log(`🧹 Categoria removida localmente (soft delete): ${deletedLocal.name}`);
          }
          break;
        }

        // Verificar se já existe localmente
        const existingLocal = await db.categories
          .where("remoteId")
          .equals(rd.id)
          .first();

        if (existingLocal?.isDeleted === true && existingLocal.syncStatus !== "synced") {
          console.log(`⏸️ Ignorando update remoto para categoria pendente de exclusão: ${existingLocal.name}`);
          break;
        }

        const categoryData: Partial<Category> = {
          remoteId: rd.id,
          name: rd.name,
          icon: rd.icon,
          color: rd.color,
          createdAt: new Date(rd.created_at),
          updatedAt: rd.updated_at ? new Date(rd.updated_at) : undefined,
          syncStatus: "synced",
        };

        if (existingLocal) {
          // Atualizar existente
          await db.categories.update(existingLocal.id!, categoryData);
        } else {
          // Criar novo
          await db.categories.add(categoryData as Category);
        }
        break;
      }

      case "DELETE": {
        const toDelete = await db.categories
          .where("remoteId")
          .equals(rd.id)
          .first();

        if (toDelete) {
          await db.categories.delete(toDelete.id!);
        }
        break;
      }
    }
  } catch (error) {
    console.error("❌ Erro ao processar mudança de categoria:", error);
  }
}

interface RealtimePromptPayload {
  id: number;
  category_id: number;
  title: string;
  prompt_payload_jsonb: unknown;
  system_role?: string;
  task?: string;
  context?: string;
  context_menus?: Record<string, LegacyContextMenuSelection>;
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
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

/**
 * Trata mudanças em prompts vindas do realtime
 */
async function handlePromptChange(payload: {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
}) {
  const remoteData = payload.new || payload.old;
  const eventType = payload.eventType;

  if (!remoteData) return;

  const rd = remoteData as unknown as RealtimePromptPayload;

  try {
    switch (eventType) {
      case "INSERT":
      case "UPDATE": {
        if (rd.is_deleted) {
          const deletedLocal = await db.prompts
            .where("remoteId")
            .equals(rd.id)
            .first();

          if (deletedLocal) {
            await db.prompts.delete(deletedLocal.id!);
            console.log(`🧹 Prompt removido localmente (soft delete): ${deletedLocal.title}`);
          }
          break;
        }

        const existingLocal = await db.prompts
          .where("remoteId")
          .equals(rd.id)
          .first();

        if (existingLocal?.isDeleted === true && existingLocal.syncStatus !== "synced") {
          console.log(`⏸️ Ignorando update remoto para prompt pendente de exclusão: ${existingLocal.title}`);
          break;
        }

        // Resolver ID local da categoria a partir do remoteId do Supabase
        let localCategoryId = 0;
        if (rd.category_id) {
          const cat = await db.categories.where("remoteId").equals(
            rd.category_id,
          ).first();
          if (cat) {
            localCategoryId = cat.id!;
          } else {
            localCategoryId = 0;
          }
        }

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

        const promptData: Partial<Prompt> = {
          remoteId: rd.id,
          categoryId: localCategoryId,
          title: rd.title,
          promptPayload,
          selectionPayload: parseUserSelection(
            rd.selection_payload_jsonb as Record<string, unknown>,
            promptPayload.meta.template_id,
            {
              title: rd.title,
              schemaVersion: rd.schema_version,
              language: rd.language,
              contextMenus: rd.context_menus,
              enabledMenuIds: rd.enabled_menu_ids,
            },
          ),
          compiledPayload: (rd.compiled_payload_jsonb as unknown as Prompt["compiledPayload"]) || undefined,
          schemaVersion: rd.schema_version || "1.0.0",
          language: rd.language || "pt-BR",
          outputFormat: rd.output_format || "markdown",
          fewShotExamples: (rd.few_shot_examples as unknown as FewShotExample[]) || [],
          createdAt: new Date(rd.created_at),
          updatedAt: new Date(rd.updated_at),
          syncStatus: "synced",
        };

        if (existingLocal) {
          if (
            !promptData.compiledPayload && promptData.selectionPayload &&
            promptData.promptPayload
          ) {
            promptData.compiledPayload = compilePromptPayload(
              promptData.promptPayload,
              promptData.selectionPayload,
            );
          }
          await db.prompts.update(existingLocal.id!, promptData);
        } else {
          if (
            !promptData.compiledPayload && promptData.selectionPayload &&
            promptData.promptPayload
          ) {
            promptData.compiledPayload = compilePromptPayload(
              promptData.promptPayload,
              promptData.selectionPayload,
            );
          }
          await db.prompts.add(promptData as Prompt);
        }
        break;
      }

      case "DELETE": {
        const toDelete = await db.prompts
          .where("remoteId")
          .equals(rd.id)
          .first();

        if (toDelete) {
          await db.prompts.delete(toDelete.id!);
        }
        break;
      }
    }
  } catch (error) {
    console.error("❌ Erro ao processar mudança de prompt:", error);
  }
}

interface RealtimeMenuPayload {
  id: number;
  menu_id: string;
  menu_name: string;
  description?: string;
  selection_mode?: "single" | "multiple";
  options?: unknown;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

/**
 * Trata mudanças em menus vindas do realtime
 */
async function handleMenuChange(payload: {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
}) {
  const remoteData = payload.new || payload.old;
  const eventType = payload.eventType;

  if (!remoteData) return;

  const rd = remoteData as unknown as RealtimeMenuPayload;

  try {
    switch (eventType) {
      case "INSERT":
      case "UPDATE": {
        if (rd.is_deleted) {
          const deletedLocal = await db.contextMenus
            .where("remoteId")
            .equals(rd.id)
            .first();

          if (deletedLocal) {
            await db.contextMenus.delete(deletedLocal.id!);
            console.log(`🧹 Menu removido localmente (soft delete): ${deletedLocal.menuName}`);
          }
          break;
        }

        const existingLocal = await db.contextMenus
          .where("remoteId")
          .equals(rd.id)
          .first();

        if (existingLocal?.isDeleted === true && existingLocal.syncStatus !== "synced") {
          console.log(`⏸️ Ignorando update remoto para menu pendente de exclusão: ${existingLocal.menuName}`);
          break;
        }

        const menuData: Partial<ContextMenu> = {
          remoteId: rd.id,
          menuId: rd.menu_id,
          menuName: rd.menu_name,
          description: rd.description || "",
          selectionMode: (rd.selection_mode as "single" | "multiple") || "single",
          options: normalizeContextMenuOptions(rd.options as Record<string, unknown>),
          createdAt: new Date(rd.created_at),
          updatedAt: new Date(rd.updated_at),
          syncStatus: "synced",
        };

        if (existingLocal) {
          await db.contextMenus.update(existingLocal.id!, menuData);
        } else {
          await db.contextMenus.add(menuData as ContextMenu);
        }
        break;
      }

      case "DELETE": {
        const toDelete = await db.contextMenus
          .where("remoteId")
          .equals(rd.id)
          .first();

        if (toDelete) {
          await db.contextMenus.delete(toDelete.id!);
        }
        break;
      }
    }
  } catch (error) {
    console.error("❌ Erro ao processar mudança de menu:", error);
  }
}

interface RealtimeMemoryPayload {
  id?: string;
  key: string;
  value: string;
  template_id: string;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
}

async function handleMemoryChange(payload: {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
}) {
  const remoteData = payload.new || payload.old;
  const eventType = payload.eventType;

  if (!remoteData) return;

  const rd = remoteData as unknown as RealtimeMemoryPayload;
  const remoteUpdatedAt = new Date(rd.updated_at).getTime();

  try {
    const existing = await db.promptMemory
      .where("[templateId+key]")
      .equals([rd.template_id, rd.key])
      .first();

    if (eventType === "DELETE" || rd.is_deleted) {
      if (existing?.id) {
        await db.promptMemory.delete(existing.id);
      }
      return;
    }

    if (existing?.isDeleted === true && existing.syncStatus !== "synced") {
      return;
    }

    if (existing?.updatedAt && remoteUpdatedAt <= existing.updatedAt.getTime()) {
      return;
    }

    const memoryData: Omit<PromptMemory, "id"> = {
      remoteId: rd.id,
      key: rd.key,
      value: rd.value || "",
      templateId: rd.template_id,
      isDeleted: false,
      syncStatus: "synced",
      createdAt: new Date(rd.created_at),
      updatedAt: new Date(rd.updated_at),
    };

    if (existing?.id) {
      await db.promptMemory.update(existing.id, memoryData);
    } else {
      await db.promptMemory.add(memoryData);
    }
  } catch (error) {
    console.error("❌ Erro ao processar mudança de memória fixa:", error);
  }
}

/**
 * Remove todos os listeners de realtime
 */
export function cleanupRealtimeListeners() {
  if (categoriesChannel) {
    categoriesChannel.unsubscribe();
    void supabase.removeChannel(categoriesChannel).catch((error) => {
      console.warn("⚠️ Failed to remove categories realtime channel:", error);
    });
    categoriesChannel = null;
  }

  if (promptsChannel) {
    promptsChannel.unsubscribe();
    void supabase.removeChannel(promptsChannel).catch((error) => {
      console.warn("⚠️ Failed to remove prompts realtime channel:", error);
    });
    promptsChannel = null;
  }

  if (menusChannel) {
    menusChannel.unsubscribe();
    void supabase.removeChannel(menusChannel).catch((error) => {
      console.warn("⚠️ Failed to remove menus realtime channel:", error);
    });
    menusChannel = null;
  }

  if (memoryChannel) {
    memoryChannel.unsubscribe();
    void supabase.removeChannel(memoryChannel).catch((error) => {
      console.warn("⚠️ Failed to remove memory realtime channel:", error);
    });
    memoryChannel = null;
  }

}

/**
 * Reativa os listeners após reconexão
 */
export async function reconnectRealtime() {
  cleanupRealtimeListeners();
  return setupRealtimeListeners();
}
