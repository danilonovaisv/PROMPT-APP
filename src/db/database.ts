/* ======================================================
   Banco de Dados IndexedDB — Dexie.js
   ====================================================== */

import Dexie, { type EntityTable } from 'dexie';
import type { Category, Prompt, ContextMenu, PromptMemory } from '@/models/types';
import {
    createPromptPayloadFromLegacyRecord,
    getPromptSummaryFields,
} from '@/models/promptSchema';
import { getDuplicateIds, getMissingSeedRecords } from '@/db/seedHelpers';
import { DEFAULT_PROMPTS } from './defaultPrompts';

const db = new Dexie('PromptAppDB') as Dexie & {
    categories: EntityTable<Category, 'id'>;
    prompts: EntityTable<Prompt, 'id'>;
    contextMenus: EntityTable<ContextMenu, 'id'>;
    promptMemory: EntityTable<PromptMemory, 'id'>;
};

/* --- Schema v1 → v2 migration --- */
db.version(1).stores({
    categories: '++id, name, createdAt',
    prompts: '++id, categoryId, title, createdAt, updatedAt',
    menuOptions: '++id, menuKey, value',
});

db.version(2).stores({
    categories: '++id, name, createdAt',
    prompts: '++id, categoryId, title, createdAt, updatedAt',
    menuOptions: '++id, menuKey, value',
    contextMenus: '++id, menuId, menuName, createdAt',
}).upgrade(async (tx) => {
    /* Migrar prompts existentes: adicionar contextMenus vazio */
    const prompts = tx.table('prompts');
    await prompts.toCollection().modify((prompt: Record<string, unknown>) => {
        if (!prompt.contextMenus) {
            prompt.contextMenus = {};
        }
    });
});

db.version(3).stores({
    categories: '++id, name, createdAt',
    prompts: '++id, categoryId, title, createdAt, updatedAt',
    menuOptions: '++id, menuKey, value',
    contextMenus: '++id, menuId, menuName, createdAt',
}).upgrade(async (tx) => {
    /* Migrar prompts existentes: adicionar enabledMenuIds com todos os menus em uso */
    const prompts = tx.table('prompts');
    await prompts.toCollection().modify((prompt: Record<string, unknown>) => {
        if (!prompt.enabledMenuIds) {
            const contextMenus = (prompt.contextMenus || {}) as Record<string, unknown>;
            prompt.enabledMenuIds = Object.keys(contextMenus);
        }
    });
});

db.version(4).stores({
    categories: '++id, input, name, createdAt, remoteId',
    prompts: '++id, categoryId, title, createdAt, updatedAt, remoteId',
    menuOptions: '++id, menuKey, value', // Mantido sem remoteId pois é depreciado
    contextMenus: '++id, menuId, menuName, createdAt, remoteId',
});

db.version(5).stores({
    categories: '++id, input, name, createdAt, remoteId, syncStatus',
    prompts: '++id, categoryId, title, createdAt, updatedAt, remoteId, syncStatus',
    menuOptions: '++id, menuKey, value',
    contextMenus: '++id, menuId, menuName, createdAt, remoteId, syncStatus',
}).upgrade(async (tx) => {
    const categories = tx.table('categories');
    const prompts = tx.table('prompts');
    const contextMenus = tx.table('contextMenus');

    await categories.toCollection().modify((cat: Record<string, unknown>) => {
        if (!cat.syncStatus) {
            cat.syncStatus = cat.remoteId ? 'synced' : 'pending';
        }
    });

    await prompts.toCollection().modify((prompt: Record<string, unknown>) => {
        if (!prompt.syncStatus) {
            prompt.syncStatus = prompt.remoteId ? 'synced' : 'pending';
        }
    });

    await contextMenus.toCollection().modify((menu: Record<string, unknown>) => {
        if (!menu.syncStatus) {
            menu.syncStatus = menu.remoteId ? 'synced' : 'pending';
        }
    });
});

