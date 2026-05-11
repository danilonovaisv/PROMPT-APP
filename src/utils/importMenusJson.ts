/* ======================================================
   Importação de Menus de Contexto via JSON
   Schema v1.0 — Validação + Importação Atômica
   ====================================================== */

import { db } from '@/db/database';
import { saveMenusToSupabaseBulk } from '@/services/supabaseMenus';
import type { ContextMenu } from '@/models/types';

/* -------------------------------------------------------
   ETAPA 1 — Schema de Importação
   ------------------------------------------------------- */

import { z } from 'zod';

/* -------------------------------------------------------
   ETAPA 1 — Schema de Importação (Zod)
   ------------------------------------------------------- */

const SubOptionSchema = z.object({
    label: z.string().min(1, "label é obrigatório e deve ser string não-vazia"),
    value: z.string().min(1, "value é obrigatório e deve ser string não-vazia")
});

const OptionSchema = z.object({
    label: z.string().min(1, "label é obrigatório e deve ser string não-vazia"),
    value: z.string().min(1, "value é obrigatório e deve ser string não-vazia"),
    sub_options: z.array(SubOptionSchema).optional()
});

const ImportMenuSchema = z.object({
    menu_id: z.string().min(1, "menu_id é obrigatório e deve ser string não-vazia"),
    menu_name: z.string().min(1, "menu_name é obrigatório e deve ser string não-vazia"),
    description: z.string().catch(""),
    selection_mode: z.enum(['single', 'multiple']).optional().default('single'),
    options: z.array(OptionSchema).min(1, "options é obrigatório e deve ser um array não-vazio")
});

const MenuImportSchemaZod = z.object({
    version: z.string().min(1, "Campo \"version\" é obrigatório (ex: \"1.0\")"),
    menus: z.array(ImportMenuSchema).min(1, "O array \"menus\" não pode estar vazio")
}).refine(data => {
    const ids = data.menus.map(m => m.menu_id);
    return new Set(ids).size === ids.length;
}, {
    message: "Existem menu_ids duplicados no arquivo",
    path: ["menus"]
});

export type ImportSubOption = z.infer<typeof SubOptionSchema>;
export type ImportOption = z.infer<typeof OptionSchema>;
export type ImportMenu = z.infer<typeof ImportMenuSchema>;
export type MenuImportSchema = z.infer<typeof MenuImportSchemaZod>;

/* -------------------------------------------------------
   ETAPA 2 — Validação via Zod
   ------------------------------------------------------- */

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    data: MenuImportSchema | null;
}

/** Valida o JSON completo contra o schema de importação usando Zod */
export function validateMenuImportFile(raw: unknown): ValidationResult {
    const result = MenuImportSchemaZod.safeParse(raw);

    if (!result.success) {
        const errors: ValidationError[] = result.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
        }));
        return {
            valid: false,
            errors,
            data: null
        };
    }

    return {
        valid: true,
        errors: [],
        data: result.data
    };
}

/** Verifica conflitos com menus existentes no banco */
export async function checkMenuIdConflicts(menuIds: string[]): Promise<string[]> {
    if (menuIds.length === 0) {
        return [];
    }

    // Conflito real é apenas o menu ainda ativo.
    // Entradas soft-deleted não devem bloquear uma nova importação do mesmo menu.
    const existingMenus = await db.contextMenus.where('menuId').anyOf(menuIds).toArray();
    return existingMenus.filter((menu) => !menu.isDeleted).map((menu) => menu.menuId);
}

/* -------------------------------------------------------
   ETAPA 3 — Importação Atômica (Tudo ou Nada)
   ------------------------------------------------------- */

export interface ImportResult {
    success: boolean;
    imported: number;
    errors: ValidationError[];
    conflicts: string[];
    log: string[];
}

type ExistingMenuState = {
    activeConflicts: string[];
    staleDeletedLocalIds: number[];
    existingMenusById: Map<string, ContextMenu>;
};

/** Converte ImportMenu → ContextMenu (modelo interno) */
function toContextMenu(imported: ImportMenu): Omit<ContextMenu, 'id'> {
    const now = new Date();
    return {
        menuId: imported.menu_id,
        menuName: imported.menu_name,
        description: imported.description || '',
        selectionMode: imported.selection_mode || 'single',
        options: (imported.options || []).map((opt) => ({
            label: opt.label || '',
            value: opt.value,
            subOptions: (opt.sub_options ?? []).map((sub) => ({
                label: sub.label,
                value: sub.value,
            })),
        })),
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
        syncStatus: 'pending',
    };
}

async function getExistingMenuState(menuIds: string[]): Promise<ExistingMenuState> {
    if (menuIds.length === 0) {
        return { activeConflicts: [], staleDeletedLocalIds: [], existingMenusById: new Map() };
    }

    const existingMenus = await db.contextMenus.where('menuId').anyOf(menuIds).toArray();

    return {
        activeConflicts: existingMenus.filter((menu) => !menu.isDeleted).map((menu) => menu.menuId),
        staleDeletedLocalIds: existingMenus
            .filter((menu): menu is ContextMenu & { id: number } => menu.isDeleted === true && typeof menu.id === 'number')
            .map((menu) => menu.id),
        existingMenusById: new Map(existingMenus.map((menu) => [menu.menuId, menu])),
    };
}

/**
 * Importa menus de um arquivo JSON.
 * Operação atômica: falha se qualquer validação ou conflito for detectado.
 *
 * @param file - arquivo .json
 * @param skipConflicts - se true, pula menus com ID já existente (default: false)
 */
