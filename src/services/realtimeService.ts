/* ======================================================
   Serviço de Realtime do Supabase
   ====================================================== */

import { supabase } from '@/lib/supabase';
import { db } from '@/db/database';
import type { Category, Prompt, ContextMenu } from '@/models/types';
import { saveLocalBackup } from '@/utils/backupManager';
import { parsePromptPayload } from '@/models/promptSchema';

// Canais de realtime para cada tabela
let categoriesChannel: any = null;
let promptsChannel: any = null;
let menusChannel: any = null;

/**
 * Inicializa os listeners de realtime do Supabase
 */
export async function setupRealtimeListeners() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('⏭️ Usuário não autenticado - realtime desativado');
    return;
  }

  const userId = session.user.id;

  console.log('📡 Iniciando listeners de realtime...');

  // Canal para Categorias
  categoriesChannel = supabase
    .channel('categories_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'categories',
        filter: `user_id=eq.${userId}`
      },
      async (payload) => {
        console.log('📡 Categoria alterada:', payload);
        await handleCategoryChange(payload);
        await saveLocalBackup();
      }
    )
    .subscribe();

  // Canal para Prompts
  promptsChannel = supabase
    .channel('prompts_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'prompts',
        filter: `user_id=eq.${userId}`
      },
      async (payload) => {
        console.log('📡 Prompt alterado:', payload);
        await handlePromptChange(payload);
        await saveLocalBackup();
      }
    )
    .subscribe();

  // Canal para Menus de Contexto
  menusChannel = supabase
    .channel('context_menus_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'context_menus',
        filter: `user_id=eq.${userId}`
      },
      async (payload) => {
        console.log('📡 Menu alterado:', payload);
        await handleMenuChange(payload);
        await saveLocalBackup();
      }
    )
    .subscribe();

  console.log('✅ Listeners de realtime ativados');
}

/**
 * Trata mudanças em categorias vindas do realtime
 */
async function handleCategoryChange(payload: any) {
  const remoteData = payload.new || payload.old;
  const eventType = payload.eventType;

  try {
    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        // Verificar se já existe localmente
        const existingLocal = await db.categories
          .where('remoteId')
          .equals(remoteData.id)
          .first();

        const categoryData: Partial<Category> = {
          remoteId: remoteData.id,
          name: remoteData.name,
          icon: remoteData.icon,
          color: remoteData.color,
          createdAt: new Date(remoteData.created_at),
          syncStatus: 'synced',
        };

        if (existingLocal) {
          // Atualizar existente
          await db.categories.update(existingLocal.id!, categoryData);
          console.log(`🔄 Categoria atualizada localmente: ${remoteData.name}`);
        } else {
          // Criar novo
          await db.categories.add(categoryData as Category);
          console.log(`➕ Categoria adicionada localmente: ${remoteData.name}`);
        }
        break;

      case 'DELETE':
        const toDelete = await db.categories
          .where('remoteId')
          .equals(remoteData.id)
          .first();

        if (toDelete) {
          await db.categories.delete(toDelete.id!);
          console.log(`🗑️ Categoria removida localmente: ${toDelete.name}`);
        }
        break;
    }
  } catch (error) {
    console.error('❌ Erro ao processar mudança de categoria:', error);
  }
}

/**
 * Trata mudanças em prompts vindas do realtime
 */