db.version(6).stores({
    categories: '++id, input, name, createdAt, remoteId, syncStatus',
    prompts: '++id, categoryId, title, schemaVersion, language, outputFormat, createdAt, updatedAt, remoteId, syncStatus',
    menuOptions: '++id, menuKey, value',
    contextMenus: '++id, menuId, menuName, selectionMode, createdAt, remoteId, syncStatus',
}).upgrade(async (tx) => {
    const prompts = tx.table('prompts');
    const contextMenus = tx.table('contextMenus');

    await prompts.toCollection().modify((prompt: Record<string, unknown>) => {
        const promptPayload = createPromptPayloadFromLegacyRecord({
            title: typeof prompt.title === 'string' ? prompt.title : '',
            systemRole: typeof prompt.systemRole === 'string' ? prompt.systemRole : '',
            task: typeof prompt.task === 'string' ? prompt.task : '',
            context: typeof prompt.context === 'string' ? prompt.context : '',
            contextMenus:
                prompt.contextMenus && typeof prompt.contextMenus === 'object'
                    ? (prompt.contextMenus as Record<string, { option?: string; subOptions?: string[] }>)
                    : {},
            enabledMenuIds: Array.isArray(prompt.enabledMenuIds)
                ? (prompt.enabledMenuIds as string[])
                : undefined,
            constraints: Array.isArray(prompt.constraints) ? (prompt.constraints as string[]) : [],
            negativePrompt: Array.isArray(prompt.negativePrompt)
                ? (prompt.negativePrompt as string[])
                : [],
            outputSchema:
                prompt.outputSchema && typeof prompt.outputSchema === 'object'
                    ? (prompt.outputSchema as { formato?: string; estrutura?: string })
                    : undefined,
            referenceUrl: typeof prompt.referenceUrl === 'string' ? prompt.referenceUrl : undefined,
            language: typeof prompt.language === 'string' ? prompt.language : undefined,
            schemaVersion:
                typeof prompt.schemaVersion === 'string' ? prompt.schemaVersion : undefined,
        });

        const summary = getPromptSummaryFields(promptPayload);

        prompt.promptPayload = promptPayload;
        prompt.title = summary.title;
        prompt.schemaVersion = summary.schemaVersion;
        prompt.language = summary.language;
        prompt.outputFormat = summary.outputFormat;
        prompt.referenceUrl = undefined;
        prompt.fewShotExamples = Array.isArray(prompt.fewShotExamples)
            ? prompt.fewShotExamples
            : [];

        delete prompt.systemRole;
        delete prompt.task;
        delete prompt.context;
        delete prompt.menus;
        delete prompt.contextMenus;
        delete prompt.enabledMenuIds;
        delete prompt.constraints;
        delete prompt.negativePrompt;
        delete prompt.outputSchema;
    });

    await contextMenus.toCollection().modify((menu: Record<string, unknown>) => {
        if (!menu.selectionMode) {
            menu.selectionMode = 'single';
        }
    });
});

db.version(7).stores({
    categories: '++id, input, name, createdAt, remoteId, syncStatus',
    prompts: '++id, categoryId, title, schemaVersion, language, outputFormat, createdAt, updatedAt, remoteId, syncStatus',
    menuOptions: '++id, menuKey, value',
    contextMenus: '++id, menuId, menuName, selectionMode, createdAt, remoteId, syncStatus',
}).upgrade(async (tx) => {
    const prompts = tx.table('prompts');

    await prompts.toCollection().modify((prompt: Record<string, unknown>) => {
        if (!prompt.selectionPayload) {
            prompt.selectionPayload = undefined;
        }

        if (!prompt.compiledPayload) {
            prompt.compiledPayload = undefined;
        }
    });
});

db.version(8).stores({
    categories: '++id, input, name, createdAt, remoteId, syncStatus',
    prompts: '++id, categoryId, title, schemaVersion, language, outputFormat, selectedMenuIds, createdAt, updatedAt, remoteId, syncStatus',
    menuOptions: '++id, menuKey, value',
    contextMenus: '++id, menuId, menuName, selectionMode, createdAt, remoteId, syncStatus',
}).upgrade(async (tx) => {
    const prompts = tx.table('prompts');

    await prompts.toCollection().modify((prompt: Record<string, unknown>) => {
        if (!prompt.selectedMenuIds) {
            prompt.selectedMenuIds = [];
        }
    });
});

