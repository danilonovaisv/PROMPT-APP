/* ======================================================
   Gerenciador de Assets e Atualizações
   ====================================================== */

import { db } from '@/db/database';
import { supabase } from '@/lib/supabase';
import { saveLocalBackup } from '@/utils/backupManager';
// Tipos utilizados para tipagem

export interface AssetUpdate {
  type: 'category' | 'prompt' | 'menu';
  id: number;
  remoteId?: number;
  action: 'created' | 'updated' | 'deleted';
  timestamp: Date;
  data?: any;
}

export interface ConflictResolution {
  strategy: 'localWins' | 'remoteWins' | 'merge' | 'askUser';
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
      supabase.from('categories').select('*').eq('user_id', session.user.id),
      supabase.from('prompts').select('*').eq('user_id', session.user.id),
      // supabase.from('context_menus').select('*').eq('user_id', session.user.id),
    ]);

    // Verificar categorias
    const remoteCategories = catRes.data || [];
    const localCategories = await db.categories.toArray();
    
    for (const remote of remoteCategories) {
      const local = localCategories.find(c => c.remoteId === remote.id);
      if (local) {
        const remoteUpdated = new Date(remote.updated_at || remote.created_at);
        const localUpdated = new Date((local as any).updatedAt || local.createdAt);
        
        if (remoteUpdated > localUpdated) {
          conflicts.push({
            type: 'category',
            id: local.id!,
            remoteId: remote.id,
            action: 'updated',
            timestamp: remoteUpdated,
            data: remote
          });
        }
      }
    }

    // Verificar prompts (similar para menus)
    const remotePrompts = promptRes.data || [];
    const localPrompts = await db.prompts.toArray();
    
    for (const remote of remotePrompts) {
      const local = localPrompts.find(p => p.remoteId === remote.id);
      if (local) {
        const remoteUpdated = new Date(remote.updated_at || remote.created_at);
        const localUpdated = new Date((local as any).updatedAt || local.createdAt);
        
        if (remoteUpdated > localUpdated) {
          conflicts.push({
            type: 'prompt',
            id: local.id!,
            remoteId: remote.id,
            action: 'updated',
            timestamp: remoteUpdated,
            data: remote
          });
        }
      }
    }

    return conflicts;
  } catch (error) {
    console.error('❌ Erro ao detectar conflitos:', error);
    return [];
  }
}

/**
 * Resolve conflitos de acordo com a estratégia escolhida
 */
export async function resolveConflicts(
  conflicts: AssetUpdate[], 
  strategy: ConflictResolution['strategy'] = 'remoteWins'
): Promise<void> {
  console.log(`🔄 Resolvendo ${conflicts.length} conflitos usando estratégia: ${strategy}`);
  
  for (const conflict of conflicts) {
    try {
      switch (strategy) {
        case 'remoteWins':
          await applyRemoteChanges(conflict);
          break;
          
        case 'localWins':
          await pushLocalChanges(conflict);
          break;
          
        case 'merge':
          await mergeChanges(conflict);
          break;
          
        case 'askUser':
          // Implementar lógica para perguntar ao usuário
          console.log('❓ Conflito requer decisão do usuário:', conflict);
          break;
      }
    } catch (error) {
      console.error(`❌ Erro ao resolver conflito ${conflict.type} #${conflict.id}:`, error);
    }
  }
  
  await saveLocalBackup();
  console.log('✅ Resolução de conflitos concluída');
}

/**
 * Aplica mudanças remotas aos dados locais
 */
async function applyRemoteChanges(update: AssetUpdate): Promise<void> {
  const remoteData = update.data;
  
  switch (update.type) {
    case 'category':
      if (remoteData) {
        await db.categories.update(update.id, {
          name: remoteData.name,
          icon: remoteData.icon,
          color: remoteData.color,
          // updatedAt: new Date(remoteData.updated_at || remoteData.created_at)
        });
        console.log(`📥 Categoria #${update.id} atualizada com dados remotos`);
      }
      break;
      
    case 'prompt':
      if (remoteData) {
        await db.prompts.update(update.id, {
          categoryId: remoteData.category_id,
          title: remoteData.title,
          systemRole: remoteData.system_role,
          task: remoteData.task,
          context: remoteData.context,
          menus: remoteData.menus || {},
          contextMenus: remoteData.context_menus || {},
          enabledMenuIds: remoteData.enabled_menu_ids || [],
          constraints: remoteData.constraints || [],
          negativePrompt: remoteData.negative_prompt || [],
          outputSchema: remoteData.output_schema || { formato: 'texto', estrutura: '' },
          fewShotExamples: remoteData.few_shot_examples || [],
          updatedAt: new Date(remoteData.updated_at || remoteData.created_at)
        });
        console.log(`📥 Prompt #${update.id} atualizado com dados remotos`);
      }
      break;
      
    case 'menu':
      if (remoteData) {
        await db.contextMenus.update(update.id, {
          menuId: remoteData.menu_id,
          menuName: remoteData.menu_name,
          description: remoteData.description,
          options: remoteData.options || [],
          updatedAt: new Date(remoteData.updated_at || remoteData.created_at)
        });
        console.log(`📥 Menu #${update.id} atualizado com dados remotos`);
      }
      break;
  }
}

/**
 * Envia mudanças locais para o servidor
 */
async function pushLocalChanges(update: AssetUpdate): Promise<void> {
  // Implementar lógica para enviar dados locais atualizados
  console.log(`📤 Enviando mudanças locais para ${update.type} #${update.id}`);
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
async function getLocalItem(type: AssetUpdate['type'], id: number): Promise<any> {
  switch (type) {
    case 'category':
      return await db.categories.get(id);
    case 'prompt':
      return await db.prompts.get(id);
    case 'menu':
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
  conflicts: number 
}> {
  console.log('🧠 Iniciando sincronização inteligente...');
  
  const result = { pulled: 0, pushed: 0, conflicts: 0 };
  
  try {
    // 1. Detectar conflitos
    const conflicts = await detectConflicts();
    result.conflicts = conflicts.length;
    
    if (conflicts.length > 0) {
      console.log(`⚠️ ${conflicts.length} conflito(s) detectado(s)`);
      await resolveConflicts(conflicts, 'remoteWins');
    }
    
    // 2. Pull de dados remotos (dados mais recentes)
    const pullResult = await pullLatestChanges();
    result.pulled = pullResult.pulled;
    
    // 3. Push de dados locais pendentes
    const pushResult = await pushPendingChanges();
    result.pushed = pushResult.pushed;
    
    await saveLocalBackup();
    
    console.log(`✅ Sync inteligente concluído: ${result.pulled} recebidos, ${result.pushed} enviados, ${result.conflicts} conflitos`);
    
    return result;
  } catch (error) {
    console.error('❌ Erro na sincronização inteligente:', error);
    throw error;
  }
}

/**
 * Puxa as últimas mudanças do servidor
 */
async function pullLatestChanges(): Promise<{ pulled: number }> {
  // Esta função seria implementada para buscar apenas dados mais recentes
  // que não estão presentes localmente
  console.log('📥 Puxando últimas mudanças do servidor...');
  return { pulled: 0 };
}

/**
 * Envia mudanças locais pendentes
 */
async function pushPendingChanges(): Promise<{ pushed: number }> {
  // Esta função seria implementada para enviar apenas dados locais
  // que foram modificados desde a última sincronização
  console.log('📤 Enviando mudanças locais pendentes...');
  return { pushed: 0 };
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
  
  console.log('👀 Monitoramento de assets ativado');
}