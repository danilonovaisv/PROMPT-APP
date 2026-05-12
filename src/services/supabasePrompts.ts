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
    const legacyColumns = getLegacyPromptColumns(promptPayload, input.selectionPayload, input.compiledPayload);

    const payload: Record<string, unknown> = {
        user_id: user.id,
        category_id: remoteCategoryId,
        title: summary.title,
        prompt_payload_jsonb: promptPayload,
        selected_menu_ids: input.selectedMenuIds || [],
        schema_version: summary.schemaVersion,
        output_format: summary.outputFormat,
        language: summary.language,
        reference_url: getPrimaryReferenceUrl(promptPayload),
        // few_shot_examples: campo novo (migration 20260327000001)
        few_shot_examples: input.fewShotExamples || [],
        // Garantir que itens salvos nunca sejam marcados como excluídos
        is_deleted: false,
        updated_at: new Date().toISOString(),
        deleted_at: null,
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

/**
 * Soft Delete — marca o prompt como excluído no Supabase.
 * Em vez de um DELETE real, executa UPDATE SET is_deleted = true.
 * O Supabase Realtime propaga o evento UPDATE para todos os clientes;
 * o listener em realtimeService.ts detecta is_deleted=true e remove
 * o item do estado local imediatamente, sem necessidade de reload.
 */
export async function deletePromptFromSupabase(remoteId: number) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const user = auth?.user;
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
        .from('prompts')
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
