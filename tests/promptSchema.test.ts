import { describe, expect, it } from '@jest/globals';

import {
  CompiledPromptPayloadSchema,
  MenuDefinitionSchema,
  TemplatePayloadSchema,
  UserSelectionSchema,
  compilePromptPayload,
  createEmptyTemplatePayload,
  createTemplatePayloadFromLegacyRecord,
  sanitizeUserSelection,
} from '../src/models/promptSchema';

describe('TemplatePayloadSchema', () => {
  it('rejects unknown top-level properties', () => {
    const result = TemplatePayloadSchema.safeParse({
      meta: {
        template_id: 'scene_generator_v1',
        template_name: 'Gerador de cenas',
        template_type: 'scene_generation',
        schema_version: '1.0.0',
        language: 'pt-BR',
        status: 'active',
      },
      prompt_definition: {
        system_role: 'Você é um diretor criativo',
        task: 'Gerar cenas',
        context: 'Aplicar a peça em um contexto real',
        constraints: [],
        negative_prompt: [],
        few_shot_examples: [],
      },
      menu_definitions: [],
      output_contract: {
        format: 'json',
        language: 'pt-BR',
        strict_mode: true,
        required_fields: [],
        response_rules: [],
      },
      unexpected: true,
    });

    expect(result.success).toBe(false);
  });
});

describe('sanitizeUserSelection', () => {
  const template = TemplatePayloadSchema.parse({
    meta: {
      template_id: 'scene_generator_v1',
      template_name: 'Gerador de cenas',
      template_type: 'scene_generation',
      schema_version: '1.0.0',
      language: 'pt-BR',
      status: 'active',
    },
    prompt_definition: {
      system_role: 'Você é um diretor criativo',
      task: 'Gerar cenas',
      context: 'Aplicar a peça em um contexto real',
      constraints: [],
      negative_prompt: [],
      few_shot_examples: [],
    },
    menu_definitions: [
      MenuDefinitionSchema.parse({
        menu_id: 'personagens',
        menu_name: 'Personagens',
        description: 'Define a composição humana da cena',
        selection_mode: 'single',
        required: true,
        options: [
          {
            label: '1 pessoa',
            value: 'uma_pessoa',
            sub_options: [
              { label: 'Jovem adulto', value: '1p_jovem_adulto_18_29' },
            ],
          },
          {
            label: 'Sem personagens',
            value: 'sem_personagens',
            sub_options: [],
          },
        ],
      }),
      MenuDefinitionSchema.parse({
        menu_id: 'ambiente',
        menu_name: 'Ambiente',
        description: 'Onde a peça aparece',
        selection_mode: 'multiple',
        required: false,
        options: [
          {
            label: 'Loja',
            value: 'loja',
            sub_options: [{ label: 'Vitrine', value: 'vitrine' }],
          },
          {
            label: 'Rua',
            value: 'rua',
            sub_options: [],
          },
        ],
      }),
    ],
    output_contract: {
      format: 'json',
      language: 'pt-BR',
      strict_mode: true,
      required_fields: ['scene_type'],
      response_rules: ['Return only one final JSON object'],
    },
  });

  it('keeps one option for single menus, filters invalid references and enforces required menus', () => {
    const sanitized = sanitizeUserSelection(
      template,
      UserSelectionSchema.parse({
        template_id: 'scene_generator_v1',
        selected_menus: [
          {
            menu_id: 'personagens',
            selected_options: [
              {
                option_value: 'uma_pessoa',
                selected_sub_options: ['1p_jovem_adulto_18_29', 'invalid_sub'],
              },
              {
                option_value: 'sem_personagens',
                selected_sub_options: [],
              },
            ],
          },
          {
            menu_id: 'ambiente',
            selected_options: [
              {
                option_value: 'loja',
                selected_sub_options: ['vitrine'],
              },
              {
                option_value: 'rua',
                selected_sub_options: ['invalid_sub'],
              },
            ],
          },
          {
            menu_id: 'inexistente',
            selected_options: [
              {
                option_value: 'ignorar',
                selected_sub_options: [],
              },
            ],
          },
        ],
        free_inputs: {
          user_scene_description: 'Produto em destaque',
        },
      })
    );

    expect(sanitized.selected_menus).toEqual([
      {
        menu_id: 'personagens',
        selected_options: [
          {
            option_value: 'sem_personagens',
            selected_sub_options: [],
          },
        ],
      },
      {
        menu_id: 'ambiente',
        selected_options: [
          {
            option_value: 'loja',
            selected_sub_options: ['vitrine'],
          },
          {
            option_value: 'rua',
            selected_sub_options: [],
          },
        ],
      },
    ]);
  });
});

