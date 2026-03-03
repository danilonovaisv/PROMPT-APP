import type { FewShotExample } from '@/models/types';
/**
 * Normaliza e filtra exemplos few-shot, garantindo type safety
 * Remove exemplos com input e output vazios/inválidos
 *
 * @param examples - Array de exemplos (pode ser unknown para robustez)
 * @param opts - Opções de normalização
 * @param opts.coercePrimitives - Se true, converte números/booleanos para string (default: false)
 * @returns Array filtrado de exemplos válidos
 *
 * @example
 * // Strict mode (default)
 * normalizeFewShotExamples([
 *   { input: "hello", output: "world" },  // ✓ mantém
 *   { input: "  ", output: "" },          // ✗ remove
 *   { input: 123, output: "ok" },         // ✗ remove (número)
 * ]) // => [{ input: "hello", output: "world" }]
 *
 * @example
 * // Com coerção
 * normalizeFewShotExamples([
 *   { input: 123, output: "ok" },
 * ], { coercePrimitives: true }) // => [{ input: "123", output: "ok" }]
 */
export declare function normalizeFewShotExamples(examples: unknown, opts?: {
    coercePrimitives?: boolean;
}): FewShotExample[];
/**
 * Versão simplificada para uso direto em filters
 * Usa strict mode (sem coerção)
 */
export declare function isValidFewShotExample(ex: unknown): ex is FewShotExample;
