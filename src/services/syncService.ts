import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { db } from "@/db/database";
import { createSnapshot } from "@/utils/backupManager";
import { Category, ContextMenu, Prompt } from "@/models/types";

/** Shape returned by Supabase when selecting only the timestamp column. */
interface SupabaseTimestamp {
  updated_at: string;
}

/** Minimal shape of a Supabase operation result used for category/prompt writes. */
interface SupabaseResult<T> {
  data: T | null;
  error: { message: string } | null;
}
import {
  type ContextMenuCloudPayload,
  type ContextMenuSyncRepository,
  persistContextMenuRecord,
} from "@/services/contextMenuSync";
import {
  compilePromptPayload,
  createEmptyUserSelection,
  getLegacyPromptColumns,
  getPrimaryReferenceUrl,
  getPromptSummaryFields,
  parsePromptPayload,
  parseUserSelection,
} from "@/models/promptSchema";
import { normalizeContextMenuOptions } from "@/utils/contextMenuOptions";

async function withRetry<T>(
  fn: () => Promise<T> | PromiseLike<T>,
  retries = 3,
  backoff = 1000,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((res) => setTimeout(res, backoff));
    return withRetry(fn, retries - 1, backoff * 2);
  }
}

const contextMenuRepository: ContextMenuSyncRepository = {
  async findRemoteIdByUserAndMenuId(userId, menuId) {
    const { data, error } = await supabase
      .from("context_menus")
      .select("id")
      .eq("user_id", userId)
      .eq("menu_id", menuId)
      .eq("is_deleted", false)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.id ?? null;
  },
  async insert(payload) {
    const { data, error } = await supabase
      .from("context_menus")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  },
  async updateById(id, payload) {
    const { data, error } = await supabase
      .from("context_menus")
      .upsert({ id, ...payload }, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  },
};

export const syncToCloud = async () => {
  assertSupabaseConfigured();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Usuário não autenticado");
  }

  const snapshot = await createSnapshot();
  const userId = session.user.id;
  const localToRemoteCategoryMap = new Map<number, number>();

  // 1. Sincronizar Categorias
  console.log("☁️ Sincronizando Categorias...");
  const allCategories = snapshot.data.categories;
  for (const cat of allCategories) {
    if (cat.id && cat.remoteId) {
      localToRemoteCategoryMap.set(cat.id, cat.remoteId);
    }
  }

  // Propagar soft-deletes pendentes ANTES de sincronizar categorias ativas.
  const categoriesToDeleteRemotely = allCategories.filter(
    (c) => c.isDeleted === true && c.remoteId && c.syncStatus !== "synced"
  );
  for (const cat of categoriesToDeleteRemotely) {
    try {
      await withRetry(() =>
        supabase
          .from("categories")
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq("id", cat.remoteId!)
          .eq("user_id", userId)
      );
      if (cat.id) await db.categories.delete(cat.id);
      console.log(`✅ Categoria soft-delete sincronizada e removida: ${cat.name}`);
    } catch (e) {
      console.error("Falha ao sincronizar delete de categoria:", cat.name, e);
      if (cat.id) await db.categories.update(cat.id, { syncStatus: "error" });
    }
  }

  const categoriesToPurgeLocally = allCategories.filter(
    (c) => c.isDeleted === true && !c.remoteId
  );
  for (const cat of categoriesToPurgeLocally) {
    if (cat.id) {
      await db.categories.delete(cat.id);
    }
  }

  // Sincronizar categorias ativas não sincronizadas
  const categoriesToSync = allCategories.filter(
    (c) => !c.isDeleted && c.syncStatus !== "synced"
  );
  for (const cat of categoriesToSync) {
    const { id, remoteId, ...data } = cat as Category;

    const payload = {
      user_id: userId,
      name: data.name,
      icon: data.icon,
      color: data.color,
      is_deleted: false,
      deleted_at: null,
    };

    let result;
    if (remoteId) {
      const { data: remoteData } = await withRetry(() =>
        supabase
          .from("categories")
          .select("updated_at")
          .eq("id", remoteId)
          .eq("is_deleted", false)
          .maybeSingle()
      );
      const remoteTs = remoteData?.updated_at
        ? Math.floor(new Date(remoteData.updated_at).getTime() / 1000)
        : 0;
      const localTs = Math.floor(cat.updatedAt?.getTime() || 0) / 1000;
      if (remoteTs > localTs) {
        console.log(`⏳ Pulando sync (nuvem é mais recente) para: ${data.name}`);
        continue;
      }

      result = await withRetry(() =>
        supabase.from("categories").upsert({ id: remoteId, ...payload }).select().single()
      );
    } else {
      result = await withRetry(() =>
        supabase.from("categories").insert(payload).select().single()
      );
    }

    if (result.error) {
      console.error(`❌ Erro ao sincronizar categoria "${data.name}":`, result.error);
      if (id) {
        await db.categories.update(id, { syncStatus: "error" });
      }
    } else if (result.data) {
      if (id && result.data.id !== remoteId) {
        await db.categories.update(id, { remoteId: result.data.id, syncStatus: "synced" });
      }
      if (id && result.data.id === remoteId) {
        await db.categories.update(id, { syncStatus: "synced" });
      }
      if (id) localToRemoteCategoryMap.set(id, result.data.id);
    }
  }

  // 2. Sincronizar Menus de Contexto
  console.log("☁️ Sincronizando Menus...");
  const menusToDeleteRemotely = snapshot.data.contextMenus.filter(
    (menu) => menu.isDeleted === true && menu.remoteId && menu.syncStatus !== "synced"
  );
  for (const menu of menusToDeleteRemotely) {
    try {
      await withRetry(() =>
        supabase
          .from("context_menus")
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", menu.remoteId!)
          .eq("user_id", userId)
      );
      if (menu.id) await db.contextMenus.delete(menu.id);
      console.log(`✅ Menu soft-delete sincronizado e removido: ${menu.menuName}`);
    } catch (error) {
      console.error("Falha ao sincronizar delete de menu:", menu.menuName, error);
      if (menu.id) {
        await db.contextMenus.update(menu.id, { syncStatus: "error" });
      }
    }
  }

  const menusToPurgeLocally = snapshot.data.contextMenus.filter(
    (menu) => menu.isDeleted === true && !menu.remoteId
  );
  for (const menu of menusToPurgeLocally) {
    if (menu.id) {
      await db.contextMenus.delete(menu.id);
    }
  }

  const menusToSync = snapshot.data.contextMenus.filter(
    (m) => m.syncStatus !== "synced" && m.isDeleted !== true
  );
  for (const menu of menusToSync) {
    const { id, remoteId, ...data } = menu as ContextMenu;

    const payload: ContextMenuCloudPayload = {
      user_id: userId,
      menu_id: data.menuId,
      menu_name: data.menuName,
      description: data.description,
      selection_mode: data.selectionMode || "single",
      options: normalizeContextMenuOptions(data.options),
      is_deleted: false,
    };

    try {
      const result = await persistContextMenuRecord(
        contextMenuRepository,
        payload,
        remoteId,
      );

      if (id && result.id !== remoteId) {
        await db.contextMenus.update(id, { remoteId: result.id, syncStatus: "synced" });
      }
      if (id && result.id === remoteId) {
        await db.contextMenus.update(id, { syncStatus: "synced" });
      }
    } catch (error) {
      console.error(`❌ Erro ao sincronizar menu "${data.menuName}":`, error);
      if (id) {
        await db.contextMenus.update(id, { syncStatus: "error" });
      }
    }
  }

  // 3. Sincronizar Prompts
  console.log("☁️ Sincronizando Prompts...");
  const promptsToDeleteRemotely = snapshot.data.prompts.filter(
    (prompt) => prompt.isDeleted === true && prompt.remoteId && prompt.syncStatus !== "synced"
  );
  for (const prompt of promptsToDeleteRemotely) {
    try {
      await withRetry(() =>
        supabase
          .from("prompts")
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", prompt.remoteId!)
          .eq("user_id", userId)
      );
      if (prompt.id) await db.prompts.delete(prompt.id);
      console.log(`✅ Prompt soft-delete sincronizado e removido: ${prompt.title}`);
    } catch (error) {
      console.error("Falha ao sincronizar delete de prompt:", prompt.title, error);
      if (prompt.id) {
        await db.prompts.update(prompt.id, { syncStatus: "error" });
      }
    }
  }

  const promptsToPurgeLocally = snapshot.data.prompts.filter(
    (prompt) => prompt.isDeleted === true && !prompt.remoteId
  );
  for (const prompt of promptsToPurgeLocally) {
    if (prompt.id) {
      await db.prompts.delete(prompt.id);
    }
  }

  const promptsToSync = snapshot.data.prompts.filter(
    (p) => p.syncStatus !== "synced" && p.isDeleted !== true
  );
  for (const prompt of promptsToSync) {
    const { id, remoteId, ...data } = prompt as Prompt;

    const remoteCategoryId = localToRemoteCategoryMap.get(data.categoryId);

    const summary = getPromptSummaryFields(data.promptPayload);
    const legacyColumns = getLegacyPromptColumns(
      data.promptPayload,
      data.selectionPayload,
      data.compiledPayload,
    );

    const payload = {
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
      ...legacyColumns,
    };

    let result: SupabaseResult<{ id: number }>;
    if (remoteId) {
      const { data: remoteData } = await withRetry<SupabaseResult<SupabaseTimestamp>>(() =>
        supabase.from("prompts").select("updated_at").eq("id", remoteId).single()
      );
      if (
        remoteData &&
        Math.floor(new Date(remoteData.updated_at).getTime() / 1000) >
          Math.floor(prompt.updatedAt?.getTime() || 0) / 1000
      ) {
        console.log(`⏳ Pulando sync (nuvem é mais recente) para: ${data.title}`);
        continue;
      }

      result = await withRetry(() =>
        supabase.from("prompts").upsert({ id: remoteId, ...payload }).select().single()
      );
    } else {
      result = await withRetry(() =>
        supabase.from("prompts").insert(payload).select().single()
      );
    }

    if (result.error) {
      console.error(`❌ Erro ao sincronizar prompt "${data.title}":`, result.error);
      if (id) {
        await db.prompts.update(id, { syncStatus: "error" });
      }
    } else if (result.data) {
      if (id && result.data.id !== remoteId) {
        await db.prompts.update(id, { remoteId: result.data.id, syncStatus: "synced" });
      }
      if (id && result.data.id === remoteId) {
        await db.prompts.update(id, { syncStatus: "synced" });
      }
    }
  }

  console.log("✅ Sincronização concluída!");
  return true;
};

