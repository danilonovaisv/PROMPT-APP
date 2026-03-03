import { z } from 'zod';

export const OUTPUT_FORMATS = ['texto', 'json', 'markdown', 'imagem', 'code'] as const;
export const DEFAULT_OUTPUT_FORMAT = 'markdown';

export const OutputFormatSchema = z.enum(OUTPUT_FORMATS);

export const OutputSchemaZ = z.object({
  formato: OutputFormatSchema.default(DEFAULT_OUTPUT_FORMAT),
  estrutura: z.string().trim().max(2000).default(''),
});

export type OutputFormat = z.infer<typeof OutputFormatSchema>;
export type OutputSchemaDTO = z.infer<typeof OutputSchemaZ>;

type MaybeOutputSchema = Partial<{ formato: unknown; estrutura: unknown }> | undefined | null;

const formatHints: Record<OutputFormat, string> = {
  texto: 'Texto puro. Entregue apenas o conteúdo solicitado, sem marcação.',
  json: 'JSON válido, chaves fixas, sem comentários. Use aspas duplas e encoding UTF-8.',
  markdown: 'Markdown estruturado com headings claros, listas quando ajudarem e links seguros.',
  imagem: 'Prompt de geração de imagem: descreva sujeito, cena, estilo, iluminação e restrições de segurança.',
  code: 'Bloco de código executável com fences e linguagem especificada; inclua apenas o código solicitado.',
};

export function getFormatHint(format: OutputFormat): string {
  return formatHints[format] || formatHints[DEFAULT_OUTPUT_FORMAT];
}

export function normalizeOutputSchema(raw: MaybeOutputSchema): OutputSchemaDTO {
  const formatoRaw = typeof raw?.formato === 'string' ? raw.formato.toLowerCase() : undefined;
  const formato: OutputFormat = OUTPUT_FORMATS.includes((formatoRaw as OutputFormat))
    ? (formatoRaw as OutputFormat)
    : DEFAULT_OUTPUT_FORMAT;

  const estrutura = typeof raw?.estrutura === 'string' ? raw.estrutura.trim() : '';

  return { formato, estrutura };
}

export function sanitizeUrlField(raw: unknown): { value?: string; error?: string } {
  if (raw === undefined || raw === null) return { value: undefined };
  if (typeof raw !== 'string') return { error: 'URL deve ser texto simples' };

  const trimmed = raw.trim();
  if (!trimmed) return { value: undefined };
  if (trimmed.length > 2048) return { error: 'URL ultrapassa 2048 caracteres' };

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { error: 'Use apenas http ou https' };
    }
    return { value: trimmed };
  } catch (err) {
    return { error: 'URL inválida' };
  }
}
