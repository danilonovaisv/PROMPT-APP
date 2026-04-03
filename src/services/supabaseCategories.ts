import { supabase } from '@/lib/supabase';
import type { Category } from '@/models/types';

export async function saveCategoryToSupabase(input: Partial<Category>) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error("Usuário não autenticado");

    const payload: Record<string, unknown> = {
        user_id: user.id,
        name: input.name,
        icon: input.icon,
        color: input.color,
        is_deleted: false,
        deleted_at: null,
    };

    if (input.remoteId) {
        payload.updated_at = new Date().toISOString();
        const { data, error } = await supabase
            .from('categories')
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
            .from('categories')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

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
