import { supabase } from '@/lib/supabase';
import type { ContextMenu } from '@/models/types';
import { normalizeContextMenuOptions } from '@/utils/contextMenuOptions';

export async function saveMenuToSupabase(input: Partial<ContextMenu>) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error("Usuário não autenticado");

    if (!input.menuId || !input.menuName) {
        throw new Error("menuId e menuName são obrigatórios");
    }

    const payload = {
        user_id: user.id,
        menu_id: input.menuId,
        menu_name: input.menuName,
        description: input.description ?? null,
        selection_mode: input.selectionMode || "single",
        options: normalizeContextMenuOptions(input.options) as unknown as import('@/lib/supabase.types').Json,
        is_deleted: false,
        updated_at: new Date().toISOString(),
        deleted_at: null,
    };

    if (input.remoteId) {
        const { data, error } = await supabase
            .from('context_menus')
            .update(payload)
            .eq('id', input.remoteId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } else {
        const insertPayload = {
            ...payload,
            created_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
            .from('context_menus')
            .upsert(insertPayload, { onConflict: 'user_id,menu_id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

export async function saveMenusToSupabaseBulk(inputs: Partial<ContextMenu>[]) {
    if (inputs.length === 0) return [];

    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error("Usuário não autenticado");

    const validInputs = inputs.filter((i): i is Partial<ContextMenu> & { menuId: string; menuName: string } => !!i.menuId && !!i.menuName);

    const payloads = validInputs.map(input => ({
        ...(input.remoteId ? { id: input.remoteId } : {}),
        user_id: user.id,
        menu_id: input.menuId,
        menu_name: input.menuName,
        description: input.description ?? null,
        selection_mode: input.selectionMode || "single",
        options: normalizeContextMenuOptions(input.options) as unknown as import('@/lib/supabase.types').Json,
        is_deleted: false,
        updated_at: new Date().toISOString(),
        deleted_at: null,
    }));

    const { data, error } = await supabase
        .from('context_menus')
        .upsert(payloads, { onConflict: 'user_id,menu_id' })
        .select();

    if (error) throw error;
    return data;
}

/**
 * Soft Delete — marca o menu de contexto como excluído no Supabase.
 * Em vez de um DELETE real, executa UPDATE SET is_deleted = true.
 * O Supabase Realtime propaga o evento UPDATE para todos os clientes;
 * o listener em realtimeService.ts detecta is_deleted=true e remove
 * o item do estado local imediatamente.
 */
export async function deleteMenuFromSupabase(remoteId: number) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error("Usuário não autenticado");

    const { error } = await supabase
        .from('context_menus')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', remoteId)
        .eq('user_id', user.id);

    if (error) throw error;
    return true;
}
