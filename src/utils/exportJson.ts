import { db } from '@/db/database';
import {
    MenuDefinitionSchema,
    PromptContractSchema,
    type MenuDefinition,
    type PromptContract,
} from '@/models/promptSchema';
import type { BulkExport, ContextMenu, Prompt } from '@/models/types';

function contextMenuToDefinition(menu: ContextMenu): MenuDefinition {
    return MenuDefinitionSchema.parse({
        id: menu.menuId,
        label: menu.menuName,
        description: menu.description,
        selection_mode: menu.selectionMode,
        options: (menu.options || []).map((option) => ({
            value: option.value,
            label: option.label,
            sub_options: (option.subOptions || []).map((subOption) => ({
                value: subOption.value,
                label: subOption.label,
            })),
        })),
    });
}

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
        version: '3.0.0',
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
            prompt_id: 'novo_prompt',
            name: 'Novo Prompt',
            schema_version: '1.0.0',
            language: 'pt-BR',
            owner: 'webapp',
        },
        role: {
            id: 'custom_role',
            description: '',
        },
        objective: {
            task: '',
            focus: [],
            priority_order: [],
        },
        project: {
            name: 'PROMPT-APP',
            production_url: 'https://prompt-app-dan.netlify.app',
            repository_url: '',
            reference_urls: [],
            target_environment: ['web_desktop', 'web_mobile'],
            app_type: 'prompt_management_webapp',
            context: '',
        },
        scope: {
            audit_areas_minimum: [],
            critical_flows: [],
            route_discovery: {
                mode: 'auto',
                spa_fallback: true,
                fallback_route: '/',
                include_internal_states: true,
            },
        },
        selected_options: [],
        rules: {},
        policies: {
            must: [],
            must_not: [],
        },
        output_contract: {
            format: 'markdown',
            language: 'pt-BR',
            strict_mode: true,
            require_evidence_for_claims: true,
            required_sections: [],
            route_audit_order: [],
            ordered_evaluation_blocks: [],
            acceptance_criteria: [],
            status_enum: ['approved', 'approved_with_issues', 'failed'],
            severity_enum: ['critical', 'high', 'medium', 'low'],
            structure_notes: '',
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
