import { supabase } from "@/lib/supabase";
import { db } from "@/db/database";
import { Prompt, RemotePrompt, FewShotExample } from "@/models/types";
import { withRetry, fetchAllPages } from "./utils";
import { 
  getPromptSummaryFields, 
  getLegacyPromptColumns, 
  type PromptOutputFormat
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
      remoteData?.forEach((r: { id: number; updated_at: string | null }) => {
        if (r.updated_at) {
          remoteTimestampMap.set(r.id, Math.floor(new Date(r.updated_at).getTime() / 1000));
        }
      });
    }

    const promptsWithRemoteId = promptsToSync.filter((prompt) => !!prompt.remoteId);
    const promptsWithoutRemoteId = promptsToSync.filter((prompt) => !prompt.remoteId);

    type PromptInsert = import('@/lib/supabase.types').Database['public']['Tables']['prompts']['Insert'];
    type Json = import('@/lib/supabase.types').Json;
    const payloads: PromptInsert[] = [];

    for (const prompt of promptsWithRemoteId) {
      const { id: _unusedId, remoteId, ...data } = prompt;
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
        prompt_payload_jsonb: data.promptPayload as unknown as Json,
        selected_menu_ids: (data.selectedMenuIds || []) as unknown as Json,
        schema_version: summary.schemaVersion,
        output_format: summary.outputFormat,
        language: summary.language,
        reference_url: null,
        few_shot_examples: (data.fewShotExamples || []) as unknown as Json,
        is_deleted: false,
        updated_at: new Date().toISOString(),
        ...(legacyColumns.selection_payload_jsonb ? { selection_payload_jsonb: legacyColumns.selection_payload_jsonb as unknown as Json } : {}),
        ...(legacyColumns.compiled_payload_jsonb ? { compiled_payload_jsonb: legacyColumns.compiled_payload_jsonb as unknown as Json } : {}),
      });
    }

    if (payloads.length > 0) {
      const result = await withRetry(() =>
        supabase.from("prompts").upsert(payloads).select("id")
      );

      if (result.error) {
        console.error("❌ Erro no bulk upsert de prompts:", result.error);
        for (const prompt of promptsWithRemoteId) {
          if (prompt.id) await db.prompts.update(prompt.id, { syncStatus: "error" });
        }
      } else if (result.data) {
        for (const prompt of promptsWithRemoteId) {
          if (prompt.id && prompt.remoteId) {
            await db.prompts.update(prompt.id, {
              remoteId: prompt.remoteId,
              syncStatus: "synced"
            });
          }
        }
      }
    }

    const newPayloads: PromptInsert[] = [];
    for (const prompt of promptsWithoutRemoteId) {
      const remoteCategoryId = localToRemoteCategoryMap.get(prompt.categoryId);
      const summary = getPromptSummaryFields(prompt.promptPayload);
      const legacyColumns = getLegacyPromptColumns(
        prompt.promptPayload,
        prompt.selectionPayload,
        prompt.compiledPayload,
      );

      newPayloads.push({
        user_id: userId,
        category_id: remoteCategoryId || null,
        title: summary.title,
        prompt_payload_jsonb: prompt.promptPayload as unknown as Json,
        selected_menu_ids: (prompt.selectedMenuIds || []) as unknown as Json,
        schema_version: summary.schemaVersion,
        output_format: summary.outputFormat,
        language: summary.language,
        reference_url: null,
        few_shot_examples: (prompt.fewShotExamples || []) as unknown as Json,
        is_deleted: false,
        updated_at: new Date().toISOString(),
        ...(legacyColumns.selection_payload_jsonb ? { selection_payload_jsonb: legacyColumns.selection_payload_jsonb as unknown as Json } : {}),
        ...(legacyColumns.compiled_payload_jsonb ? { compiled_payload_jsonb: legacyColumns.compiled_payload_jsonb as unknown as Json } : {}),
      });
    }

    if (newPayloads.length > 0) {
      try {
        const result = await withRetry(() =>
          supabase.from("prompts").insert(newPayloads).select("id")
        );

        if (result.error || !result.data) {
          throw result.error ?? new Error("Erro ao criar prompts em lote.");
        }


        const updatedPrompts = promptsWithoutRemoteId.map((prompt, i) => ({
          ...prompt,
          remoteId: result.data[i].id,
          syncStatus: "synced" as const,
        })).filter(p => p.id !== undefined);

        if (updatedPrompts.length > 0) {
          await db.prompts.bulkPut(updatedPrompts);
        }
      } catch (error) {
        console.error("❌ Erro ao inserir novos prompts em lote:", error);
        for (const prompt of promptsWithoutRemoteId) {
          if (prompt.id) await db.prompts.update(prompt.id, { syncStatus: "error" });
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
  const rawData = await fetchAllPages<unknown>((r) =>
    supabase.from("prompts").select("*").eq("is_deleted", false).range(r[0], r[1])
  );
  const promptData = rawData as RemotePrompt[];

  if (promptData.length === 0) return;

  // 1. Mapear prompts existentes no Dexie
  const remoteIds = promptData.map(p => p.id);
  const existingLocal = await db.prompts.where('remoteId').anyOf(remoteIds).toArray();
  const localByRemoteId = new Map(existingLocal.map(p => [p.remoteId, p]));

  const promptsToPut: Prompt[] = [];

  for (const p of promptData) {
    const existing = localByRemoteId.get(p.id);
    
    // Se local tem alterações não sincronizadas (incluindo exclusão), pula o overwrite pelo cloud
    if (existing && existing.syncStatus !== "synced") {
      continue;
    }

    const localCategoryId = p.category_id ? remoteToLocalCatMap.get(p.category_id) : undefined;
    
    // Traduzir selected_menu_ids de IDs remotos para IDs locais
    const localMenuIds = (((p.selected_menu_ids as number[]) || []))
      .map((rid: number) => remoteToLocalMenuMap.get(rid))
      .filter((id: number | undefined): id is number => id !== undefined);

    const promptPayload: Prompt = {
      id: existing?.id,
      remoteId: p.id,
      categoryId: localCategoryId || 0,
      title: p.title,
      promptPayload: p.prompt_payload_jsonb as any,
      selectedMenuIds: localMenuIds,
      selectionPayload: p.selection_payload_jsonb as any,
      compiledPayload: p.compiled_payload_jsonb as any,
      schemaVersion: p.schema_version,
      language: p.language,
      outputFormat: p.output_format as PromptOutputFormat,
      fewShotExamples: (p.few_shot_examples as FewShotExample[]) || [],
      createdAt: p.created_at ? new Date(p.created_at) : new Date(),
      updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
      syncStatus: "synced",
    };

    promptsToPut.push(promptPayload);
  }

  if (promptsToPut.length > 0) {
    await db.prompts.bulkPut(promptsToPut);
  }
};