db.version(9).stores({
    categories: '++id, input, name, createdAt, remoteId, syncStatus',
    prompts: '++id, categoryId, title, schemaVersion, language, outputFormat, selectedMenuIds, createdAt, updatedAt, remoteId, syncStatus',
    menuOptions: '++id, menuKey, value',
    contextMenus: '++id, menuId, menuName, selectionMode, createdAt, remoteId, syncStatus',
}).upgrade(async (tx) => {
    const prompts = tx.table('prompts');
    await prompts.toCollection().modify((prompt: Record<string, unknown>) => {
        if (!prompt.selectedMenuIds) {
            prompt.selectedMenuIds = [];
        }
    });
});

db.version(10).stores({
    categories: '++id, input, name, createdAt, remoteId, syncStatus',
    prompts: '++id, categoryId, title, schemaVersion, language, outputFormat, selectedMenuIds, createdAt, updatedAt, remoteId, syncStatus',
    menuOptions: '++id, menuKey, value',
    contextMenus: '++id, menuId, menuName, selectionMode, createdAt, remoteId, syncStatus',
}).upgrade(async (tx) => {
    const prompts = tx.table('prompts');

    await prompts.toCollection().modify((prompt: Record<string, unknown>) => {
        if (!Array.isArray(prompt.selectedMenuIds)) {
            prompt.selectedMenuIds = [];
        }
    });
});

db.version(11).stores({
    categories: '++id, input, name, createdAt, remoteId, syncStatus',
    prompts: '++id, categoryId, title, schemaVersion, language, outputFormat, selectedMenuIds, createdAt, updatedAt, remoteId, syncStatus',
    menuOptions: '++id, menuKey, value',
    contextMenus: '++id, menuId, menuName, selectionMode, createdAt, remoteId, syncStatus',
    promptMemory: '++id, key, templateId, remoteId, syncStatus',
});

db.version(12).stores({
    categories: '++id, input, name, createdAt, remoteId, syncStatus',
    prompts: '++id, categoryId, title, schemaVersion, language, outputFormat, selectedMenuIds, createdAt, updatedAt, remoteId, syncStatus',
    menuOptions: '++id, menuKey, value',
    contextMenus: '++id, menuId, menuName, selectionMode, createdAt, remoteId, syncStatus',
    promptMemory: '++id, key, templateId, remoteId, syncStatus, isDeleted',
}).upgrade(async (tx) => {
    const promptMemory = tx.table('promptMemory');
    await promptMemory.toCollection().modify((memory: Record<string, unknown>) => {
        if (memory.isDeleted === undefined) {
            memory.isDeleted = false;
        }
    });
});

db.version(13).stores({
    categories: '++id, input, name, createdAt, remoteId, syncStatus',
    prompts: '++id, categoryId, title, schemaVersion, language, outputFormat, selectedMenuIds, createdAt, updatedAt, remoteId, syncStatus',
    menuOptions: '++id, menuKey, value',
    contextMenus: '++id, menuId, menuName, selectionMode, createdAt, remoteId, syncStatus',
    promptMemory: '++id, key, templateId, [templateId+key], remoteId, syncStatus, isDeleted',
});

db.version(14).stores({
    categories: '++id, input, name, createdAt, remoteId, syncStatus',
    prompts: '++id, categoryId, title, schemaVersion, language, outputFormat, selectedMenuIds, createdAt, updatedAt, remoteId, syncStatus',
    contextMenus: '++id, menuId, menuName, selectionMode, createdAt, remoteId, syncStatus',
    promptMemory: '++id, key, templateId, [templateId+key], remoteId, syncStatus, isDeleted',
});

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'remoteId'>[] = [
    { name: 'Copywriting', icon: '✍️', color: '#ff6b35', createdAt: new Date(), syncStatus: 'pending' },
    { name: 'Código', icon: '💻', color: '#0048ff', createdAt: new Date(), syncStatus: 'pending' },
    { name: 'Análise de Dados', icon: '📊', color: '#00d68f', createdAt: new Date(), syncStatus: 'pending' },
    { name: 'Educação', icon: '🎓', color: '#7b2ff7', createdAt: new Date(), syncStatus: 'pending' },
    { name: 'Criativo', icon: '🎨', color: '#ff4466', createdAt: new Date(), syncStatus: 'pending' },
    { name: 'Negócios', icon: '💼', color: '#ffaa00', createdAt: new Date(), syncStatus: 'pending' },
];


