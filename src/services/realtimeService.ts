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

// Canais de realtime para cada tabela
let categoriesChannel: RealtimeChannel | null = null;
let promptsChannel: RealtimeChannel | null = null;
let menusChannel: RealtimeChannel | null = null;

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
export async function setupRealtimeListeners() {
  // Evita canais duplicados em cenários de re-init (mount + auth change + reconnect)
  cleanupRealtimeListeners();

  if (!isSupabaseConfigured) {
    console.log("⏭️ Supabase não configurado - realtime desativado");
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log("⏭️ Usuário não autenticado - realtime desativado");
    return;
  }

  const userId = session.user.id;

  console.log("📡 Iniciando listeners de realtime...");

  // Canal para Categorias
  categoriesChannel = supabase
    .channel("categories_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "categories",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log("📡 Categoria alterada:", payload);
        await handleCategoryChange(payload);
        debouncedSaveLocalBackup();
      },
    )
    .subscribe();

  // Canal para Prompts
  promptsChannel = supabase
    .channel("prompts_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "prompts",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log("📡 Prompt alterado:", payload);
        await handlePromptChange(payload);
        debouncedSaveLocalBackup();
      },
    )
    .subscribe();

  // Canal para Menus de Contexto
  menusChannel = supabase
    .channel("context_menus_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "context_menus",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log("📡 Menu alterado:", payload);
        await handleMenuChange(payload);
        debouncedSaveLocalBackup();
      },
    )
    .subscribe();

  console.log("✅ Listeners de realtime ativados");
}

interface RealtimeCategoryPayload {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  created_at: string;
  /** Soft-delete flag — migration 20260327000001 */
  is_deleted?: boolean;
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
        // Soft-delete: o registro foi marcado como excluído via UPDATE.
        // Remover do state local em vez de atualizar.
        if (rd.is_deleted) {
          const toSoftDelete = await db.categories
            .where("remoteId")
            .equals(rd.id)
            .first();
          if (toSoftDelete) {
            await db.categories.delete(toSoftDelete.id!);
            console.log(`🗑️ Categoria soft-deleted localmente: ${toSoftDelete.name}`);
          }
          break;
        }

        // Verificar se já existe localmente
        const existingLocal = await db.categories
          .where("remoteId")
          .equals(rd.id)
          .first();

        const categoryData: Partial<Category> = {
          remoteId: rd.id,
          name: rd.name,
          icon: rd.icon,
          color: rd.color,
          createdAt: new Date(rd.created_at),
          syncStatus: "synced",
        };

        if (existingLocal) {
          // Atualizar existente
          await db.categories.update(existingLocal.id!, categoryData);
          console.log(`🔄 Categoria atualizada localmente: ${rd.name}`);
        } else {
          // Criar novo
          await db.categories.add(categoryData as Category);
          console.log(`➕ Categoria adicionada localmente: ${rd.name}`);
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
          console.log(`🗑️ Categoria removida localmente: ${toDelete.name}`);
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
  /** Soft-delete flag — migration 20260327000001 */
  is_deleted?: boolean;
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
        // Soft-delete: o registro foi marcado como excluído via UPDATE.
        // Remover do state local em vez de atualizar.
        if (rd.is_deleted) {
          const toSoftDelete = await db.prompts
            .where("remoteId")
            .equals(rd.id)
            .first();
          if (toSoftDelete) {
            await db.prompts.delete(toSoftDelete.id!);
            console.log(`🗑️ Prompt soft-deleted localmente: ${toSoftDelete.title}`);
          }
          break;
        }

        const existingLocal = await db.prompts
          .where("remoteId")
          .equals(rd.id)
          .first();

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
          referenceUrl: rd.reference_url || undefined,
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
          console.log(`🔄 Prompt atualizado localmente: ${rd.title}`);
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
          console.log(`➕ Prompt adicionado localmente: ${rd.title}`);
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
          console.log(`🗑️ Prompt removido localmente: ${toDelete.title}`);
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
  /** Soft-delete flag — migration 20260327000001 */
  is_deleted?: boolean;
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
        // Soft-delete: o registro foi marcado como excluído via UPDATE.
        // Remover do state local em vez de atualizar.
        if (rd.is_deleted) {
          const toSoftDelete = await db.contextMenus
            .where("remoteId")
            .equals(rd.id)
            .first();
          if (toSoftDelete) {
            await db.contextMenus.delete(toSoftDelete.id!);
            console.log(`🗑️ Menu soft-deleted localmente: ${toSoftDelete.menuName}`);
          }
          break;
        }

        const existingLocal = await db.contextMenus
          .where("remoteId")
          .equals(rd.id)
          .first();

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
          console.log(`🔄 Menu atualizado localmente: ${rd.menu_name}`);
        } else {
          await db.contextMenus.add(menuData as ContextMenu);
          console.log(`➕ Menu adicionado localmente: ${rd.menu_name}`);
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
          console.log(`🗑️ Menu removido localmente: ${toDelete.menuName}`);
        }
        break;
      }
    }
  } catch (error) {
    console.error("❌ Erro ao processar mudança de menu:", error);
  }
}

/**
 * Remove todos os listeners de realtime
 */
export function cleanupRealtimeListeners() {
  if (categoriesChannel) {
    categoriesChannel.unsubscribe();
    categoriesChannel = null;
  }

  if (promptsChannel) {
    promptsChannel.unsubscribe();
    promptsChannel = null;
  }

  if (menusChannel) {
    menusChannel.unsubscribe();
    menusChannel = null;
  }

  console.log("🧹 Listeners de realtime removidos");
}

/**
 * Reativa os listeners após reconexão
 */
export async function reconnectRealtime() {
  cleanupRealtimeListeners();
  await setupRealtimeListeners();
  console.log("🔄 Realtime reconectado");
}