export const downloadFromCloud = async () => {
  assertSupabaseConfigured();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não autenticado");

  const [catRes, menuRes, promptRes] = await Promise.all([
    supabase.from("categories").select("*").eq("is_deleted", false),
    supabase.from("context_menus").select("*").eq("is_deleted", false),
    supabase.from("prompts").select("*").eq("is_deleted", false),
  ]);

  if (catRes.error || menuRes.error || promptRes.error) {
    console.error("Erro no download:", catRes.error, menuRes.error, promptRes.error);
    throw new Error("Falha ao baixar dados da nuvem");
  }

  console.log("☁️ Iniciando Smart Merge (Nuvem -> Local)...");

  await db.transaction("rw", [db.categories, db.prompts, db.contextMenus], async () => {
    // ⚡ Bolt Optimization: Avoid fetching entire tables into memory to eliminate N+1 memory bottlenecks.
    // Ensure that remoteId and menuId are valid IndexedDB indexes before using .where()
    const remoteCatIds = (catRes.data || []).map((c: any) => c.id);
    const remoteMenuIds = (menuRes.data || []).map((m: any) => m.id);
    const remoteMenuSlugs = (menuRes.data || []).map((m: any) => m.menu_id);
    const remotePromptIds = (promptRes.data || []).map((p: any) => p.id);

    const [
      localCategoriesByRemoteId,
      localMenusByRemoteId,
      localMenusBySlug,
      localPromptsByRemoteId
    ] = await Promise.all([
      remoteCatIds.length > 0 ? db.categories.where('remoteId').anyOf(remoteCatIds).toArray() : Promise.resolve([]),
      remoteMenuIds.length > 0 ? db.contextMenus.where('remoteId').anyOf(remoteMenuIds).toArray() : Promise.resolve([]),
      remoteMenuSlugs.length > 0 ? db.contextMenus.where('menuId').anyOf(remoteMenuSlugs).toArray() : Promise.resolve([]),
      remotePromptIds.length > 0 ? db.prompts.where('remoteId').anyOf(remotePromptIds).toArray() : Promise.resolve([]),
    ]);

    const allRelevantLocalMenus = [...localMenusByRemoteId];
    const existingMenuIds = new Set(localMenusByRemoteId.map((m) => m.id));
    for (const menu of localMenusBySlug) {
      if (!existingMenuIds.has(menu.id)) {
        allRelevantLocalMenus.push(menu);
      }
    }

    const categoriesByRemoteId = new Map(
      localCategoriesByRemoteId.filter((c) => c.remoteId).map((c) => [c.remoteId, c])
    );
    const menusByRemoteId = new Map(
      allRelevantLocalMenus.filter((m) => m.remoteId).map((m) => [m.remoteId, m])
    );
    const menusByMenuId = new Map(allRelevantLocalMenus.map((m) => [m.menuId, m]));
    const promptsByRemoteId = new Map(
      localPromptsByRemoteId.filter((p) => p.remoteId).map((p) => [p.remoteId, p])
    );

    // --- A. Sincronizar Categorias ---
    const remoteToLocalCatMap = new Map<number, number>();

    if (catRes.data) {
      const categoriesToPut: Category[] = [];
      const remoteIdsForPut: number[] = [];

      for (const c of catRes.data) {
        if (c.is_deleted === true) continue;

        const existing = categoriesByRemoteId.get(c.id) as Category | undefined;
        if (existing?.isDeleted === true && existing.syncStatus !== "synced") {
          continue;
        }

        const catData: Category = {
          id: existing?.id,
          remoteId: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at),
          syncStatus: "synced",
        };

        categoriesToPut.push(catData);
        remoteIdsForPut.push(c.id);
      }

      if (categoriesToPut.length > 0) {
        const ids = await db.categories.bulkPut(categoriesToPut, { allKeys: true });
        ids.forEach((id, index) => {
          const remoteId = remoteIdsForPut[index];
          if (remoteId !== undefined && typeof id === "number") {
            remoteToLocalCatMap.set(remoteId, id);
          }
        });
      }
    }

    // --- B. Sincronizar Menus ---
    if (menuRes.data) {
      const menusToPut: ContextMenu[] = [];

      for (const m of menuRes.data) {
        if (m.is_deleted === true) {
          const existing = menusByRemoteId.get(m.id) as ContextMenu | undefined;
          const existingBySlug = (!existing
            ? menusByMenuId.get(m.menu_id)
            : null) as ContextMenu | undefined;
          const targetId = existing?.id || existingBySlug?.id;
          if (targetId) {
            await db.contextMenus.delete(targetId);
            console.log(`🗑️ Menu excluído localmente (is_deleted=true): ${m.menu_name}`);
          }
          continue;
        }

        const existing = menusByRemoteId.get(m.id) as ContextMenu | undefined;
        if (existing?.isDeleted === true && existing.syncStatus !== "synced") {
          continue;
        }
        const existingBySlug = (!existing
          ? menusByMenuId.get(m.menu_id)
          : null) as ContextMenu | undefined;

        if (existingBySlug?.isDeleted === true && existingBySlug.syncStatus !== "synced") {
          continue;
        }

        const targetId = existing?.id || existingBySlug?.id;

        const menuData: ContextMenu = {
          id: targetId,
          remoteId: m.id,
          menuId: m.menu_id,
          menuName: m.menu_name,
          description: m.description,
          selectionMode: m.selection_mode || "single",
          options: normalizeContextMenuOptions(m.options),
          createdAt: new Date(m.created_at),
          updatedAt: new Date(m.updated_at),
          syncStatus: "synced",
        };

        menusToPut.push(menuData);
      }

      if (menusToPut.length > 0) {
        await db.contextMenus.bulkPut(menusToPut);
      }
    }

    // --- C. Sincronizar Prompts ---
    if (promptRes.data) {
      const promptsToPut: Prompt[] = [];

      for (const p of promptRes.data) {
        if (p.is_deleted === true) {
          const existing = promptsByRemoteId.get(p.id) as Prompt | undefined;
          if (existing && existing.id) {
            await db.prompts.delete(existing.id);
            console.log(`🗑️ Prompt excluído localmente (is_deleted=true): ${p.title}`);
          }
          continue;
        }

        const existing = promptsByRemoteId.get(p.id) as Prompt | undefined;
        if (existing?.isDeleted === true && existing.syncStatus !== "synced") {
          continue;
        }

        if (
          existing?.id &&
          existing.updatedAt &&
          Math.floor(new Date(p.updated_at).getTime() / 1000) <
            Math.floor(existing.updatedAt.getTime() / 1000)
        ) {
          continue;
        }

        let localCategoryId = 0;
        if (p.category_id && remoteToLocalCatMap.has(p.category_id)) {
          localCategoryId = remoteToLocalCatMap.get(p.category_id)!;
        }

        const promptData: Prompt = {
          id: existing?.id,
          promptPayload: parsePromptPayload(p.prompt_payload_jsonb, {
            title: p.title,
            systemRole: p.system_role,
            task: p.task,
            context: p.context,
            contextMenus: p.context_menus,
            enabledMenuIds: p.enabled_menu_ids,
            constraints: p.constraints,
            negativePrompt: p.negative_prompt,
            outputSchema: p.output_schema,
            referenceUrl: p.reference_url,
            language: p.language,
            schemaVersion: p.schema_version,
          }),
          selectionPayload: undefined,
          compiledPayload: undefined,
          remoteId: p.id,
          categoryId: localCategoryId,
          title: p.title,
          selectedMenuIds: p.selected_menu_ids || [],
          schemaVersion: p.schema_version || "1.0.0",
          language: p.language || "pt-BR",
          outputFormat: p.output_format || "markdown",
          referenceUrl: p.reference_url || undefined,
          fewShotExamples: p.few_shot_examples || [],
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
          syncStatus: "synced",
        };

        promptData.selectionPayload = p.selection_payload_jsonb
          ? (p.selection_payload_jsonb as Prompt["selectionPayload"])
          : parseUserSelection(
              p.selection_payload_jsonb,
              promptData.promptPayload.meta.template_id,
              {
                title: p.title,
                schemaVersion: p.schema_version,
                language: p.language,
                contextMenus: p.context_menus,
                enabledMenuIds: p.enabled_menu_ids,
              },
            );

        promptData.compiledPayload = p.compiled_payload_jsonb
          ? (p.compiled_payload_jsonb as Prompt["compiledPayload"])
          : compilePromptPayload(
              promptData.promptPayload,
              promptData.selectionPayload ??
                createEmptyUserSelection(promptData.promptPayload.meta.template_id),
            );

        promptsToPut.push(promptData);
      }

      if (promptsToPut.length > 0) {
        await db.prompts.bulkPut(promptsToPut);
      }
    }
  });

  console.log("✅ Smart Merge concluído!");
  return true;
};
