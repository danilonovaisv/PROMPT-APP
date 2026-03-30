import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { db } from "@/db/database";
import { createSnapshot } from "@/utils/backupManager";
import { Category, ContextMenu, Prompt } from "@/models/types";
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
      // onConflict: 'id' garante que o upsert atualiza pelo PK
      // sem risco de violar a constraint UNIQUE (user_id, menu_id)
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
  const categoriesToSync = allCategories.filter((c) =>
    c.syncStatus !== "synced"
  );
  for (const cat of categoriesToSync) {
    const { id, remoteId, ...data } = cat as Category;

    const payload = {
      user_id: userId,
      name: data.name,
      icon: data.icon,
      color: data.color,
      is_deleted: false,
    };

    let result: any;
    if (remoteId) {
      // NOTA: categories.updated_at foi removida na migration 20260317213609_remote_schema.sql
      // O campo foi restaurado na migration 20260326000003.
      // Se a migration ainda não foi aplicada, remoteData.updated_at será undefined
      // e a comparação retorna NaN > NaN = false (sempre atualiza, sem loop)
      const { data: remoteData } = await withRetry<any>(() =>
        supabase
          .from("categories")
          .select("updated_at")
          .eq("id", remoteId)
          .single()
      );
      const remoteTs = remoteData?.updated_at
        ? Math.floor(new Date(remoteData.updated_at).getTime() / 1000)
        : 0;
      const localTs = Math.floor(cat.updatedAt?.getTime() || 0) / 1000;
      if (remoteTs > localTs) {
        console.log(
          `⏳ Pulando sync (nuvem é mais recente) para: ${data.name}`,
        );
        continue;
      }

      // Update existindo remoteId
      result = await withRetry(() =>
        supabase.from("categories")
          .upsert({ id: remoteId, ...payload })
          .select()
          .single()
      );
    } else {
      // Insert novo
      result = await withRetry(() =>
        supabase.from("categories")
          .insert(payload)
          .select()
          .single()
      );
    }

    if (result.error) {
      console.error(
        `❌ Erro ao sincronizar categoria "${data.name}":`,
        result.error,
      );
      if (id) {
        await db.categories.update(id, { syncStatus: "error" });
      }
      // Continua para tentar outras, mas loga erro
    } else if (result.data) {
      // Atualiza remoteId localmente
      if (id && result.data.id !== remoteId) {
        await db.categories.update(id, {
          remoteId: result.data.id,
          syncStatus: "synced",
        });
      }
      if (id && result.data.id === remoteId) {
        await db.categories.update(id, { syncStatus: "synced" });
      }
      if (id) localToRemoteCategoryMap.set(id, result.data.id);
    }
  }

  // 2. Sincronizar Menus de Contexto
  console.log("☁️ Sincronizando Menus...");
  const menusToSync = snapshot.data.contextMenus.filter((m) =>
    m.syncStatus !== "synced"
  );
  for (const menu of menusToSync) {
    const { id, remoteId, ...data } = menu as ContextMenu;

    const payload: ContextMenuCloudPayload & { is_deleted?: boolean } = {
      user_id: userId,
      menu_id: data.menuId, // map camelCase -> snake_case
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
        await db.contextMenus.update(id, {
          remoteId: result.id,
          syncStatus: "synced",
        });
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
  const promptsToSync = snapshot.data.prompts.filter((p) =>
    p.syncStatus !== "synced"
  );
  for (const prompt of promptsToSync) {
    const { id, remoteId, ...data } = prompt as Prompt;

    // Resolver categoryId
    const remoteCategoryId = localToRemoteCategoryMap.get(data.categoryId);

    // Se a categoria não foi sincronizada (falhou ou não existe), não podemos enviar o prompt
    // (A menos que category_id seja nullable, mas é bom manter integridade)
    // No schema: category_id bigint references categories...

    const summary = getPromptSummaryFields(data.promptPayload);
    const legacyColumns = getLegacyPromptColumns(
      data.promptPayload,
      data.selectionPayload,
      data.compiledPayload,
    );

    const payload = {
      user_id: userId,
      category_id: remoteCategoryId || null, // Se null, perde a categoria mas salva o prompt
      title: summary.title,
      prompt_payload_jsonb: data.promptPayload,
      selected_menu_ids: data.selectedMenuIds || [],
      schema_version: summary.schemaVersion,
      output_format: summary.outputFormat,
      language: summary.language,
      reference_url: getPrimaryReferenceUrl(data.promptPayload),
      // few_shot_examples: campo novo (migration 20260327000001)
      few_shot_examples: data.fewShotExamples || [],
      // Garantir que sync nunca recrie itens marcados como excluídos
      is_deleted: false,
      // legacyColumns já inclui selection_payload_jsonb e compiled_payload_jsonb
      ...legacyColumns,
    };

    let result: any;
    if (remoteId) {
      const { data: remoteData } = await withRetry<any>(() =>
        supabase.from("prompts").select("updated_at").eq("id", remoteId)
          .single()
      );
      if (
        remoteData &&
        Math.floor(new Date(remoteData.updated_at).getTime() / 1000) >
          Math.floor(prompt.updatedAt?.getTime() || 0) / 1000
      ) {
        console.log(
          `⏳ Pulando sync (nuvem é mais recente) para: ${data.title}`,
        );
        continue;
      }

      result = await withRetry(() =>
        supabase.from("prompts")
          .upsert({ id: remoteId, ...payload })
          .select()
          .single()
      );
    } else {
      result = await withRetry(() =>
        supabase.from("prompts")
          .insert(payload)
          .select()
          .single()
      );
    }

    if (result.error) {
      console.error(
        `❌ Erro ao sincronizar prompt "${data.title}":`,
        result.error,
      );
      if (id) {
        await db.prompts.update(id, { syncStatus: "error" });
      }
    } else if (result.data) {
      if (id && result.data.id !== remoteId) {
        await db.prompts.update(id, {
          remoteId: result.data.id,
          syncStatus: "synced",
        });
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

  // Filtrar is_deleted=false para garantir que itens excluídos (soft delete)
  // nunca retornem ao webapp via downloadFromCloud
  const [catRes, menuRes, promptRes] = await Promise.all([
    supabase.from("categories").select("*").eq("is_deleted", false),
    supabase.from("context_menus").select("*").eq("is_deleted", false),
    supabase.from("prompts").select("*").eq("is_deleted", false),
  ]);

  if (catRes.error || menuRes.error || promptRes.error) {
    console.error(
      "Erro no download:",
      catRes.error,
      menuRes.error,
      promptRes.error,
    );
    throw new Error("Falha ao baixar dados da nuvem");
  }

  // Sobrescrever local (mantendo lógica original de 'clear' por enquanto, ou melhor: merge?)
  // O pedido original era "diagnose and fix persistence". Sync é bidirecional idealmente.
  // Mas a função existente fazia clear(). Vou manter a lógica mas mapear os campos corretamente.

  // 4. Estratégia "Smart Merge": Atualizar Localmente sem destruir dados não sincronizados
  console.log("☁️ Iniciando Smart Merge (Nuvem -> Local)...");

  await db.transaction(
    "rw",
    [db.categories, db.prompts, db.contextMenus],
    async () => {
      // Pre-fetch all local data to avoid N+1 queries during merge
      const [allLocalCategories, allLocalMenus, allLocalPrompts] = await Promise
        .all([
          db.categories.toArray(),
          db.contextMenus.toArray(),
          db.prompts.toArray(),
        ]);

      const categoriesByRemoteId = new Map(
        allLocalCategories.filter((c: any) => c.remoteId).map(
          (c: any) => [c.remoteId, c]
        ),
      );
      const menusByRemoteId = new Map(
        allLocalMenus.filter((m: any) => m.remoteId).map((m: any) => [m.remoteId, m]),
      );
      const menusByMenuId = new Map(
        allLocalMenus.map((m: any) => [m.menuId, m]),
      );
      const promptsByRemoteId = new Map(
        allLocalPrompts.filter((p: any) => p.remoteId).map((p: any) => [p.remoteId, p]),
      );

      // --- A. Sincronizar Categorias ---
      const remoteToLocalCatMap = new Map<number, number>();

      if (catRes.data) {
        for (const c of catRes.data) {
          // Tenta encontrar categoria local pelo remoteId
          const existing = categoriesByRemoteId.get(c.id) as Category | undefined;

          const catData = {
            remoteId: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            createdAt: new Date(c.created_at), // Supabase retorna string ISO
            syncStatus: "synced" as const,
          };

          let localId: number;

          if (existing && existing.id) {
            if (
              existing.updatedAt &&
              Math.floor(new Date(c.updated_at).getTime() / 1000) <
                Math.floor(existing.updatedAt.getTime() / 1000)
            ) {
              // Local é mais novo, pula
              localId = existing.id;
            } else {
              await db.categories.update(existing.id, catData);
              localId = existing.id;
            }
          } else {
            // Cria nova
            localId = await db.categories.add(catData) as number;
          }

          remoteToLocalCatMap.set(c.id, localId);
        }
      }

      // --- B. Sincronizar Menus ---
      if (menuRes.data) {
        for (const m of menuRes.data) {
          const existing = menusByRemoteId.get(m.id) as ContextMenu | undefined;
          // Fallback: Tentar match por menuId (slug) se não tiver remoteId gravado
          // Isso evita duplicar menus padrão (tom, publico, etc) se o usuário reinstalou o app
          const existingBySlug = (!existing
            ? menusByMenuId.get(m.menu_id)
            : null) as ContextMenu | undefined;

          const targetId = existing?.id || existingBySlug?.id;

          const menuData = {
            remoteId: m.id,
            menuId: m.menu_id,
            menuName: m.menu_name,
            description: m.description,
            selectionMode: m.selection_mode || "single",
            options: normalizeContextMenuOptions(m.options),
            createdAt: new Date(m.created_at),
            updatedAt: new Date(m.updated_at),
            syncStatus: "synced" as const,
          };

          if (targetId) {
            await db.contextMenus.update(targetId, menuData);
          } else {
            await db.contextMenus.add(menuData);
          }
        }
      }

      // --- C. Sincronizar Prompts ---
      if (promptRes.data) {
        for (const p of promptRes.data) {
          const existing = promptsByRemoteId.get(p.id) as Prompt | undefined;

          // Resolver Categoria Local
          // Se o prompt remoto tem categoria, precisamos achar o ID local correspondente
          // Se não acharmos (ex: categoria deletada localmente mas existe na nuvem),
          // o mapa remoteToLocalCatMap deve resolver se acabamos de sincronizar as categorias.
          let localCategoryId = 0;
          if (p.category_id && remoteToLocalCatMap.has(p.category_id)) {
            localCategoryId = remoteToLocalCatMap.get(p.category_id)!;
          }

          const promptData = {
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
            selectionPayload: undefined as Prompt["selectionPayload"],
            compiledPayload: undefined as Prompt["compiledPayload"],
            remoteId: p.id,
            categoryId: localCategoryId,
            title: p.title,
            selectedMenuIds: p.selected_menu_ids || [],
            schemaVersion: p.schema_version || "1.0.0",
            language: p.language || "pt-BR",
            outputFormat: p.output_format || "markdown",
            referenceUrl: p.reference_url || undefined,
            // Colunas adicionadas em 20260327000001_soft_delete_and_missing_columns
            fewShotExamples: p.few_shot_examples || [],
            createdAt: new Date(p.created_at),
            updatedAt: new Date(p.updated_at),
            syncStatus: "synced" as const,
          };

          // Preferir dados já persistidos na nuvem; fallback para computar localmente
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
                createEmptyUserSelection(
                  promptData.promptPayload.meta.template_id,
                ),
            );

          if (existing && existing.id) {
            if (
              existing.updatedAt &&
              Math.floor(new Date(p.updated_at).getTime() / 1000) <
                Math.floor(existing.updatedAt.getTime() / 1000)
            ) {
              // Local is newer, don't overwrite
            } else {
              await db.prompts.update(existing.id, promptData);
            }
          } else {
            await db.prompts.add(promptData);
          }
        }
      }
    },
  );

  console.log("✅ Smart Merge concluído!");
  return true;
};
