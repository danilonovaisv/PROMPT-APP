import { supabase } from '@/lib/supabase';
import { db } from '@/db/database';
import { createSnapshot } from '@/utils/backupManager';
import { Category, ContextMenu, Prompt } from '@/models/types';
import {
    getLegacyPromptColumns,
    getPrimaryReferenceUrl,
    getPromptSummaryFields,
    parsePromptPayload,
} from '@/models/promptSchema';

export const syncToCloud = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error('Usuário não autenticado');
    }

    const snapshot = await createSnapshot();
    const userId = session.user.id;
    const localToRemoteCategoryMap = new Map<number, number>();

    // 1. Sincronizar Categorias
    console.log('☁️ Sincronizando Categorias...');
    const allCategories = snapshot.data.categories;
    for (const cat of allCategories) {
        if (cat.id && cat.remoteId) {
            localToRemoteCategoryMap.set(cat.id, cat.remoteId);
        }
    }
    const categoriesToSync = allCategories.filter((c) => c.syncStatus !== 'synced');
    for (const cat of categoriesToSync) {
        const { id, remoteId, ...data } = cat as Category;

        const payload = {
            user_id: userId,
            name: data.name,
            icon: data.icon,
            color: data.color
        };

        let result;
        if (remoteId) {
            // Update existindo remoteId
            result = await supabase.from('categories')
                .upsert({ id: remoteId, ...payload })
                .select()
                .single();
        } else {
            // Insert novo
            result = await supabase.from('categories')
                .insert(payload)
                .select()
                .single();
        }

        if (result.error) {
            console.error(`❌ Erro ao sincronizar categoria "${data.name}":`, result.error);
            if (id) {
                await db.categories.update(id, { syncStatus: 'error' });
            }
            // Continua para tentar outras, mas loga erro
        } else if (result.data) {
            // Atualiza remoteId localmente
            if (id && result.data.id !== remoteId) {
                await db.categories.update(id, { remoteId: result.data.id, syncStatus: 'synced' });
            }
            if (id && result.data.id === remoteId) {
                await db.categories.update(id, { syncStatus: 'synced' });
            }
            if (id) localToRemoteCategoryMap.set(id, result.data.id);
        }
    }

    // 2. Sincronizar Menus de Contexto
    console.log('☁️ Sincronizando Menus...');
    const menusToSync = snapshot.data.contextMenus.filter((m) => m.syncStatus !== 'synced');
    for (const menu of menusToSync) {
        const { id, remoteId, ...data } = menu as ContextMenu;

        const payload = {
            user_id: userId,
            menu_id: data.menuId,      // map camelCase -> snake_case
            menu_name: data.menuName,
            description: data.description,
            selection_mode: data.selectionMode,
            options: data.options
        };

        // Para menus, temos constraint unique(user_id, menu_id)
        // Podemos usar upsert com onConflict se não tivermos remoteId
        // Mas se tivermos, melhor usar ID.

        let result;
        if (remoteId) {
            result = await supabase.from('context_menus')
                .upsert({ id: remoteId, ...payload })
                .select()
                .single();
        } else {
            // Tenta upsert pelo unique key para recuperar ID se existir
            result = await supabase.from('context_menus')
                .upsert(payload, { onConflict: 'user_id, menu_id' })
                .select()
                .single();
        }

        if (result.error) {
            console.error(`❌ Erro ao sincronizar menu "${data.menuName}":`, result.error);
            if (id) {
                await db.contextMenus.update(id, { syncStatus: 'error' });
            }
        } else if (result.data) {
            if (id && result.data.id !== remoteId) {
                await db.contextMenus.update(id, { remoteId: result.data.id, syncStatus: 'synced' });
            }
            if (id && result.data.id === remoteId) {
                await db.contextMenus.update(id, { syncStatus: 'synced' });
            }
        }
    }

    // 3. Sincronizar Prompts
    console.log('☁️ Sincronizando Prompts...');
    const promptsToSync = snapshot.data.prompts.filter((p) => p.syncStatus !== 'synced');
    for (const prompt of promptsToSync) {
        const { id, remoteId, ...data } = prompt as Prompt;

        // Resolver categoryId
        const remoteCategoryId = localToRemoteCategoryMap.get(data.categoryId);

        // Se a categoria não foi sincronizada (falhou ou não existe), não podemos enviar o prompt
        // (A menos que category_id seja nullable, mas é bom manter integridade)
        // No schema: category_id bigint references categories...

        const summary = getPromptSummaryFields(data.promptPayload);
        const legacyColumns = getLegacyPromptColumns(data.promptPayload);

        const payload = {
            user_id: userId,
            category_id: remoteCategoryId || null, // Se null, perde a categoria mas salva o prompt
            title: summary.title,
            prompt_payload_jsonb: data.promptPayload,
            schema_version: summary.schemaVersion,
            output_format: summary.outputFormat,
            language: summary.language,
            reference_url: getPrimaryReferenceUrl(data.promptPayload),
            few_shot_examples: data.fewShotExamples
            ,
            ...legacyColumns,
        };

        let result;
        if (remoteId) {
            result = await supabase.from('prompts')
                .upsert({ id: remoteId, ...payload })
                .select()
                .single();
        } else {
            result = await supabase.from('prompts')
                .insert(payload)
                .select()
                .single();
        }

        if (result.error) {
            console.error(`❌ Erro ao sincronizar prompt "${data.title}":`, result.error);
            if (id) {
                await db.prompts.update(id, { syncStatus: 'error' });
            }
        } else if (result.data) {
            if (id && result.data.id !== remoteId) {
                await db.prompts.update(id, { remoteId: result.data.id, syncStatus: 'synced' });
            }
            if (id && result.data.id === remoteId) {
                await db.prompts.update(id, { syncStatus: 'synced' });
            }
        }
    }

    console.log('✅ Sincronização concluída!');
    return true;
};

