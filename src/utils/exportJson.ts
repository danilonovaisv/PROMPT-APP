import { db } from '@/db/database';
import {
    PromptContractSchema,
    type PromptContract,
} from '@/models/promptSchema';
import type { BulkExport, Prompt } from '@/models/types';
import { contextMenuToDefinition } from '@/utils/promptArtifacts';
import {
    CURRENT_BULK_EXPORT_VERSION,
    CURRENT_PROMPT_SCHEMA_VERSION,
} from '@/utils/schemaCompatibility';

export function toExportFormat(prompt: Prompt): PromptContract {
    return PromptContractSchema.parse(prompt.promptPayload);
}

export function downloadJson(data: unknown, filename: string) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

export function downloadPrompt(prompt: Prompt) {
    const exported = toExportFormat(prompt);
    const safeName = prompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadJson(exported, `prompt_${safeName}`);
}

export async function downloadAllPrompts() {
    const prompts = await db.prompts.toArray();
    const categories = await db.categories.toArray();
    const contextMenus = await db.contextMenus.toArray();
    const categoryMap = new Map(categories.map((category) => [category.id!, category.name]));

    const bulk: BulkExport = {
        app: 'Prompt App',
        version: CURRENT_BULK_EXPORT_VERSION,
        format: 'prompt-app-bulk-export',
        schemaVersion: CURRENT_PROMPT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        menuDefinitions: contextMenus.map(contextMenuToDefinition),
        prompts: prompts.map((prompt) => ({
            title: prompt.title,
            category: categoryMap.get(prompt.categoryId) || 'Sem categoria',
            schemaVersion: prompt.schemaVersion,
            prompt: toExportFormat(prompt),
        })),
    };

    downloadJson(bulk, `prompt_app_export_${Date.now()}`);
}

export function getTemplateFile(): Blob {
    const template = PromptContractSchema.parse({
        meta: {
            template_id: 'novo_template',
            template_name: 'Novo Template',
            template_type: 'generic_prompt',
            schema_version: CURRENT_PROMPT_SCHEMA_VERSION,
            language: 'pt-BR',
            status: 'draft',
        },
        prompt_definition: {
            system_role: '',
            task: '',
            context: '',
            constraints: [],
            negative_prompt: [],
            few_shot_examples: [],
        },
        menu_definitions: [],
        output_contract: {
            format: 'markdown',
            language: 'pt-BR',
            strict_mode: true,
            required_fields: [],
            response_rules: [],
        },
    });

    return new Blob([JSON.stringify(template, null, 2)], {
        type: 'application/json',
    });
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
    }
}
