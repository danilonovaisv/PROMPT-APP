// Implementations will live in src/models/outputSchema
import { normalizeOutputSchema, sanitizeUrlField, DEFAULT_OUTPUT_FORMAT } from '../src/models/outputSchema';
import { formatPromptAsMarkdown, toExportFormat } from '../src/utils/exportJson';
import { createPromptPayloadFromLegacyRecord } from '../src/models/promptSchema';

describe('normalizeOutputSchema', () => {
  it('fallbacks to markdown when formato is missing or unknown', () => {
    const normalized = normalizeOutputSchema({ formato: 'yaml', estrutura: '  test ' });
    expect(normalized.formato).toBe(DEFAULT_OUTPUT_FORMAT);
    expect(normalized.estrutura).toBe('test');
  });

  it('accepts imagem and code formats', () => {
    const image = normalizeOutputSchema({ formato: 'imagem', estrutura: 'scene: sunset' });
    const code = normalizeOutputSchema({ formato: 'code', estrutura: 'js code block' });
    expect(image.formato).toBe('imagem');
    expect(code.formato).toBe('code');
  });
});

describe('sanitizeUrlField', () => {
  it('trims and validates http/https URLs', () => {
    const result = sanitizeUrlField('  https://example.com/page  ');
    expect(result.value).toBe('https://example.com/page');
    expect(result.error).toBeUndefined();
  });

  it('returns undefined for empty strings', () => {
    const result = sanitizeUrlField('   ');
    expect(result.value).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  it('flags invalid URLs', () => {
    const result = sanitizeUrlField('notaurl');
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});

describe('toExportFormat with new schema', () => {
  const promptPayload = createPromptPayloadFromLegacyRecord({
    title: 'Teste',
    systemRole: 'role',
    task: 'task',
    context: 'ctx',
    outputSchema: { formato: 'image', estrutura: 'scene' },
    referenceUrl: 'https://ref.com',
  });

  const basePrompt = {
    id: 1,
    categoryId: 1,
    title: 'Teste',
    promptPayload,
    schemaVersion: promptPayload.meta.schema_version,
    language: promptPayload.meta.language,
    outputFormat: promptPayload.output_contract.format,
    fewShotExamples: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    referenceUrl: 'https://ref.com',
  };

  it('exports canonical template payload with normalized format', () => {
    const exported = toExportFormat(basePrompt);
    expect(exported.meta.template_name).toBe('Teste');
    expect(exported.output_contract.format).toBe('image');
  });
});

describe('formatPromptAsMarkdown', () => {
  it('renders structured markdown with dynamic parameters and clean rules section', () => {
    const template = {
      meta: {
        template_id: 'ghost_template',
        template_name: 'Ghost Template',
        template_type: 'generic_prompt',
        schema_version: '1.0.0',
        language: 'pt-BR',
        status: 'draft',
      },
      prompt_definition: {
        system_role: 'Senior UX Writer',
        task: 'Escrever uma proposta editorial para a landing page.',
        context: 'Projeto premium com foco em clareza e ritmo visual.',
        constraints: ['Manter linguagem objetiva', 'Priorizar clareza'],
        negative_prompt: ['Não invente dados'],
        few_shot_examples: [],
      },
      menu_ids: ['tone'],
      menu_definitions: [
        {
          menu_id: 'tone',
          menu_name: 'Tom',
          selection_mode: 'single',
          options: [
            {
              label: 'Formal',
              value: 'formal',
              sub_options: [{ label: 'Editorial', value: 'editorial' }],
            },
          ],
        },
      ],
      output_contract: {
        format: 'markdown',
        language: 'pt-BR',
        strict_mode: true,
        required_fields: [],
        response_rules: [],
      },
    } as any;

    const compiledPayload = {
      template_id: 'ghost_template',
      meta: {
        template_name: 'Ghost Template',
        template_type: 'generic_prompt',
        schema_version: '1.0.0',
        language: 'pt-BR',
      },
      compiled_context: {
        menu_interpretation: {
          tone: {
            selected_options: ['formal'],
            selected_sub_options: ['editorial'],
            selections: [],
          },
        },
        free_inputs: {
          audience: 'Diretores de marketing',
        },
      },
      prompt_definition: template.prompt_definition,
      output_contract: template.output_contract,
    } as any;

    const markdown = formatPromptAsMarkdown(template, compiledPayload);

    expect(markdown).toContain('# ROLE: Senior UX Writer');
    expect(markdown).toContain('## 1. CONTEXT & TASK');
    expect(markdown).toContain('Projeto premium com foco em clareza e ritmo visual.');
    expect(markdown).toContain('Escrever uma proposta editorial para a landing page.');
    expect(markdown).toContain('## 2. DYNAMIC PARAMETERS');
    expect(markdown).toContain('- **Tom**: Formal (Editorial)');
    expect(markdown).toContain('- **audience**: Diretores de marketing');
    expect(markdown).toContain('## 3. RULES & CONSTRAINTS');
    expect(markdown).toContain('- Manter linguagem objetiva');
    expect(markdown).toContain('- Priorizar clareza');
    expect(markdown).toContain('- Não invente dados');
    expect(markdown).not.toContain('❌');
    expect(markdown).not.toContain('## 4. OUTPUT CONTRACT');
  });
});