export async function importMenusFromFile(
    file: File,
    skipConflicts = false
): Promise<ImportResult> {
    const log: string[] = [];
    const timestamp = new Date().toISOString();

    log.push(`[${timestamp}] Importação iniciada: ${file.name}`);

    /* 1. Ler arquivo */
    let raw: unknown;
    try {
        const text = await file.text();
        raw = JSON.parse(text);
        log.push(`[${timestamp}] JSON parseado com sucesso`);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        log.push(`[${timestamp}] ERRO: JSON inválido — ${msg}`);
        return {
            success: false,
            imported: 0,
            errors: [{ field: 'file', message: `JSON inválido: ${msg}` }],
            conflicts: [],
            log,
        };
    }

    /* 2. Validar schema */
    const validation = validateMenuImportFile(raw);
    if (!validation.valid || !validation.data) {
        log.push(`[${timestamp}] ERRO DE VALIDAÇÃO: ${validation.errors.length} erro(s) encontrado(s)`);
        for (const err of validation.errors) {
            log.push(`  → ${err.field}: ${err.message}`);
        }
        return {
            success: false,
            imported: 0,
            errors: validation.errors,
            conflicts: [],
            log,
        };
    }

    const data = validation.data;
    log.push(`[${timestamp}] Schema validado: v${data.version}, ${data.menus.length} menu(s)`);

    /* 3. Verificar conflitos de menu_id */
    const menuIds = data.menus.map((m) => m.menu_id);
    const { activeConflicts: conflicts, staleDeletedLocalIds, existingMenusById } = await getExistingMenuState(menuIds);

    /* 4. Importação atômica — transação Dexie */
    const menusToImport = skipConflicts
        ? data.menus.filter((m) => !conflicts.includes(m.menu_id))
        : data.menus;

    if (menusToImport.length === 0) {
        log.push(`[${timestamp}] Nenhum menu para importar (todos já existem)`);
        return {
            success: true,
            imported: 0,
            errors: [],
            conflicts,
            log,
        };
    }

    try {
        const menusToEnrich: Partial<ContextMenu>[] = [];
        for (const menu of menusToImport) {
            const contextMenu = toContextMenu(menu) as Partial<ContextMenu>;
            const existingMenu = existingMenusById.get(menu.menu_id);

            if (existingMenu) {
                contextMenu.id = existingMenu.id;
                contextMenu.remoteId = existingMenu.remoteId;
                contextMenu.createdAt = existingMenu.createdAt || contextMenu.createdAt;
                contextMenu.updatedAt = new Date();
                contextMenu.isDeleted = false;
            }
            menusToEnrich.push(contextMenu);
        }

        try {
            const savedRemotes = await saveMenusToSupabaseBulk(menusToEnrich);
            if (savedRemotes) {
                for (const contextMenu of menusToEnrich) {
                    const savedRemote = savedRemotes.find((r: { menu_id: string; id: number }) => r.menu_id === contextMenu.menuId);
                    if (savedRemote) {
                        contextMenu.remoteId = savedRemote.id;
                        contextMenu.syncStatus = 'synced';
                    }
                }
            }
        } catch (err) {
            console.error("Erro importando menus em lote no Supabase", err);
            // Continua para salvar localmente como 'pending' se falhar o sync
        }

        await db.transaction('rw', db.contextMenus, async () => {
            if (staleDeletedLocalIds.length > 0) {
                await db.contextMenus.bulkDelete(staleDeletedLocalIds);
            }
            await db.contextMenus.bulkPut(menusToEnrich as ContextMenu[]);
        });

        log.push(`[${timestamp}] SUCESSO: ${menusToImport.length} menu(s) importado(s)`);
        if (conflicts.length > 0 && !skipConflicts) {
            log.push(`[${timestamp}] ATUALIZAÇÃO: ${conflicts.length} menu(s) existente(s) foram atualizados pelo menu_id`);
        }
        for (const menu of menusToImport) {
            const optCount = menu.options.length;
            const subCount = menu.options.reduce((acc, o) => acc + (o.sub_options?.length ?? 0), 0);
            log.push(`  ✓ ${menu.menu_name} (${menu.menu_id}): ${optCount} opções, ${subCount} sub-opções`);
        }

        return {
            success: true,
            imported: menusToImport.length,
            errors: [],
            conflicts,
            log,
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        log.push(`[${timestamp}] ERRO NA GRAVAÇÃO: ${msg}`);
        return {
            success: false,
            imported: 0,
            errors: [{ field: 'database', message: `Erro ao gravar: ${msg}` }],
            conflicts: [],
            log,
        };
    }
}

/**
 * Exporta todos os menus de contexto no formato de importação (MenuImportSchema).
 * Permite exportar menus para reutilização em outros projetos.
 */
export async function exportMenusToJson(): Promise<MenuImportSchema> {
    const menus = await db.contextMenus.filter((menu) => !menu.isDeleted).toArray();

    return {
        version: '1.0',
        menus: menus.map((m) => ({
            menu_id: m.menuId,
            menu_name: m.menuName,
            description: m.description,
            selection_mode: m.selectionMode,
            options: (m.options || []).map((opt) => ({
                label: opt.label,
                value: opt.value,
                sub_options: (opt.subOptions || []).length > 0
                    ? (opt.subOptions || []).map((sub) => ({ label: sub.label, value: sub.value }))
                    : undefined,
            })),
        })),
    };
}
