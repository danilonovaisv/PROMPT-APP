import { supabase } from '@/lib/supabase';
import type { ContextMenu } from '@/models/types';
import { normalizeContextMenuOptions } from '@/utils/contextMenuOptions';

export async function saveMenuToSupabase(input: Partial<ContextMenu>) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error("Usuário não autenticado");

    // NOTA: selection_mode foi removida do schema remoto em 20260317213609_remote_schema.sql
    // Mantida apenas no modelo local (Dexie). Não enviar ao Supabase.
    const payload: Record<string, unknown> = {
        user_id: user.id,
        menu_id: input.menuId,
        menu_name: input.menuName,
        description: input.description,
        options: normalizeContextMenuOptions(input.options),
        updated_at: new Date().toISOString(),
        is_deleted: false,
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
