/* ======================================================
   Banco de Dados IndexedDB — Dexie.js
   ====================================================== */

import Dexie, { type EntityTable } from 'dexie';
import type { Category, Prompt, MenuOption } from '@/models/types';

const db = new Dexie('PromptAppDB') as Dexie & {
    categories: EntityTable<Category, 'id'>;
    prompts: EntityTable<Prompt, 'id'>;
    menuOptions: EntityTable<MenuOption, 'id'>;
};

db.version(1).stores({
    categories: '++id, name, createdAt',
    prompts: '++id, categoryId, title, createdAt, updatedAt',
    menuOptions: '++id, menuKey, value',
});

/* ----- Seed de dados iniciais ----- */
async function seedDatabase() {
    const categoryCount = await db.categories.count();
    if (categoryCount === 0) {
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
}

// Executar seed ao inicializar
seedDatabase();

export { db };
