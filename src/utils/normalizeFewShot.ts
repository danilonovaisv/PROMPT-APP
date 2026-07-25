/* ======================================================
   Normalização de Few-Shot Examples com Type Guards
   ====================================================== */

import type { FewShotExample } from "@/models/types";

/**
 * Type guard: verifica se o valor é uma string não-vazia após trim
 */
const hasNonEmptyTrimmedString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

/**
 * Converte valor para string não-vazia ou null, com coerção opcional
 * @param v - Valor a ser convertido
 * @param coerce - Se true, converte números e booleanos para string
 * @returns String não-vazia ou null
 */
const toNonEmptyString = (v: unknown, coerce: boolean): string | null => {
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  if (coerce && (typeof v === "number" || typeof v === "boolean")) {
    const t = String(v).trim();
    return t.length ? t : null;
  }
  return null;
};

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
export function normalizeFewShotExamples(
  examples: unknown,
  opts: { coercePrimitives?: boolean } = {},
): FewShotExample[] {
  const coerce = !!opts.coercePrimitives;

  if (!Array.isArray(examples)) return [];

  return (examples as FewShotExample[])
    .map((d) => {
      const inputType = typeof d?.input;
      const outputType = typeof d?.output;

      // Rejeita tipos inválidos quando não houver coerção
      if (!coerce) {
        if (
          (d?.input != null && inputType !== "string") ||
          (d?.output != null && outputType !== "string")
        ) {
          return null;
        }
      } else {
        // Em modo coerção, ainda rejeitamos entradas não coerentes (objetos/funções) no input
        if (
          d?.input != null &&
          (inputType === "object" || inputType === "function")
        ) {
          return null;
        }
        // Saída como objeto/array é permitida (será tratada como string vazia)
        if (d?.output != null && outputType === "function") {
          return null;
        }
      }

      // Log de warning em dev — works in both VITE (browser) and Jest (Node)
      // eslint-disable-VITE-line @typescript-eslint/no-explicit-any
      const isDev =
        (globalThis as any)?.process?.env?.["NODE_ENV"] === "development";
      if (isDev) {
        if (d?.input != null && typeof d.input !== "string" && !coerce) {
          console.warn(
            "[normalizeFewShot] input non-string detected:",
            d.input,
          );
        }
        if (d?.output != null && typeof d.output !== "string" && !coerce) {
          console.warn(
            "[normalizeFewShot] output non-string detected:",
            d.output,
          );
        }
      }

      const input = toNonEmptyString(d?.input, coerce);
      const output = toNonEmptyString(d?.output, coerce);

      // Retorna null se ambos forem inválidos (será filtrado)
      if (!input && !output) return null;

      return {
        input: input || "",
        output: output || "",
      };
    })
    .filter((d): d is FewShotExample => d !== null);
}

/**
 * Versão simplificada para uso direto em filters
 * Usa strict mode (sem coerção)
 */
export function isValidFewShotExample(ex: unknown): ex is FewShotExample {
  if (!ex || typeof ex !== "object") return false;
  const example = ex as FewShotExample;
  const inputOk = hasNonEmptyTrimmedString(example?.input);
  const outputOk = hasNonEmptyTrimmedString(example?.output);
  return inputOk || outputOk;
}
