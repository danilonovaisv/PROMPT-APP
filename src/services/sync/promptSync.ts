import { supabase } from "@/lib/supabase";
import { db } from "@/db/database";
import { Prompt } from "@/models/types";
import { withRetry, fetchAllPages } from "./utils";
import { 
  getPromptSummaryFields, 
  getLegacyPromptColumns, 
  getPrimaryReferenceUrl 
} from "@/models/promptSchema";

export const syncPrompts = async (
  userId: string, 
  prompts: Prompt[], 
  localToRemoteCategoryMap: Map<number, number>
) => {
  // 1. Propagar soft-deletes pendentes em lote
  const promptsToDeleteRemotely = prompts.filter(
    (prompt) => prompt.isDeleted === true && prompt.remoteId && prompt.syncStatus !== "synced"
  );

  if (promptsToDeleteRemotely.length > 0) {
    const remoteIdsToDelete = promptsToDeleteRemotely.map(p => p.remoteId!);
    try {
      await withRetry(() =>
        supabase
          .from("prompts")
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in("id", remoteIdsToDelete)
          .eq("user_id", userId)
      );
      console.log(`✅ ${promptsToDeleteRemotely.length} prompts soft-delete sincronizados.`);
    } catch (error) {
      console.error("Falha ao sincronizar soft-deletes de prompts:", error);
      for (const prompt of promptsToDeleteRemotely) {
        if (prompt.id) await db.prompts.update(prompt.id, { syncStatus: "error" });
      }
    }
  }

  // 2. Remove em lote localmente
  const promptLocalIdsToDelete = [
    ...promptsToDeleteRemotely.filter((p) => p.syncStatus !== "error"),
    ...prompts.filter((p) => p.isDeleted === true && !p.remoteId),
  ]
    .map((p) => p.id)
    .filter((id): id is number => id !== undefined);

  if (promptLocalIdsToDelete.length > 0) {
    await db.prompts.bulkDelete(promptLocalIdsToDelete);
  }

  // 3. Sincronizar prompts ativos
  const promptsToSync = prompts.filter(
    (p) => p.syncStatus !== "synced" && p.isDeleted !== true
  );

  if (promptsToSync.length > 0) {
    // 3.1 Pre-fetch remote timestamps para evitar sobrescrever dados mais novos na nuvem
    const remoteIdsToCheck = promptsToSync
      .map(p => p.remoteId)
      .filter((id): id is number => id !== undefined);

    const remoteTimestampMap = new Map<number, number>();
    if (remoteIdsToCheck.length > 0) {
      const { data: remoteData } = await withRetry(() =>
        supabase
          .from("prompts")
          .select("id, updated_at")
          .in("id", remoteIdsToCheck)
      );
      remoteData?.forEach((r: any) => {
        remoteTimestampMap.set(r.id, Math.floor(new Date(r.updated_at).getTime() / 1000));
      });
    }

    const payloads: any[] = [];
    const promptsForBulk: Prompt[] = [];

    for (const prompt of promptsToSync) {
      const { id, remoteId, ...data } = prompt;
      const remoteCategoryId = localToRemoteCategoryMap.get(data.categoryId);

      // Verificar timestamp se já existe remotamente
      if (remoteId) {
        const remoteTs = remoteTimestampMap.get(remoteId) || 0;
        const localTs = Math.floor(prompt.updatedAt?.getTime() || 0) / 1000;

        if (remoteTs > localTs) {
          console.log(`⏳ Pulando sync (nuvem é mais recente) para: ${data.title}`);
          continue;
        }
      }

      const summary = getPromptSummaryFields(data.promptPayload);
      const legacyColumns = getLegacyPromptColumns(
        data.promptPayload,
        data.selectionPayload,
        data.compiledPayload,
      );

      payloads.push({
        ...(remoteId ? { id: remoteId } : {}),
        user_id: userId,
        category_id: remoteCategoryId || null,
        title: summary.title,
        prompt_payload_jsonb: data.promptPayload,
        selected_menu_ids: data.selectedMenuIds || [],
        schema_version: summary.schemaVersion,
        output_format: summary.outputFormat,
        language: summary.language,
        reference_url: getPrimaryReferenceUrl(data.promptPayload),
        few_shot_examples: data.fewShotExamples || [],
        is_deleted: false,
        updated_at: new Date().toISOString(),
        ...legacyColumns,
      });
      promptsForBulk.push(prompt);
    }

    if (payloads.length > 0) {
      const result = await withRetry(() =>
        supabase.from("prompts").upsert(payloads).select("id, title")
      );

      if (result.error) {
        console.error("❌ Erro no bulk upsert de prompts:", result.error);
        for (const prompt of promptsForBulk) {
          if (prompt.id) await db.prompts.update(prompt.id, { syncStatus: "error" });
        }
      } else if (result.data) {
        // Mapear resultados de volta para o ID local e atualizar status
        for (const prompt of promptsForBulk) {
          // Usamos o título como chave secundária para mapeamento em caso de novos registros
          const remoteRecord = result.data.find((r: any) => r.title === prompt.title);
          if (remoteRecord && prompt.id) {
            await db.prompts.update(prompt.id, { 
              remoteId: remoteRecord.id, 
              syncStatus: "synced" 
            });
          }
        }
      }
    }
  }
};

/**
 * Baixa os prompts da nuvem e os sincroniza com o banco local (Dexie).
 * @param remoteToLocalCatMap Mapa de remoteId -> localId de categorias.
 * @param remoteToLocalMenuMap Mapa de remoteId -> localId de menus.
 */
export const downloadPrompts = async (
  remoteToLocalCatMap: Map<number, number>,
  remoteToLocalMenuMap: Map<number, number>
): Promise<void> => {
  const promptData = await fetchAllPages<any>((r) =>
    supabase.from("prompts").select("*").eq("is_deleted", false).range(r[0], r[1])
  );

  if (promptData.length === 0) return;

  // 1. Mapear prompts existentes no Dexie
  const remoteIds = promptData.map(p => p.id);
  const existingLocal = await db.prompts.where('remoteId').anyOf(remoteIds).toArray();
  const localByRemoteId = new Map(existingLocal.map(p => [p.remoteId, p]));

  const promptsToPut: Prompt[] = [];

  for (const p of promptData) {
    const existing = localByRemoteId.get(p.id);
    
    // Se local está marcado como excluído mas ainda não subiu pro cloud, pula o download
    if (existing?.isDeleted === true && existing.syncStatus !== "synced") {
      continue;
    }

    const localCategoryId = p.category_id ? remoteToLocalCatMap.get(p.category_id) : undefined;
    
    // Traduzir selected_menu_ids de IDs remotos para IDs locais
    const localMenuIds = (p.selected_menu_ids || [])
      .map((rid: number) => remoteToLocalMenuMap.get(rid))
      .filter((id: number | undefined): id is number => id !== undefined);

    const promptPayload: Prompt = {
      id: existing?.id,
      remoteId: p.id,
      categoryId: localCategoryId || 0,
      title: p.title,
      promptPayload: p.prompt_payload_jsonb,
      selectedMenuIds: localMenuIds,
      selectionPayload: p.selection_payload_jsonb,
      compiledPayload: p.compiled_payload_jsonb,
      schemaVersion: p.schema_version,
      language: p.language,
      outputFormat: p.output_format as any,
      referenceUrl: p.reference_url || undefined,
      fewShotExamples: p.few_shot_examples,
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at),
      syncStatus: "synced",
    };

    promptsToPut.push(promptPayload);
  }

  if (promptsToPut.length > 0) {
    await db.prompts.bulkPut(promptsToPut);
  }
};
