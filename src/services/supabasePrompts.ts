import { supabase } from '@/lib/supabase';
import type { Prompt } from '@/models/types';

// Helper if your columns are text instead of jsonb
function toDbJsonMaybe(value: any) {
    if (value === null || value === undefined) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
}

export async function savePromptToSupabase(input: Partial<Prompt>) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error("Usuário não autenticado");

    const payload: any = {
        user_id: user.id,
        category_id: input.categoryId,
        title: input.title,
        system_role: input.systemRole,
        task: input.task,
        context: input.context,
        menus: toDbJsonMaybe(input.menus),
        context_menus: toDbJsonMaybe(input.contextMenus),
        enabled_menu_ids: toDbJsonMaybe(input.enabledMenuIds),
        constraints: toDbJsonMaybe(input.constraints),
        negative_prompt: toDbJsonMaybe(input.negativePrompt),
        output_schema: toDbJsonMaybe(input.outputSchema),
        few_shot_examples: toDbJsonMaybe(input.fewShotExamples),
        updated_at: new Date().toISOString(),
    };

    if (input.id) {
        const { data, error } = await supabase
            .from("prompts")
            .update(payload)
            .eq("id", input.id)
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
