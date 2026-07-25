import { supabase } from "@/lib/supabase";
import { db } from "@/db/database";
import { ContextMenu, RemoteContextMenu } from "@/models/types";
import { withRetry, fetchAllPages } from "./utils";
import { normalizeContextMenuOptions } from "@/utils/contextMenuOptions";

/**
 * Sincroniza os menus locais com a nuvem (Upload).
 * Realiza soft-deletes e upserts em lote.
 */
export const syncMenus = async (userId: string, contextMenus: ContextMenu[]) => {
  // 1. Propagar soft-deletes pendentes em lote
  const menusToDeleteRemotely = contextMenus.filter(
    (menu) => menu.isDeleted === true && menu.remoteId && menu.syncStatus !== "synced"
  );

  if (menusToDeleteRemotely.length > 0) {
    const remoteIdsToDelete = menusToDeleteRemotely.map(m => m.remoteId!);
    try {
      await withRetry(() =>
        supabase
          .from("context_menus")
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in("id", remoteIdsToDelete)
          .eq("user_id", userId)
      );
      console.log(`✅ ${menusToDeleteRemotely.length} menus soft-delete sincronizados.`);
    } catch (error) {
      console.error("Falha ao sincronizar soft-deletes de menus:", error);
      for (const menu of menusToDeleteRemotely) {
        if (menu.id) await db.contextMenus.update(menu.id, { syncStatus: "error" });
      }
    }
  }

  // 2. Remove em lote localmente (após confirmar sync ou se nunca subiu)
  const menuLocalIdsToDelete = [
    ...menusToDeleteRemotely.filter((m) => m.syncStatus !== "error"),
    ...contextMenus.filter((m) => m.isDeleted === true && !m.remoteId),
  ]
    .map((m) => m.id)
    .filter((id): id is number => id !== undefined);

  if (menuLocalIdsToDelete.length > 0) {
    await db.contextMenus.bulkDelete(menuLocalIdsToDelete);
  }

  // 3. Sincronizar menus ativos (novos ou modificados)
  const menusToSync = contextMenus.filter(
    (m) => m.syncStatus !== "synced" && m.isDeleted !== true
  );

  if (menusToSync.length > 0) {
    type MenuInsert = import('@/lib/supabase.types').Database['public']['Tables']['context_menus']['Insert'];
    const payloads: MenuInsert[] = menusToSync.map(menu => ({
      user_id: userId,
      menu_id: menu.menuId,
      menu_name: menu.menuName,
      description: menu.description,
      selection_mode: menu.selectionMode || "single",
      options: normalizeContextMenuOptions(menu.options) as unknown as import('@/lib/supabase.types').Json,
      is_deleted: false,
      updated_at: new Date().toISOString(),
    }));

    try {
      // Usar upsert com conflito em (user_id, menu_id) para garantir unicidade
      const { data: results, error } = await withRetry(() =>
        supabase
          .from("context_menus")
          .upsert(payloads, { onConflict: 'user_id,menu_id' })
          .select("id, menu_id")
      );

      if (error) throw error;

      if (results) {
        for (const menu of menusToSync) {
          const remoteRecord = results.find((r: { menu_id: string; id: number }) => r.menu_id === menu.menuId);
          if (remoteRecord && menu.id) {
            await db.contextMenus.update(menu.id, { 
              remoteId: remoteRecord.id, 
              syncStatus: "synced" 
            });
          }
        }
      }
    } catch (error) {
      console.error("❌ Erro no bulk upsert de menus:", error);
      for (const menu of menusToSync) {
        if (menu.id) await db.contextMenus.update(menu.id, { syncStatus: "error" });
      }
    }
  }
};

/**
 * Baixa os menus da nuvem e os sincroniza com o banco local (Dexie).
 * @returns Um mapa de remoteId para localId para uso por outros handlers de sync.
 */
export const downloadMenus = async (): Promise<Map<number, number>> => {
  const remoteToLocalMap = new Map<number, number>();
  
  try {
    const menuData = await fetchAllPages<RemoteContextMenu>((r) =>
      supabase.from("context_menus").select("*").eq("is_deleted", false).range(r[0], r[1])
    );

    if (menuData.length === 0) return remoteToLocalMap;

    // 1. Mapear menus existentes no Dexie
    const remoteIds = menuData.map(m => m.id);
    const existingLocal = await db.contextMenus.where('remoteId').anyOf(remoteIds).toArray();
    const localByRemoteId = new Map(existingLocal.map(m => [m.remoteId, m]));

    const menusToPut: ContextMenu[] = [];
    const remoteIdsForMap: number[] = [];

    for (const m of menuData) {
      const existing = localByRemoteId.get(m.id);
      
      // Se local está marcado como excluído mas ainda não subiu pro cloud, pula o download
      if (existing?.isDeleted === true && existing.syncStatus !== "synced") {
        continue;
      }

      const menuPayload: ContextMenu = {
        id: existing?.id,
        remoteId: m.id,
        menuId: m.menu_id,
        menuName: m.menu_name,
        description: m.description ?? '',
        selectionMode: (m.selection_mode as import('@/models/promptSchema').MenuSelectionMode) || 'single',
        options: (m.options as import('@/models/types').ContextMenuOption[]) || [],
        createdAt: m.created_at ? new Date(m.created_at) : new Date(),
        updatedAt: m.updated_at ? new Date(m.updated_at) : new Date(),
        syncStatus: "synced",
      };

      menusToPut.push(menuPayload);
      remoteIdsForMap.push(m.id);
    }

    if (menusToPut.length > 0) {
      const ids = await db.contextMenus.bulkPut(menusToPut, { allKeys: true });
      ids.forEach((id, index) => {
        const remoteId = remoteIdsForMap[index];
        if (remoteId !== undefined && typeof id === "number") {
          remoteToLocalMap.set(remoteId, id);
        }
      });
    }
  } catch (error) {
    console.error("Erro ao baixar menus da nuvem:", error);
  }

  return remoteToLocalMap;
};

