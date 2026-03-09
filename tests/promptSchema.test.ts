import { describe, expect, it } from '@jest/globals';

import {
  MenuDefinitionSchema,
  PromptContractSchema,
  createPromptPayloadFromLegacyRecord,
  sanitizeSelectedOptions,
} from '../src/models/promptSchema';

describe('PromptContractSchema', () => {
  it('rejects unknown top-level properties', () => {
    const result = PromptContractSchema.safeParse({
      meta: {
        prompt_id: 'prompt_app_audit',
        name: 'Audit prompt',
        schema_version: '1.0.0',
        language: 'pt-BR',
        owner: 'webapp',
      },
      role: {
        id: 'senior_auditor',
        description: 'Audita o app',
      },
      objective: {
        task: 'Executar auditoria',
        focus: [],
        priority_order: [],
      },
      project: {
        name: 'PROMPT-APP',
        production_url: 'https://prompt-app-dan.netlify.app',
        repository_url: '',
        target_environment: ['web_desktop'],
        app_type: 'prompt_management_webapp',
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
      },
      unexpected: true,
    });

    expect(result.success).toBe(false);
  });
});

describe('sanitizeSelectedOptions', () => {
  const menuDefinitions = [
    MenuDefinitionSchema.parse({
      id: 'audit_type',
      label: 'Audit Type',
      selection_mode: 'single',
      options: [
        {
          value: 'structure',
          label: 'Structure',
          sub_options: [
            { value: 'server_client_boundaries', label: 'Server/Client Boundaries' },
          ],
        },
        {
          value: 'seo',
          label: 'SEO',
          sub_options: [],
        },
      ],
    }),
    MenuDefinitionSchema.parse({
      id: 'scope',
      label: 'Scope',
      selection_mode: 'multiple',
      options: [
        {
          value: 'admin',
          label: 'Admin',
          sub_options: [
            { value: 'publish_view', label: 'Publish View' },
          ],
        },
        {
          value: 'landing_pages',
          label: 'Landing Pages',
          sub_options: [],
        },
      ],
    }),
  ];

  it('keeps only one option for single groups and filters invalid sub-options', () => {
    const sanitized = sanitizeSelectedOptions(
      [
        {
          group: 'audit_type',
          option: 'structure',
          sub_options: ['server_client_boundaries', 'invalid_sub'],
        },
        {
          group: 'audit_type',
          option: 'seo',
          sub_options: ['will_be_removed'],
        },
        {
          group: 'scope',
          option: 'admin',
          sub_options: ['publish_view'],
        },
        {
          group: 'scope',
          option: 'landing_pages',
          sub_options: ['not_allowed'],
        },
      ],
      menuDefinitions
    );

    expect(sanitized).toEqual([
      {
        group: 'audit_type',
        option: 'seo',
        sub_options: [],
      },
      {
        group: 'scope',
        option: 'admin',
        sub_options: ['publish_view'],
      },
      {
        group: 'scope',
        option: 'landing_pages',
        sub_options: [],
      },
    ]);
  });
});

describe('createPromptPayloadFromLegacyRecord', () => {
  it('migrates legacy prompt fields into the canonical contract', () => {
    const payload = createPromptPayloadFromLegacyRecord({
      title: 'Auditoria Ghost',
      systemRole: 'Você é um auditor sênior',
      task: 'Auditar o app inteiro',
      context: 'Aplicar checklist editorial e técnico.',
      contextMenus: {
        audit_type: {
          option: 'structure',
          subOptions: ['server_client_boundaries'],
        },
      },
      enabledMenuIds: ['audit_type'],
      constraints: ['Priorizar acessibilidade'],
      negativePrompt: ['Não reescrever copy'],
      outputSchema: {
        formato: 'markdown',
        estrutura: 'overview, findings',
      },
      referenceUrl: 'https://prompt-app-dan.netlify.app',
    });

    expect(payload.meta.name).toBe('Auditoria Ghost');
    expect(payload.meta.schema_version).toBe('1.0.0');
    expect(payload.role.description).toBe('Você é um auditor sênior');
    expect(payload.objective.task).toBe('Auditar o app inteiro');
    expect(payload.project.context).toBe('Aplicar checklist editorial e técnico.');
    expect(payload.project.reference_urls).toEqual(['https://prompt-app-dan.netlify.app']);
    expect(payload.selected_options).toEqual([
      {
        group: 'audit_type',
        option: 'structure',
        sub_options: ['server_client_boundaries'],
      },
    ]);
    expect(payload.policies.must).toEqual(['Priorizar acessibilidade']);
    expect(payload.policies.must_not).toEqual(['Não reescrever copy']);
    expect(payload.output_contract.format).toBe('markdown');
    expect(payload.output_contract.structure_notes).toBe('overview, findings');
    expect(payload.output_contract.status_enum).toEqual([
      'approved',
      'approved_with_issues',
      'failed',
    ]);
  });
});
