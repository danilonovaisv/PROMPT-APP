import { supabase } from "@/lib/supabase";
import { db } from "@/db/database";
import { Category, RemoteCategory } from "@/models/types";
import { withRetry, fetchAllPages } from "./utils";

export const syncCategories = async (userId: string, categories: Category[]) => {
  const localToRemoteCategoryMap = new Map<number, number>();

  // 1. Propagar soft-deletes pendentes em lote
  const categoriesToDeleteRemotely = categories.filter(
    (c) => c.isDeleted === true && c.remoteId && c.syncStatus !== "synced"
  );
  
  if (categoriesToDeleteRemotely.length > 0) {
    const remoteIdsToDelete = categoriesToDeleteRemotely.map(c => c.remoteId!);
    try {
      await withRetry(() =>
        supabase
          .from("categories")
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .in("id", remoteIdsToDelete)
          .eq("user_id", userId)
      );
      console.log(`✅ ${categoriesToDeleteRemotely.length} categorias soft-delete sincronizadas.`);
    } catch (e) {
      console.error("Falha ao sincronizar soft-deletes de categorias:", e);
      for (const cat of categoriesToDeleteRemotely) {
        if (cat.id) await db.categories.update(cat.id, { syncStatus: "error" });
      }
    }
  }

  // 2. Remove em lote localmente
  const catLocalIdsToDelete = [
    ...categoriesToDeleteRemotely.filter((c) => c.syncStatus !== "error"),
    ...categories.filter((c) => c.isDeleted === true && !c.remoteId),
  ]
    .map((c) => c.id)
    .filter((id): id is number => id !== undefined);

  if (catLocalIdsToDelete.length > 0) {
    await db.categories.bulkDelete(catLocalIdsToDelete);
  }

  // 3. Sincronizar categorias ativas não sincronizadas
  const categoriesToSync = categories.filter(
    (c) => !c.isDeleted && c.syncStatus !== "synced"
  );

  if (categoriesToSync.length > 0) {
    // 3.1 Pre-fetch remote timestamps para evitar conflitos (somente para as que já possuem remoteId)
    const remoteIdsToCheck = categoriesToSync
      .map(c => c.remoteId)
      .filter((id): id is number => id !== undefined);
    
    const remoteTimestampMap = new Map<number, number>();
    if (remoteIdsToCheck.length > 0) {
      const { data: remoteData } = await withRetry(() =>
        supabase
          .from("categories")
          .select("id, updated_at")
          .in("id", remoteIdsToCheck)
          .eq("is_deleted", false)
      );
      
      remoteData?.forEach((r: { id: number; updated_at: string }) => {
        remoteTimestampMap.set(r.id, Math.floor(new Date(r.updated_at).getTime() / 1000));
      });
    }

    const payloads: Record<string, unknown>[] = [];
    const categoriesForBulk: Category[] = [];

    for (const cat of categoriesToSync) {
      const remoteTs = remoteTimestampMap.get(cat.remoteId!) || 0;
      const localTs = Math.floor(cat.updatedAt?.getTime() || 0) / 1000;

      if (cat.remoteId && remoteTs > localTs) {
        console.log(`⏳ Pulando sync (nuvem é mais recente) para: ${cat.name}`);
        localToRemoteCategoryMap.set(cat.id!, cat.remoteId);
        continue;
      }

      payloads.push({
        ...(cat.remoteId ? { id: cat.remoteId } : {}),
        user_id: userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        is_deleted: false,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      });
      categoriesForBulk.push(cat);
    }

    if (payloads.length > 0) {
      const result = await withRetry(() =>
        supabase.from("categories").upsert(payloads).select("id, name")
      );

      if (result.error) {
        console.error("❌ Erro no bulk upsert de categorias:", result.error);
        for (const cat of categoriesForBulk) {
          if (cat.id) await db.categories.update(cat.id, { syncStatus: "error" });
        }
      } else if (result.data) {
        // Mapear resultados de volta para o ID local
        for (const cat of categoriesForBulk) {
          const remoteRecord = result.data.find((r: { name: string; id: number }) => r.name === cat.name);
          if (remoteRecord && cat.id) {
            await db.categories.update(cat.id, { 
              remoteId: remoteRecord.id, 
              syncStatus: "synced" 
            });
            localToRemoteCategoryMap.set(cat.id, remoteRecord.id);
          }
        }
      }
    }
  }

  // Preencher o mapa para categorias já sincronizadas
  for (const cat of categories) {
    if (cat.id && cat.remoteId && !localToRemoteCategoryMap.has(cat.id)) {
      localToRemoteCategoryMap.set(cat.id, cat.remoteId);
    }
  }

  return localToRemoteCategoryMap;
};



/**
 * Baixa as categorias da nuvem e as sincroniza com o banco local (Dexie).
 * @returns Um mapa de remoteId para localId para uso por outros handlers.
 */
export const downloadCategories = async (): Promise<Map<number, number>> => {
  const remoteToLocalMap = new Map<number, number>();
  
  const catData = await fetchAllPages<RemoteCategory>((r) =>
    supabase.from("categories").select("*").eq("is_deleted", false).range(r[0], r[1])
  );

  if (catData.length === 0) return remoteToLocalMap;

  // 1. Mapear categorias existentes no Dexie
  const remoteIds = catData.map(c => c.id);
  const existingLocal = await db.categories.where('remoteId').anyOf(remoteIds).toArray();
  const localByRemoteId = new Map(existingLocal.map(c => [c.remoteId, c]));

  const categoriesToPut: Category[] = [];
  const remoteIdsForMap: number[] = [];

  for (const c of catData) {
    const existing = localByRemoteId.get(c.id);
    
    // Se local está marcado como excluído mas ainda não subiu pro cloud, pula o download
    if (existing?.isDeleted === true && existing.syncStatus !== "synced") {
      continue;
    }

    const catPayload: Category = {
      id: existing?.id,
      remoteId: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      createdAt: new Date(c.created_at),
      updatedAt: new Date(c.updated_at),
      syncStatus: "synced",
    };

    categoriesToPut.push(catPayload);
    remoteIdsForMap.push(c.id);
  }

  if (categoriesToPut.length > 0) {
    const ids = await db.categories.bulkPut(categoriesToPut, { allKeys: true });
    ids.forEach((id, index) => {
      const remoteId = remoteIdsForMap[index];
      if (remoteId !== undefined && typeof id === "number") {
        remoteToLocalMap.set(remoteId, id);
      }
    });
  }

  return remoteToLocalMap;
};
