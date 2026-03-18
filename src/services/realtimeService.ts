/* ======================================================
   Serviço de Realtime do Supabase
   ====================================================== */

import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { db } from "@/db/database";
import type {
  Category,
  ContextMenu,
  Prompt,
} from "@/models/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { saveLocalBackup } from "@/utils/backupManager";
import { normalizeContextMenuOptions } from "@/utils/contextMenuOptions";
import {
  compilePromptPayload,
  parsePromptPayload,
  parseUserSelection,
} from "@/models/promptSchema";

// Canais de realtime para cada tabela
let categoriesChannel: RealtimeChannel | null = null;
let promptsChannel: RealtimeChannel | null = null;
let menusChannel: RealtimeChannel | null = null;

/**
 * Inicializa os listeners de realtime do Supabase
 */
export async function setupRealtimeListeners() {
  assertSupabaseConfigured();

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
        await saveLocalBackup();
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
        await saveLocalBackup();
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
        await saveLocalBackup();
      },
    )
    .subscribe();

  console.log("✅ Listeners de realtime ativados");
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

  const rd = remoteData as Record<string, any>;

  try {
    switch (eventType) {
      case "INSERT":
      case "UPDATE":
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

      case "DELETE":
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
  } catch (error) {
    console.error("❌ Erro ao processar mudança de categoria:", error);
  }
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

  // Type assertions for Supabase realtime data
  const rd = remoteData as Record<string, any>;

  try {
    switch (eventType) {
      case "INSERT":
      case "UPDATE":
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

        // Converter dados do Supabase para formato local
        const promptData: Partial<Prompt> = {
          remoteId: rd.id,
          categoryId: localCategoryId,
          title: rd.title,
          promptPayload,
          selectionPayload: parseUserSelection(
            rd.selection_payload_jsonb,
            promptPayload.meta.template_id,
            {
              title: rd.title,
              schemaVersion: rd.schema_version,
              language: rd.language,
              contextMenus: rd.context_menus,
              enabledMenuIds: rd.enabled_menu_ids,
            },
          ),
          compiledPayload: rd.compiled_payload_jsonb || undefined,
          schemaVersion: rd.schema_version || "1.0.0",
          language: rd.language || "pt-BR",
          outputFormat: rd.output_format || "markdown",
          referenceUrl: rd.reference_url || undefined,
          fewShotExamples: rd.few_shot_examples || [],
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

      case "DELETE":
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
  } catch (error) {
    console.error("❌ Erro ao processar mudança de prompt:", error);
  }
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

  try {
    switch (eventType) {
      case "INSERT":
      case "UPDATE":
        const existingLocal = await db.contextMenus
          .where("remoteId")
          .equals(remoteData.id as number)
          .first();

        const menuData: Partial<ContextMenu> = {
          remoteId: remoteData.id as number,
          menuId: remoteData.menu_id as string,
          menuName: remoteData.menu_name as string,
          description: remoteData.description as string,
          selectionMode: (remoteData.selection_mode as "single" | "multiple") ||
            "single",
          options: normalizeContextMenuOptions(remoteData.options),
          createdAt: new Date(remoteData.created_at as string),
          updatedAt: new Date(remoteData.updated_at as string),
          syncStatus: "synced",
        };

        if (existingLocal) {
          await db.contextMenus.update(existingLocal.id!, menuData);
          console.log(
            `🔄 Menu atualizado localmente: ${remoteData.menu_name as string}`,
          );
        } else {
          await db.contextMenus.add(menuData as ContextMenu);
          console.log(
            `➕ Menu adicionado localmente: ${remoteData.menu_name as string}`,
          );
        }
        break;

      case "DELETE":
        const toDelete = await db.contextMenus
          .where("remoteId")
          .equals(remoteData.id as number)
          .first();

        if (toDelete) {
          await db.contextMenus.delete(toDelete.id!);
          console.log(`🗑️ Menu removido localmente: ${toDelete.menuName}`);
        }
        break;
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
