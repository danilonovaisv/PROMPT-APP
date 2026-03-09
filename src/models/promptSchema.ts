import { z } from 'zod';

const DEFAULT_SCHEMA_VERSION = '1.0.0';
const DEFAULT_LANGUAGE = 'pt-BR';
const DEFAULT_OWNER = 'webapp';
const DEFAULT_PROJECT_NAME = 'PROMPT-APP';
const DEFAULT_PRODUCTION_URL = 'https://prompt-app-dan.netlify.app';

export const MENU_SELECTION_MODES = ['single', 'multiple'] as const;
export const PROMPT_OUTPUT_FORMATS = [
  'markdown',
  'json',
  'markdown_and_json',
  'text',
  'image',
  'code',
] as const;

export const STATUS_ENUM_DEFAULT = ['approved', 'approved_with_issues', 'failed'] as const;
export const SEVERITY_ENUM_DEFAULT = ['critical', 'high', 'medium', 'low'] as const;

const SelectionModeSchema = z.enum(MENU_SELECTION_MODES);
const PromptOutputFormatSchema = z.enum(PROMPT_OUTPUT_FORMATS);

export const MenuSubOptionSchema = z
  .object({
    value: z.string().trim().min(1),
    label: z.string().trim().min(1),
  })
  .strict();

export const MenuOptionSchema = z
  .object({
    value: z.string().trim().min(1),
    label: z.string().trim().min(1),
    sub_options: z.array(MenuSubOptionSchema).default([]),
  })
  .strict();

export const MenuDefinitionSchema = z
  .object({
    id: z.string().trim().min(1),
    label: z.string().trim().min(1),
    description: z.string().trim().default(''),
    selection_mode: SelectionModeSchema.default('single'),
    options: z.array(MenuOptionSchema).default([]),
  })
  .strict();