describe('compilePromptPayload', () => {
  it('builds a deterministic compiled payload from template + selection', () => {
    const template = TemplatePayloadSchema.parse({
      meta: {
        template_id: 'scene_generator_v1',
        template_name: 'Gerador de cenas',
        template_type: 'scene_generation',
        schema_version: '1.0.0',
        language: 'pt-BR',
        status: 'active',
      },
      prompt_definition: {
        system_role: 'Você é um diretor criativo',
        task: 'Gerar cenas publicitárias',
        context: 'Aplicar a peça em contexto real',
        constraints: ['Não alterar a arte'],
        negative_prompt: ['Não inventar novos textos'],
        few_shot_examples: [],
      },
      menu_definitions: [
        {
          menu_id: 'personagens',
          menu_name: 'Personagens',
          description: 'Quem aparece',
          selection_mode: 'multiple',
          required: false,
          options: [
            {
              label: '1 pessoa',
              value: 'uma_pessoa',
              sub_options: [
                { label: 'Jovem adulto', value: '1p_jovem_adulto_18_29' },
              ],
            },
            {
              label: 'Interação com a peça',
              value: 'interacao_com_peca',
              sub_options: [
                { label: 'Olhando para a peça', value: 'int_olhando_para_peca' },
              ],
            },
          ],
        },
      ],
      output_contract: {
        format: 'json',
        language: 'pt-BR',
        strict_mode: true,
        required_fields: ['scene_type', 'scenes'],
        response_rules: ['Return only one final JSON object'],
      },
    });

    const compiled = compilePromptPayload(
      template,
      UserSelectionSchema.parse({
        template_id: 'scene_generator_v1',
        selected_menus: [
          {
            menu_id: 'personagens',
            selected_options: [
              {
                option_value: 'uma_pessoa',
                selected_sub_options: ['1p_jovem_adulto_18_29'],
              },
              {
                option_value: 'interacao_com_peca',
                selected_sub_options: ['int_olhando_para_peca'],
              },
            ],
          },
        ],
        free_inputs: {
          user_scene_description: 'Produto em close sobre mesa de café',
          scene_type: 'lifestyle',
        },
      })
    );

    expect(CompiledPromptPayloadSchema.parse(compiled)).toEqual({
      template_id: 'scene_generator_v1',
      meta: {
        template_name: 'Gerador de cenas',
        template_type: 'scene_generation',
        schema_version: '1.0.0',
        language: 'pt-BR',
      },
      compiled_context: {
        menu_interpretation: {
          personagens: {
            selected_options: ['uma_pessoa', 'interacao_com_peca'],
            selected_sub_options: ['1p_jovem_adulto_18_29', 'int_olhando_para_peca'],
            selections: [
              {
                option_value: 'uma_pessoa',
                option_label: '1 pessoa',
                selected_sub_options: [
                  {
                    value: '1p_jovem_adulto_18_29',
                    label: 'Jovem adulto',
                  },
                ],
              },
              {
                option_value: 'interacao_com_peca',
                option_label: 'Interação com a peça',
                selected_sub_options: [
                  {
                    value: 'int_olhando_para_peca',
                    label: 'Olhando para a peça',
                  },
                ],
              },
            ],
          },
        },
        free_inputs: {
          user_scene_description: 'Produto em close sobre mesa de café',
          scene_type: 'lifestyle',
        },
      },
      prompt_definition: {
        system_role: 'Você é um diretor criativo',
        task: 'Gerar cenas publicitárias',
        context: 'Aplicar a peça em contexto real',
        constraints: ['Não alterar a arte'],
        negative_prompt: ['Não inventar novos textos'],
        few_shot_examples: [],
      },
      output_contract: {
        format: 'json',
        language: 'pt-BR',
        strict_mode: true,
        required_fields: ['scene_type', 'scenes'],
        response_rules: ['Return only one final JSON object'],
      },
    });
  });
});

describe('createTemplatePayloadFromLegacyRecord', () => {
  it('migrates legacy prompt fields into the template-centric contract', () => {
    const template = createTemplatePayloadFromLegacyRecord({
      title: 'Auditoria Ghost',
      systemRole: 'Você é um auditor sênior',
      task: 'Auditar o app inteiro',
      context: 'Aplicar checklist editorial e técnico.',
      constraints: ['Priorizar acessibilidade'],
      negativePrompt: ['Não reescrever copy'],
      outputSchema: {
        formato: 'markdown',
        estrutura: 'overview, findings',
      },
      schemaVersion: '1.0.0',
      language: 'pt-BR',
    });

    expect(template.meta.template_name).toBe('Auditoria Ghost');
    expect(template.meta.template_type).toBe('generic_prompt');
    expect(template.prompt_definition.system_role).toBe('Você é um auditor sênior');
    expect(template.prompt_definition.task).toBe('Auditar o app inteiro');
    expect(template.prompt_definition.context).toBe('Aplicar checklist editorial e técnico.');
    expect(template.prompt_definition.constraints).toEqual(['Priorizar acessibilidade']);
    expect(template.prompt_definition.negative_prompt).toEqual(['Não reescrever copy']);
    expect(template.output_contract.format).toBe('markdown');
    expect(template.output_contract.response_rules).toEqual(['overview', 'findings']);
  });

  it('creates a valid empty template payload by default', () => {
    const template = createEmptyTemplatePayload('Novo Template');

    expect(template.meta.template_name).toBe('Novo Template');
    expect(template.menu_definitions).toEqual([]);
    expect(template.output_contract.format).toBe('markdown');
  });
});