export const downloadFromCloud = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    const [catRes, menuRes, promptRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('context_menus').select('*'),
        supabase.from('prompts').select('*'),
    ]);

    if (catRes.error || menuRes.error || promptRes.error) {
        console.error("Erro no download:", catRes.error, menuRes.error, promptRes.error);
        throw new Error('Falha ao baixar dados da nuvem');
    }

    // Sobrescrever local (mantendo lógica original de 'clear' por enquanto, ou melhor: merge?)
    // O pedido original era "diagnose and fix persistence". Sync é bidirecional idealmente.
    // Mas a função existente fazia clear(). Vou manter a lógica mas mapear os campos corretamente.

    // 4. Estratégia "Smart Merge": Atualizar Localmente sem destruir dados não sincronizados
    console.log('☁️ Iniciando Smart Merge (Nuvem -> Local)...');

    await db.transaction('rw', [db.categories, db.prompts, db.contextMenus], async () => {
        // --- A. Sincronizar Categorias ---
        const remoteToLocalCatMap = new Map<number, number>();

        if (catRes.data) {
            for (const c of catRes.data) {
                // Tenta encontrar categoria local pelo remoteId
                const existing = await db.categories.where('remoteId').equals(c.id).first();

                const catData = {
                    remoteId: c.id,
                    name: c.name,
                    icon: c.icon,
                    color: c.color,
                    createdAt: new Date(c.created_at), // Supabase retorna string ISO
                    syncStatus: 'synced' as const,
                };

                let localId: number;

                if (existing && existing.id) {
                    // Atualiza existente
                    await db.categories.update(existing.id, catData);
                    localId = existing.id;
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
                const existing = await db.contextMenus.where('remoteId').equals(m.id).first();
                // Fallback: Tentar match por menuId (slug) se não tiver remoteId gravado
                // Isso evita duplicar menus padrão (tom, publico, etc) se o usuário reinstalou o app
                const existingBySlug = !existing
                    ? await db.contextMenus.where('menuId').equals(m.menu_id).first()
                    : null;

                const targetId = existing?.id || existingBySlug?.id;

                const menuData = {
                    remoteId: m.id,
                    menuId: m.menu_id,
                    menuName: m.menu_name,
                    description: m.description,
                    selectionMode: m.selection_mode || 'single',
                    options: m.options, // JSONB vem direto
                    createdAt: new Date(m.created_at),
                    updatedAt: new Date(m.updated_at),
                    syncStatus: 'synced' as const,
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
                const existing = await db.prompts.where('remoteId').equals(p.id).first();

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
                    remoteId: p.id,
                    categoryId: localCategoryId,
                    title: p.title,
                    schemaVersion: p.schema_version || '1.0.0',
                    language: p.language || 'pt-BR',
                    outputFormat: p.output_format || 'markdown',
                    referenceUrl: p.reference_url || undefined,
                    fewShotExamples: p.few_shot_examples,
                    createdAt: new Date(p.created_at),
                    updatedAt: new Date(p.updated_at),
                    syncStatus: 'synced' as const,
                };

                if (existing && existing.id) {
                    await db.prompts.update(existing.id, promptData);
                } else {
                    await db.prompts.add(promptData);
                }
            }
        }
    });

    console.log('✅ Smart Merge concluído!');
    return true;
};