export const SelectedOptionSchema = z
  .object({
    group: z.string().trim().min(1),
    option: z.string().trim().min(1),
    sub_options: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export const PromptOutputContractSchema = z
  .object({
    format: PromptOutputFormatSchema.default('markdown'),
    language: z.string().trim().min(2).default(DEFAULT_LANGUAGE),
    strict_mode: z.boolean().default(true),
    require_evidence_for_claims: z.boolean().default(true),
    required_sections: z.array(z.string().trim().min(1)).default([]),
    route_audit_order: z.array(z.string().trim().min(1)).default([]),
    ordered_evaluation_blocks: z.array(z.string().trim().min(1)).default([]),
    acceptance_criteria: z.array(z.string().trim().min(1)).default([]),
    status_enum: z
      .array(z.string().trim().min(1))
      .min(1)
      .default([...STATUS_ENUM_DEFAULT]),
    severity_enum: z
      .array(z.string().trim().min(1))
      .min(1)
      .default([...SEVERITY_ENUM_DEFAULT]),
    structure_notes: z.string().trim().default(''),
    area_template: z
      .object({
        required_fields: z.array(z.string().trim().min(1)).default([]),
        status_enum: z.array(z.string().trim().min(1)).default([...STATUS_ENUM_DEFAULT]),
        severity_enum: z.array(z.string().trim().min(1)).default([...SEVERITY_ENUM_DEFAULT]),
      })
      .strict()
      .optional(),
  })
  .strict();

const RouteDiscoverySchema = z
  .object({
    mode: z.enum(['auto', 'manual']).default('auto'),
    spa_fallback: z.boolean().default(true),
    fallback_route: z.string().trim().min(1).default('/'),
    include_internal_states: z.boolean().default(true),
  })
  .strict();

export const PromptContractSchema = z
  .object({
    meta: z
      .object({
        prompt_id: z.string().trim().min(1),
        name: z.string().trim().min(1),
        schema_version: z.string().trim().min(1).default(DEFAULT_SCHEMA_VERSION),
        language: z.string().trim().min(2).default(DEFAULT_LANGUAGE),
        owner: z.string().trim().min(1).default(DEFAULT_OWNER),
      })
      .strict(),
    role: z
      .object({
        id: z.string().trim().min(1),
        description: z.string().trim().default(''),
      })
      .strict(),
    objective: z
      .object({
        task: z.string().trim().default(''),
        focus: z.array(z.string().trim().min(1)).default([]),
        priority_order: z.array(z.string().trim().min(1)).default([]),
      })
      .strict(),
    project: z
      .object({
        name: z.string().trim().min(1).default(DEFAULT_PROJECT_NAME),
        production_url: z.string().trim().default(DEFAULT_PRODUCTION_URL),
        repository_url: z.string().trim().default(''),
        reference_urls: z.array(z.string().trim().min(1)).default([]),
        target_environment: z.array(z.string().trim().min(1)).default(['web_desktop', 'web_mobile']),
        app_type: z.string().trim().min(1).default('prompt_management_webapp'),
        context: z.string().trim().default(''),
      })
      .strict(),
    scope: z
      .object({
        audit_areas_minimum: z.array(z.string().trim().min(1)).default([]),
        critical_flows: z.array(z.string().trim().min(1)).default([]),
        route_discovery: RouteDiscoverySchema.default({
          mode: 'auto',
          spa_fallback: true,
          fallback_route: '/',
          include_internal_states: true,
        }),
      })
      .strict(),
    selected_options: z.array(SelectedOptionSchema).default([]),
    rules: z
      .object({
        motion: z
          .object({
            disallow: z.array(z.string().trim().min(1)).default([]),
            allow: z.array(z.string().trim().min(1)).default([]),
            translateY_max_px: z.number().int().nonnegative().optional(),
            respect_reduced_motion: z.boolean().optional(),
          })
          .strict()
          .optional(),
        a11y: z
          .object({
            wcag_target: z.string().trim().optional(),
            require_visible_focus: z.boolean().optional(),
            require_keyboard_navigation: z.boolean().optional(),
            require_semantic_structure: z.boolean().optional(),
            editor_form_requirements: z.array(z.string().trim().min(1)).default([]),
          })
          .strict()
          .optional(),
        mobile: z
          .object({
            min_width_px: z.number().int().nonnegative().optional(),
            min_touch_target_px: z.number().int().nonnegative().optional(),
            disallow_horizontal_overflow: z.boolean().optional(),
          })
          .strict()
          .optional(),
        performance_targets: z
          .object({
            initial_weight_mb_max: z.number().nonnegative().optional(),
            fcp_seconds_max: z.number().nonnegative().optional(),
            lcp_seconds_max: z.number().nonnegative().optional(),
            tti_seconds_max_3g: z.number().nonnegative().optional(),
            cls_max: z.number().nonnegative().optional(),
            lighthouse_min: z.number().nonnegative().optional(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .default({}),
    policies: z
      .object({
        must: z.array(z.string().trim().min(1)).default([]),
        must_not: z.array(z.string().trim().min(1)).default([]),
      })
      .strict(),
    output_contract: PromptOutputContractSchema,
  })
  .strict();

export type MenuDefinition = z.infer<typeof MenuDefinitionSchema>;
export type SelectedOption = z.infer<typeof SelectedOptionSchema>;
export type PromptOutputContract = z.infer<typeof PromptOutputContractSchema>;
export type PromptContract = z.infer<typeof PromptContractSchema>;
export type PromptOutputFormat = z.infer<typeof PromptOutputFormatSchema>;
export type MenuSelectionMode = z.infer<typeof SelectionModeSchema>;

type LegacyContextMenuSelection = {
  option?: string;
  subOptions?: string[];
};

type LegacyPromptRecord = Partial<{
  title: string;
  systemRole: string;
  task: string;
  context: string;
  contextMenus: Record<string, LegacyContextMenuSelection>;
  enabledMenuIds: string[];
  constraints: string[];
  negativePrompt: string[];
  outputSchema: Partial<{ formato: string; estrutura: string }>;
  referenceUrl: string;
  language: string;
  schemaVersion: string;
}>;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_');
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean).map((item) => item.trim()).filter(Boolean))];
}

export function createDefaultOutputContract(): PromptOutputContract {
  return PromptOutputContractSchema.parse({});
}

export function createEmptyPromptPayload(name = 'Novo Prompt'): PromptContract {
  const safeName = name.trim() || 'Novo Prompt';
  return PromptContractSchema.parse({
    meta: {
      prompt_id: slugify(safeName) || 'novo_prompt',
      name: safeName,
      schema_version: DEFAULT_SCHEMA_VERSION,
      language: DEFAULT_LANGUAGE,
      owner: DEFAULT_OWNER,
    },
    role: {
      id: 'custom_role',
      description: '',
    },
    objective: {
      task: '',
      focus: [],
      priority_order: [],
    },
    project: {
      name: DEFAULT_PROJECT_NAME,
      production_url: DEFAULT_PRODUCTION_URL,
      repository_url: '',
      reference_urls: [],
      target_environment: ['web_desktop', 'web_mobile'],
      app_type: 'prompt_management_webapp',
      context: '',
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
    output_contract: createDefaultOutputContract(),
  });
}

export function sanitizeSelectedOptions(
  selectedOptions: SelectedOption[],
  menuDefinitions: MenuDefinition[]
): SelectedOption[] {
  const definitionMap = new Map(menuDefinitions.map((definition) => [definition.id, definition]));
  const multipleSelections: SelectedOption[] = [];
  const singleSelections = new Map<string, SelectedOption>();

  for (const rawSelection of selectedOptions) {
    const definition = definitionMap.get(rawSelection.group);
    if (!definition) continue;

    const optionDefinition = definition.options.find((option) => option.value === rawSelection.option);
    if (!optionDefinition) continue;

    const allowedSubOptions = new Set(optionDefinition.sub_options.map((subOption) => subOption.value));
    const normalizedSelection = SelectedOptionSchema.parse({
      group: rawSelection.group,
      option: rawSelection.option,
      sub_options: uniqueValues(rawSelection.sub_options).filter((subOption) =>
        allowedSubOptions.has(subOption)
      ),
    });

    if (definition.selection_mode === 'single') {
      singleSelections.set(definition.id, normalizedSelection);
      continue;
    }

    const exists = multipleSelections.some(
      (selection) =>
        selection.group === normalizedSelection.group && selection.option === normalizedSelection.option
    );

    if (!exists) {
      multipleSelections.push(normalizedSelection);
    }
  }

  return [...singleSelections.values(), ...multipleSelections];
}

export function createPromptPayloadFromLegacyRecord(
  legacyPrompt: LegacyPromptRecord
): PromptContract {
  const title = legacyPrompt.title?.trim() || 'Novo Prompt';
  const format =
    typeof legacyPrompt.outputSchema?.formato === 'string' && legacyPrompt.outputSchema.formato.trim()
      ? legacyPrompt.outputSchema.formato.trim().toLowerCase()
      : 'markdown';
  const compatibleFormat: PromptOutputFormat = PROMPT_OUTPUT_FORMATS.includes(
    format as PromptOutputFormat
  )
    ? (format as PromptOutputFormat)
    : 'markdown';

  const selectedOptions = Object.entries(legacyPrompt.contextMenus || {})
    .filter(([group]) => !legacyPrompt.enabledMenuIds || legacyPrompt.enabledMenuIds.includes(group))
    .filter(([, selection]) => Boolean(selection?.option))
    .map(([group, selection]) =>
      SelectedOptionSchema.parse({
        group,
        option: selection?.option || '',
        sub_options: selection?.subOptions || [],
      })
    );

  const payload = {
    meta: {
      prompt_id: slugify(title) || 'novo_prompt',
      name: title,
      schema_version: legacyPrompt.schemaVersion || DEFAULT_SCHEMA_VERSION,
      language: legacyPrompt.language || DEFAULT_LANGUAGE,
      owner: DEFAULT_OWNER,
    },
    role: {
      id: slugify(legacyPrompt.systemRole || 'custom_role') || 'custom_role',
      description: legacyPrompt.systemRole?.trim() || '',
    },
    objective: {
      task: legacyPrompt.task?.trim() || '',
      focus: [],
      priority_order: [],
    },
    project: {
      name: DEFAULT_PROJECT_NAME,
      production_url: DEFAULT_PRODUCTION_URL,
      repository_url: '',
      reference_urls: legacyPrompt.referenceUrl ? [legacyPrompt.referenceUrl.trim()] : [],
      target_environment: ['web_desktop', 'web_mobile'],
      app_type: 'prompt_management_webapp',
      context: legacyPrompt.context?.trim() || '',
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
    selected_options: selectedOptions,
    rules: {},
    policies: {
      must: uniqueValues(legacyPrompt.constraints || []),
      must_not: uniqueValues(legacyPrompt.negativePrompt || []),
    },
    output_contract: {
      ...createDefaultOutputContract(),
      format: compatibleFormat,
      language: legacyPrompt.language || DEFAULT_LANGUAGE,
      structure_notes: legacyPrompt.outputSchema?.estrutura?.trim() || '',
    },
  };

  return PromptContractSchema.parse(payload);
}

export function parsePromptPayload(rawPayload: unknown, fallback?: LegacyPromptRecord): PromptContract {
  if (typeof rawPayload === 'string' && rawPayload.trim()) {
    try {
      const parsed = JSON.parse(rawPayload);
      return PromptContractSchema.parse(parsed);
    } catch (error) {
      if (!fallback) {
        throw error;
      }
    }
  }

  if (rawPayload && typeof rawPayload === 'object') {
    try {
      return PromptContractSchema.parse(rawPayload);
    } catch (error) {
      if (!fallback) {
        throw error;
      }
    }
  }

  return createPromptPayloadFromLegacyRecord(fallback || {});
}

export function getPrimaryReferenceUrl(payload: PromptContract): string | undefined {
  return payload.project.reference_urls[0];
}

export function getPromptSummaryFields(payload: PromptContract) {
  return {
    title: payload.meta.name,
    schemaVersion: payload.meta.schema_version,
    language: payload.meta.language,
    outputFormat: payload.output_contract.format,
  };
}

export function selectedOptionsToContextMenuMap(selectedOptions: SelectedOption[]) {
  return selectedOptions.reduce<Record<string, { option: string; subOptions: string[] }>>(
    (accumulator, selection) => {
      accumulator[selection.group] = {
        option: selection.option,
        subOptions: selection.sub_options,
      };
      return accumulator;
    },
    {}
  );
}

export function getLegacyPromptColumns(payload: PromptContract) {
  return {
    system_role: payload.role.description,
    task: payload.objective.task,
    context: payload.project.context,
    menus: {},
    context_menus: selectedOptionsToContextMenuMap(payload.selected_options),
    enabled_menu_ids: uniqueValues(payload.selected_options.map((selection) => selection.group)),
    constraints: payload.policies.must,
    negative_prompt: payload.policies.must_not,
    output_schema: {
      formato: payload.output_contract.format,
      estrutura: payload.output_contract.structure_notes,
    },
  };
}
