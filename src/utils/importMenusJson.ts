/* ======================================================
   Importação de Menus de Contexto via JSON
   Schema v1.0 — Validação + Importação Atômica
   ====================================================== */

import { db } from '@/db/database';
import type { ContextMenu } from '@/models/types';

/* -------------------------------------------------------
   ETAPA 1 — Schema de Importação
   ------------------------------------------------------- */

/** Sub-opção no schema de importação */
export interface ImportSubOption {
    label: string;
    value: string;
}

/** Opção principal no schema de importação */
export interface ImportOption {
    label: string;
    value: string;
    sub_options?: ImportSubOption[];
}

/** Menu individual no schema de importação */
export interface ImportMenu {
    menu_id: string;
    menu_name: string;
    description: string;
    options: ImportOption[];
}

/** Schema raiz do arquivo de importação */
export interface MenuImportSchema {
    version: string;
    menus: ImportMenu[];
}

/* -------------------------------------------------------
   ETAPA 2 — Validação Estrita
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

/** Verifica se um valor é um objeto não-nulo */
function isObject(val: unknown): val is Record<string, unknown> {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/** Valida uma sub-opção individual */
function validateSubOption(sub: unknown, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!isObject(sub)) {
        errors.push({ field: path, message: 'Sub-opção deve ser um objeto' });
        return errors;
    }
    if (typeof sub.label !== 'string' || !sub.label.trim()) {
        errors.push({ field: `${path}.label`, message: 'label é obrigatório e deve ser string não-vazia' });
    }
    if (typeof sub.value !== 'string' || !sub.value.trim()) {
        errors.push({ field: `${path}.value`, message: 'value é obrigatório e deve ser string não-vazia' });
    }
    return errors;
}

/** Valida uma opção individual */
function validateOption(opt: unknown, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!isObject(opt)) {
        errors.push({ field: path, message: 'Opção deve ser um objeto' });
        return errors;
    }
    if (typeof opt.label !== 'string' || !opt.label.trim()) {
        errors.push({ field: `${path}.label`, message: 'label é obrigatório e deve ser string não-vazia' });
    }
    if (typeof opt.value !== 'string' || !opt.value.trim()) {
        errors.push({ field: `${path}.value`, message: 'value é obrigatório e deve ser string não-vazia' });
    }
    if (opt.sub_options !== undefined) {
        if (!Array.isArray(opt.sub_options)) {
            errors.push({ field: `${path}.sub_options`, message: 'sub_options deve ser um array' });
        } else {
            for (let i = 0; i < opt.sub_options.length; i++) {
                errors.push(...validateSubOption(opt.sub_options[i], `${path}.sub_options[${i}]`));
            }
        }
    }
    return errors;
}

/** Valida um menu individual */
function validateMenu(menu: unknown, path: string, seenIds: Set<string>): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!isObject(menu)) {
        errors.push({ field: path, message: 'Menu deve ser um objeto' });
        return errors;
    }

    if (typeof menu.menu_id !== 'string' || !menu.menu_id.trim()) {
        errors.push({ field: `${path}.menu_id`, message: 'menu_id é obrigatório e deve ser string não-vazia' });
    } else if (seenIds.has(menu.menu_id as string)) {
        errors.push({ field: `${path}.menu_id`, message: `menu_id "${menu.menu_id}" duplicado no arquivo` });
    } else {
        seenIds.add(menu.menu_id as string);
    }

    if (typeof menu.menu_name !== 'string' || !menu.menu_name.trim()) {
        errors.push({ field: `${path}.menu_name`, message: 'menu_name é obrigatório e deve ser string não-vazia' });
    }

    if (typeof menu.description !== 'string') {
        errors.push({ field: `${path}.description`, message: 'description é obrigatório e deve ser string' });
    }

    if (!Array.isArray(menu.options)) {
        errors.push({ field: `${path}.options`, message: 'options é obrigatório e deve ser um array' });
    } else {
        for (let i = 0; i < menu.options.length; i++) {
            errors.push(...validateOption(menu.options[i], `${path}.options[${i}]`));
        }
    }

    return errors;
}

/** Valida o JSON completo contra o schema de importação */
export function validateMenuImportFile(raw: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    if (!isObject(raw)) {
        return {
            valid: false,
            errors: [{ field: 'root', message: 'O arquivo deve conter um objeto JSON' }],
            data: null,
        };
    }

    /* version (obrigatório) */
    if (typeof raw.version !== 'string' || !raw.version.trim()) {
        errors.push({ field: 'version', message: 'Campo "version" é obrigatório (ex: "1.0")' });
    }

    /* menus (obrigatório, array) */
    if (!Array.isArray(raw.menus)) {
        errors.push({ field: 'menus', message: 'Campo "menus" é obrigatório e deve ser um array' });
        return { valid: false, errors, data: null };
    }

    if (raw.menus.length === 0) {
        errors.push({ field: 'menus', message: 'O array "menus" não pode estar vazio' });
    }

    const seenIds = new Set<string>();
    for (let i = 0; i < raw.menus.length; i++) {
        errors.push(...validateMenu(raw.menus[i], `menus[${i}]`, seenIds));
    }

    if (errors.length > 0) {
        return { valid: false, errors, data: null };
    }

    return { valid: true, errors: [], data: raw as unknown as MenuImportSchema };
}

/** Verifica conflitos com menus existentes no banco */
export async function checkMenuIdConflicts(menuIds: string[]): Promise<string[]> {
    const conflicts: string[] = [];
    for (const menuId of menuIds) {
        const existing = await db.contextMenus.where('menuId').equals(menuId).first();
        if (existing) {
            conflicts.push(menuId);
        }
    }
    return conflicts;
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

/** Converte ImportMenu → ContextMenu (modelo interno) */
function toContextMenu(imported: ImportMenu): Omit<ContextMenu, 'id'> {
    const now = new Date();
    return {
        menuId: imported.menu_id,
        menuName: imported.menu_name,
        description: imported.description,
        options: imported.options.map((opt) => ({
            label: opt.label,
            value: opt.value,
            subOptions: (opt.sub_options ?? []).map((sub) => ({
                label: sub.label,
                value: sub.value,
            })),
        })),
        createdAt: now,
        updatedAt: now,
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
    const conflicts = await checkMenuIdConflicts(menuIds);

    if (conflicts.length > 0 && !skipConflicts) {
        log.push(`[${timestamp}] CONFLITO: menu_id(s) já existente(s): ${conflicts.join(', ')}`);
        return {
            success: false,
            imported: 0,
            errors: conflicts.map((id) => ({
                field: `menus[menu_id="${id}"]`,
                message: `Menu com ID "${id}" já existe no sistema`,
            })),
            conflicts,
            log,
        };
    }

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
        await db.transaction('rw', db.contextMenus, async () => {
            for (const menu of menusToImport) {
                await db.contextMenus.add(toContextMenu(menu) as ContextMenu);
            }
        });

        log.push(`[${timestamp}] SUCESSO: ${menusToImport.length} menu(s) importado(s)`);
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
    const menus = await db.contextMenus.toArray();

    return {
        version: '1.0',
        menus: menus.map((m) => ({
            menu_id: m.menuId,
            menu_name: m.menuName,
            description: m.description,
            options: m.options.map((opt) => ({
                label: opt.label,
                value: opt.value,
                sub_options: opt.subOptions.length > 0
                    ? opt.subOptions.map((sub) => ({ label: sub.label, value: sub.value }))
                    : undefined,
            })),
        })),
    };
}
