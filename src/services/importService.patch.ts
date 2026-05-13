/**
 * importService.patch.ts
 * Modificações no importService para integrar validação semântica.
 * Aplicar como diff ou merge manual no arquivo src/services/importService.ts
 */

// ===== ADICIONAR AO TOPO DO ARQUIVO =====
import { validateImportPayload, formatValidationErrors, ValidationResult } from '../utils/schemaValidation';

// ===== MODIFICAR A FUNÇÃO parsePromptPayload =====
/**
 * Parse e validação semântica do payload de importação.
 * Rejeita templates semanticamente vazios com erro explicável.
 */
export function parsePromptPayload(rawPayload: unknown): {
  success: boolean;
  data?: PromptPayload;
  validation?: ValidationResult;
  error?: string;
} {
  // 1. Parse estrutural (JSON válido, shape correto)
  let parsed: unknown;
  try {
    parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
  } catch (e) {
    return {
      success: false,
      error: 'O arquivo não contém JSON válido. Verifique a sintaxe do arquivo.',
    };
  }

  // 2. Validação semântica rigorosa
  const validation = validateImportPayload(parsed);

  if (!validation.valid) {
    return {
      success: false,
      validation,
      error: formatValidationErrors(validation.errors),
    };
  }

  // 3. Migração (apenas após validação semântica passar)
  const migrated = migrateIfNeeded(validation.normalized!);

  // 4. Parse final com schema (zod/yup/etc)
  const schemaResult = PromptDefinitionSchema.safeParse(migrated);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Erro de schema após migração: ' + schemaResult.error.message,
    };
  }

  return {
    success: true,
    data: schemaResult.data,
  };
}

// ===== MODIFICAR A FUNÇÃO DE IMPORT =====
/**
 * Fluxo de importação com validação semântica e feedback de erro na UI.
 */
export async function importTemplate(
  fileContent: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const parseResult = parsePromptPayload(fileContent);

  if (!parseResult.success) {
    // Retorna erro estruturado para a UI exibir toast/modal
    return {
      success: false,
      error: parseResult.error,
      validationErrors: parseResult.validation?.errors || [],
      stage: 'semantic_validation',
    };
  }

  // Continua com persistência no IndexedDB...
  try {
    const db = await getDB();
    const id = await db.prompts.add({
      ...parseResult.data,
      importedAt: new Date().toISOString(),
      source: 'import',
    });

    return {
      success: true,
      promptId: id,
      stage: 'persisted',
    };
  } catch (dbError) {
    return {
      success: false,
      error: 'Falha ao salvar no banco local: ' + (dbError as Error).message,
      stage: 'persistence',
    };
  }
}
