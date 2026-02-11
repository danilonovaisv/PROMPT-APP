/* ======================================================
   Banco de Dados IndexedDB — Dexie.js
   ====================================================== */

import Dexie, { type EntityTable } from 'dexie';
import type { Category, Prompt, MenuOption, ContextMenu } from '@/models/types';

const db = new Dexie('PromptAppDB') as Dexie & {
    categories: EntityTable<Category, 'id'>;
    prompts: EntityTable<Prompt, 'id'>;
    menuOptions: EntityTable<MenuOption, 'id'>;
    contextMenus: EntityTable<ContextMenu, 'id'>;
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

/* ----- Seed de dados iniciais ----- */
/* ----- Seed de dados iniciais ----- */
export async function seedDatabase() {
    try {
        await db.open();
        console.log('📦 Banco de Dados: Iniciando verificação de seed...');

        const categoryCount = await db.categories.count();
        if (categoryCount === 0) {
            console.log('🌱 Seed: Criando categorias padrão...');
            await db.categories.bulkAdd([
                { name: 'Copywriting', icon: '✍️', color: '#ff6b35', createdAt: new Date() },
                { name: 'Código', icon: '💻', color: '#0048ff', createdAt: new Date() },
                { name: 'Análise de Dados', icon: '📊', color: '#00d68f', createdAt: new Date() },
                { name: 'Educação', icon: '🎓', color: '#7b2ff7', createdAt: new Date() },
                { name: 'Criativo', icon: '🎨', color: '#ff4466', createdAt: new Date() },
                { name: 'Negócios', icon: '💼', color: '#ffaa00', createdAt: new Date() },
            ]);
        }

        const menuCount = await db.menuOptions.count();
        if (menuCount === 0) {
            console.log('🌱 Seed: Criando opções de menu padrão...');
            await db.menuOptions.bulkAdd([
                // Tom
                { menuKey: 'tom', label: 'Formal', value: 'formal' },
                { menuKey: 'tom', label: 'Informal', value: 'informal' },
                { menuKey: 'tom', label: 'Técnico', value: 'tecnico' },
                { menuKey: 'tom', label: 'Didático', value: 'didatico' },
                { menuKey: 'tom', label: 'Persuasivo', value: 'persuasivo' },
                { menuKey: 'tom', label: 'Neutro', value: 'neutro' },
                // Público
                { menuKey: 'publico', label: 'Desenvolvedores', value: 'desenvolvedores' },
                { menuKey: 'publico', label: 'Executivos', value: 'executivos' },
                { menuKey: 'publico', label: 'Estudantes', value: 'estudantes' },
                { menuKey: 'publico', label: 'Público Geral', value: 'publico_geral' },
                { menuKey: 'publico', label: 'Especialistas', value: 'especialistas' },
                { menuKey: 'publico', label: 'Crianças', value: 'criancas' },
                // Idioma
                { menuKey: 'idioma', label: 'Português (BR)', value: 'pt-br' },
                { menuKey: 'idioma', label: 'Inglês', value: 'en' },
                { menuKey: 'idioma', label: 'Espanhol', value: 'es' },
                { menuKey: 'idioma', label: 'Francês', value: 'fr' },
                { menuKey: 'idioma', label: 'Alemão', value: 'de' },
                // Estilo
                { menuKey: 'estilo', label: 'Conciso', value: 'conciso' },
                { menuKey: 'estilo', label: 'Detalhado', value: 'detalhado' },
                { menuKey: 'estilo', label: 'Passo a passo', value: 'passo_a_passo' },
                { menuKey: 'estilo', label: 'Lista', value: 'lista' },
                { menuKey: 'estilo', label: 'Narrativo', value: 'narrativo' },
                { menuKey: 'estilo', label: 'Comparativo', value: 'comparativo' },
            ]);
        }

        /* Seed de menus hierárquicos v2 */
        const contextMenuCount = await db.contextMenus.count();
        if (contextMenuCount === 0) {
            console.log('🌱 Seed: Criando menus hierárquicos padrão...');
            const now = new Date();
            await db.contextMenus.bulkAdd([
                {
                    menuId: 'tom',
                    menuName: 'Tom',
                    description: 'Define o tom de comunicação do prompt',
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
            ]);
        }
        console.log('✅ Banco de Dados: Verificação concluída.');
    } catch (err) {
        console.error('❌ Erro durante seed do banco:', err);
    }
}

export { db };
