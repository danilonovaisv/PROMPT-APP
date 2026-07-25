import { supabase } from '@/lib/supabase';
import type { Category } from '@/models/types';

export async function saveCategoryToSupabase(input: Partial<Category>) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error("Usuário não autenticado");

    if (input.remoteId) {
        const updatePayload = {
            name: input.name,
            icon: input.icon,
            color: input.color,
            is_deleted: false,
            deleted_at: null,
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
            .from('categories')
            .update(updatePayload)
            .eq('id', input.remoteId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } else {
        const insertPayload = {
            user_id: user.id,
            name: input.name || '',
            icon: input.icon,
            color: input.color,
            is_deleted: false,
            deleted_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
            .from('categories')
            .insert(insertPayload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

/**
 * Soft Delete — marca a categoria como excluída no Supabase.
 * Em vez de um DELETE real, executa UPDATE SET is_deleted = true.
 * O Supabase Realtime propaga o evento UPDATE para todos os clientes;
 * o listener em realtimeService.ts detecta is_deleted=true e remove
 * o item do estado local imediatamente.
 */
export async function deleteCategoryFromSupabase(remoteId: number) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error("Usuário não autenticado");

    const { error } = await supabase
        .from('categories')
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
