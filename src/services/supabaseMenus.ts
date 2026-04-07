import { supabase } from '@/lib/supabase';
import type { ContextMenu } from '@/models/types';
import { normalizeContextMenuOptions } from '@/utils/contextMenuOptions';

export async function saveMenuToSupabase(input: Partial<ContextMenu>) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error("Usuário não autenticado");

    const payload: Record<string, unknown> = {
        user_id: user.id,
        menu_id: input.menuId,
        menu_name: input.menuName,
        description: input.description,
        selection_mode: input.selectionMode || "single",
        options: normalizeContextMenuOptions(input.options),
        // Garantir que itens salvos nunca sejam marcados como excluídos
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
        payload.created_at = new Date().toISOString();
        const { data, error } = await supabase
            .from('context_menus')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
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