function createDefaultContextMenus() {
    const now = new Date();
    const menus: Omit<ContextMenu, 'id' | 'remoteId'>[] = [
        {
            menuId: 'tom',
            menuName: 'Tom',
            description: 'Define o tom de comunicação do prompt',
            selectionMode: 'single' as const,
            syncStatus: 'pending' as const,
            options: [
                {
                    label: 'Formal', value: 'formal', subOptions: [
                        { label: 'Corporativo', value: 'corporativo' },
                        { label: 'Acadêmico', value: 'academico' },
                        { label: 'Jurídico', value: 'juridico' },
                    ]
                },
                {
                    label: 'Informal', value: 'informal', subOptions: [
                        { label: 'Conversacional', value: 'conversacional' },
                        { label: 'Humorístico', value: 'humoristico' },
                    ]
                },
                {
                    label: 'Técnico', value: 'tecnico', subOptions: [
                        { label: 'Conciso', value: 'conciso' },
                        { label: 'Detalhado', value: 'detalhado' },
                        { label: 'Acadêmico', value: 'academico' },
                    ]
                },
                { label: 'Didático', value: 'didatico', subOptions: [] },
                { label: 'Persuasivo', value: 'persuasivo', subOptions: [] },
                { label: 'Neutro', value: 'neutro', subOptions: [] },
            ],
            createdAt: now,
            updatedAt: now,
        },
        {
            menuId: 'publico',
            menuName: 'Público',
            description: 'Define o público-alvo do prompt',
            selectionMode: 'single' as const,
            syncStatus: 'pending' as const,
            options: [
                {
                    label: 'Desenvolvedores', value: 'desenvolvedores', subOptions: [
                        { label: 'Júnior', value: 'junior' },
                        { label: 'Sênior', value: 'senior' },
                        { label: 'Full Stack', value: 'fullstack' },
                    ]
                },
                { label: 'Executivos', value: 'executivos', subOptions: [] },
                {
                    label: 'Estudantes', value: 'estudantes', subOptions: [
                        { label: 'Ensino Médio', value: 'ensino_medio' },
                        { label: 'Graduação', value: 'graduacao' },
                        { label: 'Pós-Graduação', value: 'pos_graduacao' },
                    ]
                },
                { label: 'Público Geral', value: 'publico_geral', subOptions: [] },
                { label: 'Especialistas', value: 'especialistas', subOptions: [] },
                { label: 'Crianças', value: 'criancas', subOptions: [] },
            ],
            createdAt: now,
            updatedAt: now,
        },
        {
            menuId: 'idioma',
            menuName: 'Idioma',
            description: 'Define o idioma de resposta do prompt',
            selectionMode: 'single' as const,
            syncStatus: 'pending' as const,
            options: [
                { label: 'Português (BR)', value: 'pt-br', subOptions: [] },
                {
                    label: 'Inglês', value: 'en', subOptions: [
                        { label: 'Americano', value: 'en-us' },
                        { label: 'Britânico', value: 'en-gb' },
                    ]
                },
                { label: 'Espanhol', value: 'es', subOptions: [] },
                { label: 'Francês', value: 'fr', subOptions: [] },
                { label: 'Alemão', value: 'de', subOptions: [] },
            ],
            createdAt: now,
            updatedAt: now,
        },
        {
            menuId: 'estilo',
            menuName: 'Estilo',
            description: 'Define o estilo de formatação da saída',
            selectionMode: 'single' as const,
            syncStatus: 'pending' as const,
            options: [
                { label: 'Conciso', value: 'conciso', subOptions: [] },
                {
                    label: 'Detalhado', value: 'detalhado', subOptions: [
                        { label: 'Com exemplos', value: 'com_exemplos' },
                        { label: 'Com referências', value: 'com_referencias' },
                    ]
                },
                { label: 'Passo a passo', value: 'passo_a_passo', subOptions: [] },
                { label: 'Lista', value: 'lista', subOptions: [] },
                {
                    label: 'Narrativo', value: 'narrativo', subOptions: [
                        { label: 'Storytelling', value: 'storytelling' },
                        { label: 'Metáforas', value: 'metaforas' },
                    ]
                },
                { label: 'Comparativo', value: 'comparativo', subOptions: [] },
            ],
            createdAt: now,
            updatedAt: now,
        },
    ];

    return menus;
}

