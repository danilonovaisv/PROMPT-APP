import { supabase } from '@/lib/supabase';
import { db } from '@/db/database';
import { createSnapshot } from '@/utils/backupManager';

export const syncToCloud = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error('Usuário não autenticado');
    }

    const snapshot = await createSnapshot();
    const userId = session.user.id;

    // 1. Sincronizar Categorias
    for (const cat of snapshot.data.categories) {
        const { id, ...data } = cat;
        await supabase.from('categories').upsert({
            id, // Preservar ID local se possível ou mapear
            user_id: userId,
            ...data,
            name: data.name,
            icon: data.icon,
            color: data.color
        });
    }

    // 2. Sincronizar Menus de Contexto
    for (const menu of snapshot.data.contextMenus) {
        const { id, ...data } = menu;
        await supabase.from('context_menus').upsert({
            id,
            user_id: userId,
            ...data
        });
    }

    // 3. Sincronizar Prompts
    for (const prompt of snapshot.data.prompts) {
        const { id, ...data } = prompt;
        await supabase.from('prompts').upsert({
            id,
            user_id: userId,
            ...data
        });
    }

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
        throw new Error('Falha ao baixar dados da nuvem');
    }

    // Sobrescrever local (Cuidado!)
    await db.transaction('rw', [db.categories, db.prompts, db.contextMenus], async () => {
        await db.categories.clear();
        await db.prompts.clear();
        await db.contextMenus.clear();

        if (catRes.data && catRes.data.length) await db.categories.bulkAdd(catRes.data.map(({ user_id: _u, ...c }: any) => c));
        if (menuRes.data && menuRes.data.length) await db.contextMenus.bulkAdd(menuRes.data.map(({ user_id: _u, ...m }: any) => m));
        if (promptRes.data && promptRes.data.length) await db.prompts.bulkAdd(promptRes.data.map(({ user_id: _u, ...p }: any) => p));
    });

    return true;
};
