/**
 * schemaValidation.ts
 * Validação semântica rígida para importação de templates.
 */

export interface ValidationError {
  field: string;
  code: 'EMPTY' | 'TOO_SHORT' | 'DUPLICATE_KEY' | 'INVALID_FORMAT' | 'REQUIRED';
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  normalized: Record<string, unknown> | null;
}

const MIN_TITLE_LENGTH = 3;
const MIN_CONTENT_LENGTH = 10;

function isSemanticallyEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  const placeholderPatterns = [
    /^\{\{.*\}\}$/,
    /^\$\{.*\}$/,
    /^\[.*\]$/,
    /^<.*>$/,
    /^lorem\s*ipsum/i,
    /^placeholder/i,
    /^example/i,
    /^sample/i,
    /^test/i,
    /^\.*$/,
    /^_+$/,
  ];
  return placeholderPatterns.some(p => p.test(trimmed));
}

function validateTextField(
  value: unknown,
  fieldName: string,
  minLength: number,
  options: { allowEmpty?: boolean } = {}
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!options.allowEmpty && isSemanticallyEmpty(value)) {
    errors.push({
      field: fieldName,
      code: 'EMPTY',
      message: `O campo "${fieldName}" está vazio ou contém apenas espaços/placeholders. Insira um valor significativo.`,
      severity: 'error',
    });
    return errors;
  }
  if (typeof value === 'string' && value.trim().length > 0 && value.trim().length < minLength) {
    errors.push({
      field: fieldName,
      code: 'TOO_SHORT',
      message: `O campo "${fieldName}" deve ter pelo menos ${minLength} caracteres significativos.`,
      severity: 'error',
    });
  }
  return errors;
}

export function validatePromptDefinition(definition: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (!definition || typeof definition !== 'object') {
    errors.push({ field: 'prompt_definition', code: 'REQUIRED', message: 'A definição do prompt é obrigatória.', severity: 'error' });
    return { valid: false, errors, normalized: null };
  }
  const def = definition as Record<string, unknown>;
  errors.push(...validateTextField(def.title, 'title', MIN_TITLE_LENGTH));
  errors.push(...validateTextField(def.system_prompt, 'system_prompt', MIN_CONTENT_LENGTH));
  errors.push(...validateTextField(def.user_prompt, 'user_prompt', MIN_CONTENT_LENGTH));

  if (def.memory && Array.isArray(def.memory)) {
    const seenKeys = new Set<string>();
    for (let i = 0; i < def.memory.length; i++) {
      const mem = def.memory[i] as Record<string, unknown>;
      const key = mem.key;
      if (isSemanticallyEmpty(key)) {
        errors.push({ field: `memory[${i}].key`, code: 'EMPTY', message: `A chave da memória #${i + 1} está vazia.`, severity: 'error' });
      } else if (typeof key === 'string') {
        const normalizedKey = key.trim().toLowerCase();
        if (seenKeys.has(normalizedKey)) {
          errors.push({ field: `memory[${i}].key`, code: 'DUPLICATE_KEY', message: `A chave "${key}" está duplicada na memória fixa.`, severity: 'error' });
        }
        seenKeys.add(normalizedKey);
      }
      if (isSemanticallyEmpty(mem.value)) {
        errors.push({ field: `memory[${i}].value`, code: 'EMPTY', message: `O valor da memória "${key}" está vazio.`, severity: 'warning' });
      }
    }
  }

  const hasBlockingErrors = errors.some(e => e.severity === 'error');
  return { valid: !hasBlockingErrors, errors, normalized: hasBlockingErrors ? null : def };
}

export function validateImportPayload(payload: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (!payload || typeof payload !== 'object') {
    errors.push({ field: 'root', code: 'REQUIRED', message: 'O payload de importação é inválido ou vazio.', severity: 'error' });
    return { valid: false, errors, normalized: null };
  }
  const p = payload as Record<string, unknown>;
  if (!p.meta || typeof p.meta !== 'object') {
    errors.push({ field: 'meta', code: 'REQUIRED', message: 'A seção "meta" é obrigatória no payload.', severity: 'error' });
  } else {
    const meta = p.meta as Record<string, unknown>;
    errors.push(...validateTextField(meta.name, 'meta.name', MIN_TITLE_LENGTH));
  }
  if (!p.prompt_definition) {
    errors.push({ field: 'prompt_definition', code: 'REQUIRED', message: 'A seção "prompt_definition" é obrigatória.', severity: 'error' });
  } else {
    const defResult = validatePromptDefinition(p.prompt_definition);
    errors.push(...defResult.errors);
  }
  const hasBlockingErrors = errors.some(e => e.severity === 'error');
  return { valid: !hasBlockingErrors, errors, normalized: hasBlockingErrors ? null : p };
}

export function formatValidationErrors(errors: ValidationError[]): string {
  const blocking = errors.filter(e => e.severity === 'error');
  const warnings = errors.filter(e => e.severity === 'warning');
  let message = '';
  if (blocking.length > 0) {
    message += `❌ ${blocking.length} erro(s) crítico(s) encontrado(s):\n`;
    message += blocking.map(e => `   • ${e.field}: ${e.message}`).join('\n');
    message += '\n\n';
  }
  if (warnings.length > 0) {
    message += `⚠️ ${warnings.length} aviso(s):\n`;
    message += warnings.map(e => `   • ${e.field}: ${e.message}`).join('\n');
  }
  return message.trim();
}