let seedPromise: Promise<void> | null = null;

function normalizeKey(value: string) {
    return value.trim().toLowerCase();
}

export async function seedDatabase() {
    if (seedPromise) {
        return seedPromise;
    }

    seedPromise = (async () => {
        try {
            await db.open();
            console.log('📦 Banco de Dados: Iniciando verificação de seed...');

            await db.transaction('rw', db.categories, db.contextMenus, async () => {
                const existingCategories = await db.categories.toArray();
                const duplicateCategoryIds = getDuplicateIds(
                    existingCategories,
                    (item) => normalizeKey(item.name),
                    (item) => item.id
                );
                if (duplicateCategoryIds.length > 0) {
                    await db.categories.bulkDelete(duplicateCategoryIds);
                }

                const categoriesAfterCleanup = existingCategories.filter(
                    (item) => !duplicateCategoryIds.includes(item.id ?? -1)
                );

                // Fix P0 (V1): Usar TODOS os registros existentes (incluindo isDeleted: true)
                // como base para a comparação do seed.
                // Isso impede que o seed recrie categorias que o usuário intencionalmente excluiu,
                // mesmo que elas já tenham sido removidas fisicamente ou marcadas como excluídas.
                const missingCategories = getMissingSeedRecords(
                    DEFAULT_CATEGORIES,
                    categoriesAfterCleanup,
                    (item) => normalizeKey(item.name)
                );
                if (missingCategories.length > 0) {
                    console.log(`🌱 Seed: Criando ${missingCategories.length} categorias padrão...`);
                    await db.categories.bulkAdd(missingCategories);
                }

                const existingContextMenus = await db.contextMenus.toArray();
                const duplicateContextMenuIds = getDuplicateIds(
                    existingContextMenus,
                    (item) => normalizeKey(item.menuId),
                    (item) => item.id
                );
                if (duplicateContextMenuIds.length > 0) {
                    await db.contextMenus.bulkDelete(duplicateContextMenuIds);
                }

                const contextMenusAfterCleanup = existingContextMenus.filter(
                    (item) => !duplicateContextMenuIds.includes(item.id ?? -1)
                );
                const missingContextMenus = getMissingSeedRecords(
                    createDefaultContextMenus(),
                    contextMenusAfterCleanup,
                    (item) => normalizeKey(item.menuId)
                );
                if (missingContextMenus.length > 0) {
                    console.log(`🌱 Seed: Criando ${missingContextMenus.length} menus hierárquicos padrão...`);
                    await db.contextMenus.bulkAdd(missingContextMenus);
                }

                // --- Seed de Prompts Padrão ---
                const categoriesAfterSeed = await db.categories.toArray();
                const existingPrompts = await db.prompts.toArray();

                for (const defaultPrompt of DEFAULT_PROMPTS) {
                    const category = categoriesAfterSeed.find(
                        (c) => normalizeKey(c.name) === normalizeKey(defaultPrompt.category)
                    );

                    if (category?.id) {
                        const exists = existingPrompts.some(
                            (p) => normalizeKey(p.title) === normalizeKey(defaultPrompt.title)
                        );

                        if (!exists) {
                            console.log(`🌱 Seed: Criando prompt padrão "${defaultPrompt.title}"...`);
                            const payload = defaultPrompt.payload;
                            const now = new Date();
                            await db.prompts.add({
                                categoryId: category.id,
                                title: defaultPrompt.title,
                                promptPayload: payload,
                                schemaVersion: payload.meta.schema_version,
                                language: payload.meta.language,
                                outputFormat: payload.output_contract.format,
                                fewShotExamples: payload.prompt_definition.few_shot_examples,
                                createdAt: now,
                                updatedAt: now,
                                syncStatus: 'pending',
                                isDeleted: false,
                                selectedMenuIds: []
                            });
                        }
                    }
                }
            });

            console.log('✅ Banco de Dados: Verificação concluída.');
        } catch (err) {
            console.error('❌ Erro durante seed do banco:', err);
        } finally {
            seedPromise = null;
        }
    })();

    return seedPromise;
}

export { db };