async function handlePromptChange(payload: any) {
  const remoteData = payload.new || payload.old;
  const eventType = payload.eventType;

  try {
    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        const existingLocal = await db.prompts
          .where('remoteId')
          .equals(remoteData.id)
          .first();

        // Resolver ID local da categoria a partir do remoteId do Supabase
        let localCategoryId = 0;
        if (remoteData.category_id) {
          const cat = await db.categories.where('remoteId').equals(remoteData.category_id).first();
          if (cat) {
            localCategoryId = cat.id!;
          } else {
            // Se não achamos a categoria local, talvez ela ainda não tenha sido sincronizada
            // ou foi deletada. Mantemos o remoteId como fallback se o schema permitir, 
            // mas o ideal é 0 ou null se não achou local.
            localCategoryId = 0;
          }
        }

        const promptPayload = parsePromptPayload(remoteData.prompt_payload_jsonb, {
          title: remoteData.title,
          systemRole: remoteData.system_role,
          task: remoteData.task,
          context: remoteData.context,
          contextMenus: remoteData.context_menus,
          enabledMenuIds: remoteData.enabled_menu_ids,
          constraints: remoteData.constraints,
          negativePrompt: remoteData.negative_prompt,
          outputSchema: remoteData.output_schema,
          referenceUrl: remoteData.reference_url,
          language: remoteData.language,
          schemaVersion: remoteData.schema_version,
        });

        // Converter dados do Supabase para formato local
        const promptData: Partial<Prompt> = {
          remoteId: remoteData.id,
          categoryId: localCategoryId,
          title: remoteData.title,
          promptPayload,
          schemaVersion: remoteData.schema_version || '1.0.0',
          language: remoteData.language || 'pt-BR',
          outputFormat: remoteData.output_format || 'markdown',
          referenceUrl: remoteData.reference_url || undefined,
          fewShotExamples: remoteData.few_shot_examples || [],
          createdAt: new Date(remoteData.created_at),
          updatedAt: new Date(remoteData.updated_at),
          syncStatus: 'synced',
        };

        if (existingLocal) {
          await db.prompts.update(existingLocal.id!, promptData);
          console.log(`🔄 Prompt atualizado localmente: ${remoteData.title}`);
        } else {
          await db.prompts.add(promptData as Prompt);
          console.log(`➕ Prompt adicionado localmente: ${remoteData.title}`);
        }
        break;

      case 'DELETE':
        const toDelete = await db.prompts
          .where('remoteId')
          .equals(remoteData.id)
          .first();

        if (toDelete) {
          await db.prompts.delete(toDelete.id!);
          console.log(`🗑️ Prompt removido localmente: ${toDelete.title}`);
        }
        break;
    }
  } catch (error) {
    console.error('❌ Erro ao processar mudança de prompt:', error);
  }
}

/**
 * Trata mudanças em menus vindas do realtime
 */
async function handleMenuChange(payload: any) {
  const remoteData = payload.new || payload.old;
  const eventType = payload.eventType;

  try {
    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        const existingLocal = await db.contextMenus
          .where('remoteId')
          .equals(remoteData.id)
          .first();

        const menuData: Partial<ContextMenu> = {
          remoteId: remoteData.id,
          menuId: remoteData.menu_id,
          menuName: remoteData.menu_name,
          description: remoteData.description,
          selectionMode: remoteData.selection_mode || 'single',
          options: remoteData.options || [],
          createdAt: new Date(remoteData.created_at),
          updatedAt: new Date(remoteData.updated_at),
          syncStatus: 'synced',
        };

        if (existingLocal) {
          await db.contextMenus.update(existingLocal.id!, menuData);
          console.log(`🔄 Menu atualizado localmente: ${remoteData.menu_name}`);
        } else {
          await db.contextMenus.add(menuData as ContextMenu);
          console.log(`➕ Menu adicionado localmente: ${remoteData.menu_name}`);
        }
        break;

      case 'DELETE':
        const toDelete = await db.contextMenus
          .where('remoteId')
          .equals(remoteData.id)
          .first();

        if (toDelete) {
          await db.contextMenus.delete(toDelete.id!);
          console.log(`🗑️ Menu removido localmente: ${toDelete.menuName}`);
        }
        break;
    }
  } catch (error) {
    console.error('❌ Erro ao processar mudança de menu:', error);
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

  console.log('🧹 Listeners de realtime removidos');
}

/**
 * Reativa os listeners após reconexão
 */
export async function reconnectRealtime() {
  cleanupRealtimeListeners();
  await setupRealtimeListeners();
  console.log('🔄 Realtime reconectado');
}
