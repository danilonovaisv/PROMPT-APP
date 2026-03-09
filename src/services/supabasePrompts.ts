import { supabase } from '@/lib/supabase';
import { db } from '@/db/database';
import {
    createPromptPayloadFromLegacyRecord,
    getLegacyPromptColumns,
    getPrimaryReferenceUrl,
    getPromptSummaryFields,
    type PromptContract,
} from '@/models/promptSchema';
import type { Prompt } from '@/models/types';

function resolvePromptPayload(input: Partial<Prompt>): PromptContract {
    if (input.promptPayload) {
        return input.promptPayload;
    }

    return createPromptPayloadFromLegacyRecord({
        title: input.title,
        referenceUrl: input.referenceUrl,
        schemaVersion: input.schemaVersion,
        language: input.language,
    });
}

export async function savePromptToSupabase(input: Partial<Prompt>) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error('Usuário não autenticado');

    let remoteCategoryId = null;
    if (input.categoryId) {
        const localCategory = await db.categories.get(input.categoryId);
        if (localCategory?.remoteId) {
            remoteCategoryId = localCategory.remoteId;
        } else if (input.categoryId > 0) {
            remoteCategoryId = input.categoryId;
        }
    }

    const promptPayload = resolvePromptPayload(input);
    const summary = getPromptSummaryFields(promptPayload);
    const legacyColumns = getLegacyPromptColumns(promptPayload);

    const payload: Record<string, unknown> = {
        user_id: user.id,
        category_id: remoteCategoryId,
        title: summary.title,
        prompt_payload_jsonb: promptPayload,
        schema_version: summary.schemaVersion,
        output_format: summary.outputFormat,
        language: summary.language,
        reference_url: getPrimaryReferenceUrl(promptPayload),
        few_shot_examples: input.fewShotExamples || [],
        updated_at: new Date().toISOString(),
        ...legacyColumns,
    };

    if (input.remoteId) {
        const { data, error } = await supabase
            .from('prompts')
            .update(payload)
            .eq('id', input.remoteId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    payload.created_at = new Date().toISOString();
    const { data, error } = await supabase
        .from('prompts')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deletePromptFromSupabase(remoteId: number) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', remoteId)
        .eq('user_id', user.id);

    if (error) throw error;
    return true;
}
