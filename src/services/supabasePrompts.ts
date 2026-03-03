import { supabase } from '@/lib/supabase';
import { db } from '@/db/database';
import type { Prompt } from '@/models/types';
import { normalizeOutputSchema, sanitizeUrlField } from '@/models/outputSchema';


export async function savePromptToSupabase(input: Partial<Prompt>) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error("Usuário não autenticado");

    // Resolver ID remoto da categoria
    let remoteCategoryId = null;
    if (input.categoryId) {
        // Tenta achar categoria localmente para pegar o remoteId
        const localCat = await db.categories.get(input.categoryId);
        if (localCat?.remoteId) {
            remoteCategoryId = localCat.remoteId;
        } else {
            // Se não achou localmente, talvez o categoryId já seja o remoto (ex: vindo de import direto)
            // ou talvez a categoria ainda não foi sincronizada.
            // Para segurança, vamos verificar se é um número grande (provável remoteId do Supabase identity)
            if (input.categoryId > 0) {
                remoteCategoryId = input.categoryId;
            }
        }
    }

    const schema = normalizeOutputSchema(input.outputSchema);
    const urlResult = sanitizeUrlField(input.referenceUrl);
    if (urlResult.error) {
        throw new Error(urlResult.error);
    }

    const payload: any = {
        user_id: user.id,
        category_id: remoteCategoryId,
        title: input.title,
        system_role: input.systemRole,
        task: input.task,
        context: input.context,
        menus: input.menus || {},
        context_menus: input.contextMenus || {},
        enabled_menu_ids: input.enabledMenuIds || [],
        constraints: input.constraints || [],
        negative_prompt: input.negativePrompt || [],
        output_schema: schema,
        reference_url: urlResult.value,
        few_shot_examples: input.fewShotExamples || [],
        updated_at: new Date().toISOString(),
    };

    if (input.remoteId) {
        const { data, error } = await supabase
            .from("prompts")
            .update(payload)
            .eq("id", input.remoteId)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } else {
        payload.created_at = new Date().toISOString();
        const { data, error } = await supabase
            .from("prompts")
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

export async function deletePromptFromSupabase(remoteId: number) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error("Usuário não autenticado");

    const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', remoteId)
        .eq('user_id', user.id);

    if (error) throw error;
    return true;
}
