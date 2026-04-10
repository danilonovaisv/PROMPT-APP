import { z } from "zod";

const DEFAULT_SCHEMA_VERSION = "1.0.0";
const DEFAULT_LANGUAGE = "pt-BR";

export const MENU_SELECTION_MODES = ["single", "multiple"] as const;
export const PROMPT_OUTPUT_FORMATS = [
  "text",
  "markdown",
  "json",
  "image",
  "code",
] as const;
export const TEMPLATE_STATUS = ["draft", "active", "archived"] as const;

const SelectionModeSchema = z.enum(MENU_SELECTION_MODES);
const PromptOutputFormatSchema = z.enum(PROMPT_OUTPUT_FORMATS);
const TemplateStatusSchema = z.enum(TEMPLATE_STATUS);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const uniqueArrayBy =
  <T>(getKey: (item: T) => string, label: string) =>
  (items: T[], ctx: z.RefinementCtx) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      const key = getKey(item);
      if (key && seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: `${label} deve ser único`,
          path: [index],
        });
      }
      if (key) seen.add(key);
    });
  };

export const FewShotExampleSchema = z
  .object({
    input: z.string().trim().default(""),
    output: z.string().trim().default(""),
  })
  .strict();

export const MenuSubOptionSchema = z
  .object({
    label: z.string().trim().default(""),
    value: z.string().trim().default(""),
    description: z.string().trim().default(""),
  })
  .strict();

export const MenuOptionSchema = z
  .object({
    label: z.string().trim().default(""),
    value: z.string().trim().default(""),
    description: z.string().trim().default(""),
    sub_options: z
      .array(MenuSubOptionSchema)
      .default([])
      .superRefine(uniqueArrayBy((item) => item.value, "Sub-option value")),
  })
  .strict();

export const MenuDefinitionSchema = z
  .object({
    menu_id: z.string().trim().min(1),
    menu_name: z.string().trim().min(1),
    description: z.string().trim().default(""),
    selection_mode: SelectionModeSchema.default("single"),
    required: z.boolean().default(false),
    options: z
      .array(MenuOptionSchema)
      .default([])
      .superRefine(uniqueArrayBy((item) => item.value, "Option value")),
  })
  .strict();

export const TemplateMetaSchema = z
  .object({
    template_id: z.string().trim().min(1),
    template_name: z.string().trim().min(1),
    template_type: z.string().trim().min(1),
    schema_version: z.string().trim().min(1).default(DEFAULT_SCHEMA_VERSION),
    language: z.string().trim().min(2).default(DEFAULT_LANGUAGE),
    status: TemplateStatusSchema.default("draft"),
  })
  .strict();

export const PromptDefinitionSchema = z
  .object({
    system_role: z.string().trim().default(""),
    task: z.string().trim().default(""),
    context: z.string().trim().default(""),
    user_scene_description: z.string().trim().default(""),
    constraints: z.array(z.string().trim().min(1)).default([]),
    negative_prompt: z.array(z.string().trim().min(1)).default([]),
    few_shot_examples: z.array(FewShotExampleSchema).default([]),
  })
  .strict();

export const PromptOutputContractSchema = z
  .object({
    format: PromptOutputFormatSchema.default("markdown"),
    language: z.string().trim().min(2).default(DEFAULT_LANGUAGE),
    strict_mode: z.boolean().default(true),
    required_fields: z.array(z.string().trim().min(1)).default([]),
    response_rules: z.array(z.string().trim().min(1)).default([]),
    optional_enums: z.record(z.string(), z.array(z.string().trim().min(1)))
      .optional(),
  })
  .strict();

export const TemplatePayloadSchema = z
  .object({
    meta: TemplateMetaSchema,
    prompt_definition: PromptDefinitionSchema,
    menu_definitions: z
      .array(MenuDefinitionSchema)
      .default([])
      .superRefine(uniqueArrayBy((item) => item.menu_id, "Menu id")),
    menu_ids: z.array(z.string()).default([]),
    output_contract: PromptOutputContractSchema,
  })
  .strict();

export const SelectedMenuOptionSchema = z
  .object({
    option_value: z.string().trim().min(1),
    selected_sub_options: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export const SelectedMenuSchema = z
  .object({
    menu_id: z.string().trim().min(1),
    selected_options: z.array(SelectedMenuOptionSchema).default([]),
  })
  .strict();

export const UserSelectionSchema = z
  .object({
    template_id: z.string().trim().min(1),
    selected_menus: z
      .array(SelectedMenuSchema)
      .default([])
      .superRefine(uniqueArrayBy((item) => item.menu_id, "Selected menu id")),
    free_inputs: z.record(z.string(), z.string()).default({}),
  })
  .strict();

export const CompiledPromptMenuSelectionSchema = z
  .object({
    option_value: z.string().trim().min(1),
    option_label: z.string().trim().min(1),
    selected_sub_options: z
      .array(
        z
          .object({
            value: z.string().trim().min(1),
            label: z.string().trim().min(1),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();

export const CompiledPromptPayloadSchema = z
  .object({
    template_id: z.string().trim().min(1),
    meta: z
      .object({
        template_name: z.string().trim().min(1),
        template_type: z.string().trim().min(1),
        schema_version: z.string().trim().min(1),
        language: z.string().trim().min(2),
      })
      .strict(),
    compiled_context: z
      .object({
        menu_interpretation: z.record(
          z.string(),
          z
            .object({
              selected_options: z.array(z.string().trim().min(1)).default([]),
              selected_sub_options: z.array(z.string().trim().min(1)).default(
                [],
              ),
              selections: z.array(CompiledPromptMenuSelectionSchema).default(
                [],
              ),
            })
            .strict(),
        ),
        free_inputs: z.record(z.string(), z.string()).default({}),
      })
      .strict(),
    prompt_definition: PromptDefinitionSchema,
    output_contract: PromptOutputContractSchema,
  })
  .strict();

export type MenuDefinition = z.infer<typeof MenuDefinitionSchema>;
export type SelectedMenu = z.infer<typeof SelectedMenuSchema>;
export type UserSelection = z.infer<typeof UserSelectionSchema>;
export type TemplatePayload = z.infer<typeof TemplatePayloadSchema>;
export type PromptContract = TemplatePayload;
export type PromptOutputContract = z.infer<typeof PromptOutputContractSchema>;
export type PromptOutputFormat = z.infer<typeof PromptOutputFormatSchema>;
export type MenuSelectionMode = z.infer<typeof SelectionModeSchema>;
export type CompiledPromptPayload = z.infer<typeof CompiledPromptPayloadSchema>;

export const PromptContractSchema = TemplatePayloadSchema;
export const SelectedOptionSchema = z
  .object({
    group: z.string().trim().min(1),
    option: z.string().trim().min(1),
    sub_options: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export type SelectedOption = {
  group: string;
  option: string;
  sub_options: string[];
};

export type LegacyContextMenuSelection = {
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
  fewShotExamples: z.infer<typeof FewShotExampleSchema>[];
}>;

function normalizeOutputFormat(raw: string | undefined): PromptOutputFormat {
  const normalized = (raw || "").trim().toLowerCase();
  if (normalized === "texto") return "text";
  if (normalized === "imagem") return "image";
  if (PROMPT_OUTPUT_FORMATS.includes(normalized as PromptOutputFormat)) {
    return normalized as PromptOutputFormat;
  }
  return "markdown";
}

function convertContextMenuSelectionToSelectedMenus(
  contextMenus: Record<string, LegacyContextMenuSelection> | undefined,
  enabledMenuIds?: string[],
): SelectedMenu[] {
  if (!contextMenus) return [];

  return Object.entries(contextMenus)
    .filter(([menuId]) => !enabledMenuIds || enabledMenuIds.includes(menuId))
    .map(([menu_id, selection]) => ({
      menu_id,
      selected_options: selection?.option
        ? [
          {
            option_value: selection.option,
            selected_sub_options: uniqueStrings(selection.subOptions || []),
          },
        ]
        : [],
    }))
    .filter((menu) => menu.selected_options.length > 0);
}

function selectedMenusToLegacyContextMenus(selected_menus: SelectedMenu[]) {
  return selected_menus.reduce<
    Record<string, { option: string; subOptions: string[] }>
  >(
    (accumulator, menuSelection) => {
      if (menuSelection.selected_options[0]) {
        accumulator[menuSelection.menu_id] = {
          option: menuSelection.selected_options[0].option_value,
          subOptions: menuSelection.selected_options[0].selected_sub_options,
        };
      }
      return accumulator;
    },
    {},
  );
}

function normalizeLegacyResponseRules(raw: string | undefined): string[] {
  return uniqueStrings(
    (raw || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function normalizeFewShotExamples(raw: unknown): z.infer<typeof FewShotExampleSchema>[] {
  const parsedExamples = z.array(FewShotExampleSchema).safeParse(raw);
  return parsedExamples.success ? parsedExamples.data : [];
}

export function createDefaultOutputContract(): PromptOutputContract {
  return PromptOutputContractSchema.parse({});
}

export function createEmptyTemplatePayload(
  name = "Novo Template",
): TemplatePayload {
  const templateName = name.trim() || "Novo Template";
  return TemplatePayloadSchema.parse({
    meta: {
      template_id: slugify(templateName) || "novo_template",
      template_name: templateName,
      template_type: "generic_prompt",
      schema_version: DEFAULT_SCHEMA_VERSION,
      language: DEFAULT_LANGUAGE,
      status: "draft",
    },
    prompt_definition: {
      system_role: "",
      task: "",
      context: "",
      constraints: [],
      negative_prompt: [],
      few_shot_examples: [],
    },
    menu_definitions: [],
    output_contract: createDefaultOutputContract(),
  });
}

export function createEmptyPromptPayload(
  name = "Novo Template",
): TemplatePayload {
  return createEmptyTemplatePayload(name);
}

export function createEmptyUserSelection(templateId: string): UserSelection {
  return UserSelectionSchema.parse({
    template_id: templateId,
    selected_menus: [],
    free_inputs: {},
  });
}

export function sanitizeSelectedOptions(
  selectedOptions: SelectedOption[],
  menuDefinitions: MenuDefinition[],
): SelectedOption[] {
  const selection = sanitizeUserSelection(
    TemplatePayloadSchema.parse({
      meta: {
        template_id: "temporary_template",
        template_name: "Temporary Template",
        template_type: "temporary",
        schema_version: DEFAULT_SCHEMA_VERSION,
        language: DEFAULT_LANGUAGE,
        status: "draft",
      },
      prompt_definition: {
        system_role: "",
        task: "",
        context: "",
        constraints: [],
        negative_prompt: [],
        few_shot_examples: [],
      },
      menu_definitions: menuDefinitions,
      output_contract: createDefaultOutputContract(),
    }),
    UserSelectionSchema.parse({
      template_id: "temporary_template",
      selected_menus: uniqueBy(
        selectedOptions.map((item) => ({
          menu_id: item.group,
          selected_options: [
            {
              option_value: item.option,
              selected_sub_options: item.sub_options,
            },
          ],
        })),
        (item) =>
          `${item.menu_id}:${item.selected_options[0]?.option_value || ""}`,
      ).reduce<SelectedMenu[]>((accumulator, item) => {
        const existing = accumulator.find((entry) =>
          entry.menu_id === item.menu_id
        );
        if (existing) {
          existing.selected_options.push(...item.selected_options);
          return accumulator;
        }
        accumulator.push(item);
        return accumulator;
      }, []),
      free_inputs: {},
    }),
  );

  return selection.selected_menus.flatMap((menuSelection) =>
    menuSelection.selected_options.map((optionSelection) => ({
      group: menuSelection.menu_id,
      option: optionSelection.option_value,
      sub_options: optionSelection.selected_sub_options,
    }))
  );
}

export function sanitizeUserSelection(
  template: TemplatePayload,
  rawSelection: UserSelection,
): UserSelection {
  const definitionMap = new Map(
    template.menu_definitions.map((menu) => [menu.menu_id, menu]),
  );
  const selectedMenus: SelectedMenu[] = [];

  for (const menuSelection of rawSelection.selected_menus) {
    const menuDefinition = definitionMap.get(menuSelection.menu_id);
    if (!menuDefinition) continue;

    const optionSelections = uniqueBy(
      menuSelection.selected_options,
      (item) => item.option_value,
    )
      .map((selectedOption) => {
        const optionDefinition = menuDefinition.options.find(
          (option) => option.value === selectedOption.option_value,
        );

        if (!optionDefinition) {
          return null;
        }

        const allowedSubOptions = new Set(
          optionDefinition.sub_options.map((item) => item.value),
        );
        return {
          option_value: selectedOption.option_value,
          selected_sub_options: uniqueStrings(
            selectedOption.selected_sub_options,
          ).filter((item) => allowedSubOptions.has(item)),
        };
      })
      .filter((item): item is z.infer<typeof SelectedMenuOptionSchema> =>
        Boolean(item)
      );

    const normalizedSelections = menuDefinition.selection_mode === "single"
      ? optionSelections.slice(-1)
      : optionSelections;

    if (normalizedSelections.length > 0) {
      selectedMenus.push({
        menu_id: menuSelection.menu_id,
        selected_options: normalizedSelections,
      });
    }
  }

  for (
    const requiredMenu of template.menu_definitions.filter((menu) =>
      menu.required
    )
  ) {
    if (!selectedMenus.some((menu) => menu.menu_id === requiredMenu.menu_id)) {
      throw new Error(
        `O menu obrigatório "${requiredMenu.menu_name}" precisa de pelo menos uma seleção.`,
      );
    }
  }

  return UserSelectionSchema.parse({
    template_id: template.meta.template_id,
    selected_menus: selectedMenus,
    free_inputs: Object.fromEntries(
      Object.entries(rawSelection.free_inputs || {}).map((
        [key, value],
      ) => [key.trim(), value.trim()]),
    ),
  });
}

export function createTemplatePayloadFromLegacyRecord(
  legacyPrompt: LegacyPromptRecord,
  menuDefinitions: MenuDefinition[] = [],
): TemplatePayload {
  const templateName = legacyPrompt.title?.trim() || "Novo Template";
  const responseRules = normalizeLegacyResponseRules(
    legacyPrompt.outputSchema?.estrutura,
  );

  return TemplatePayloadSchema.parse({
    meta: {
      template_id: slugify(templateName) || "novo_template",
      template_name: templateName,
      template_type: "generic_prompt",
      schema_version: legacyPrompt.schemaVersion || DEFAULT_SCHEMA_VERSION,
      language: legacyPrompt.language || DEFAULT_LANGUAGE,
      status: "active",
    },
    prompt_definition: {
      system_role: legacyPrompt.systemRole?.trim() || "",
      task: legacyPrompt.task?.trim() || "",
      context: legacyPrompt.context?.trim() || "",
      user_scene_description:
        (legacyPrompt as any).user_scene_description?.trim() || "",
      constraints: uniqueStrings(legacyPrompt.constraints || []),
      negative_prompt: uniqueStrings(legacyPrompt.negativePrompt || []),
      few_shot_examples: normalizeFewShotExamples(legacyPrompt.fewShotExamples),
    },
    menu_definitions: menuDefinitions,
    menu_ids: legacyPrompt.enabledMenuIds ||
      Object.keys(legacyPrompt.contextMenus || {}),
    output_contract: {
      format: normalizeOutputFormat(legacyPrompt.outputSchema?.formato),
      language: legacyPrompt.language || DEFAULT_LANGUAGE,
      strict_mode: true,
      required_fields: (legacyPrompt as any).required_fields || [],
      response_rules: responseRules,
    },
  });
}

export function createPromptPayloadFromLegacyRecord(
  legacyPrompt: LegacyPromptRecord,
  menuDefinitions: MenuDefinition[] = [],
): TemplatePayload {
  return createTemplatePayloadFromLegacyRecord(legacyPrompt, menuDefinitions);
}

export function parseTemplatePayload(
  rawPayload: unknown,
  fallback?: LegacyPromptRecord,
  menuDefinitions: MenuDefinition[] = [],
): TemplatePayload {
  if (typeof rawPayload === "string" && rawPayload.trim()) {
    try {
      return parseTemplatePayload(
        JSON.parse(rawPayload),
        fallback,
        menuDefinitions,
      );
    } catch (error) {
      if (!fallback) throw error;
    }
  }

  const parsedTemplate = TemplatePayloadSchema.safeParse(rawPayload);
  if (parsedTemplate.success) {
    if (
      parsedTemplate.data.menu_definitions.length > 0 ||
      menuDefinitions.length === 0
    ) {
      return parsedTemplate.data;
    }

    return TemplatePayloadSchema.parse({
      ...parsedTemplate.data,
      menu_definitions: menuDefinitions,
    });
  }

  if (rawPayload && typeof rawPayload === "object") {
    const legacyPromptContract = rawPayload as Record<string, unknown>;

    if (
      "system_role" in legacyPromptContract ||
      "task" in legacyPromptContract ||
      "context" in legacyPromptContract ||
      "constraints" in legacyPromptContract ||
      "input_data" in legacyPromptContract
    ) {
      const inputData = legacyPromptContract.input_data &&
          typeof legacyPromptContract.input_data === "object"
        ? (legacyPromptContract.input_data as Record<string, unknown>)
        : undefined;

      const legacyRecord: LegacyPromptRecord & {
        user_scene_description?: string;
        required_fields?: string[];
      } = {
        title: typeof legacyPromptContract.title === "string"
          ? legacyPromptContract.title
          : typeof legacyPromptContract.name === "string"
          ? legacyPromptContract.name
          : fallback?.title,
        systemRole: typeof legacyPromptContract.system_role === "string"
          ? legacyPromptContract.system_role
          : fallback?.systemRole,
        task: typeof legacyPromptContract.task === "string"
          ? legacyPromptContract.task
          : fallback?.task,
        context: typeof legacyPromptContract.context === "string"
          ? legacyPromptContract.context
          : typeof inputData?.context === "string"
          ? inputData.context
          : fallback?.context,
        constraints: Array.isArray(legacyPromptContract.constraints)
          ? uniqueStrings(legacyPromptContract.constraints as string[])
          : fallback?.constraints,
        negativePrompt: Array.isArray(legacyPromptContract.negative_prompt)
          ? uniqueStrings(legacyPromptContract.negative_prompt as string[])
          : fallback?.negativePrompt,
        outputSchema: typeof legacyPromptContract.output_schema === "object" &&
            legacyPromptContract.output_schema
          ? {
            formato: String(
              (legacyPromptContract.output_schema as Record<string, unknown>)
                .formato || "markdown",
            ),
            estrutura: String(
              (legacyPromptContract.output_schema as Record<string, unknown>)
                .estrutura || "",
            ),
          }
          : fallback?.outputSchema,
        schemaVersion: typeof legacyPromptContract.schema_version === "string"
          ? legacyPromptContract.schema_version
          : fallback?.schemaVersion,
        language: typeof legacyPromptContract.language === "string"
          ? legacyPromptContract.language
          : fallback?.language,
        user_scene_description:
          typeof legacyPromptContract.user_scene_description === "string"
            ? legacyPromptContract.user_scene_description
            : (fallback as any)?.user_scene_description,
        required_fields: Array.isArray(legacyPromptContract.required_fields)
          ? uniqueStrings(legacyPromptContract.required_fields as string[])
          : (fallback as any)?.required_fields,
        enabledMenuIds: Array.isArray(legacyPromptContract.enabled_menu_ids)
          ? (legacyPromptContract.enabled_menu_ids as string[])
          : Array.isArray(legacyPromptContract.enabledMenuIds)
          ? (legacyPromptContract.enabledMenuIds as string[])
          : fallback?.enabledMenuIds,
        fewShotExamples: normalizeFewShotExamples(
          legacyPromptContract.few_shot_examples,
        ),
      };

      return createTemplatePayloadFromLegacyRecord(
        legacyRecord,
        menuDefinitions,
      );
    }

    if (
      "meta" in legacyPromptContract && "role" in legacyPromptContract &&
      "objective" in legacyPromptContract
    ) {
      const legacySelectionMap = legacyPromptContract.context_menus &&
          typeof legacyPromptContract.context_menus === "object"
        ? (legacyPromptContract.context_menus as Record<
          string,
          LegacyContextMenuSelection
        >)
        : {};

      return createTemplatePayloadFromLegacyRecord(
        {
          title: typeof legacyPromptContract.meta === "object" &&
              legacyPromptContract.meta &&
              typeof (legacyPromptContract.meta as Record<string, unknown>)
                  .name === "string"
            ? ((legacyPromptContract.meta as Record<string, unknown>)
              .name as string)
            : fallback?.title,
          systemRole: typeof legacyPromptContract.role === "object" &&
              legacyPromptContract.role &&
              typeof (legacyPromptContract.role as Record<string, unknown>)
                  .description === "string"
            ? ((legacyPromptContract.role as Record<string, unknown>)
              .description as string)
            : fallback?.systemRole,
          task: typeof legacyPromptContract.objective === "object" &&
              legacyPromptContract.objective &&
              typeof (legacyPromptContract.objective as Record<string, unknown>)
                  .task === "string"
            ? ((legacyPromptContract.objective as Record<string, unknown>)
              .task as string)
            : fallback?.task,
          context: typeof legacyPromptContract.project === "object" &&
              legacyPromptContract.project &&
              typeof (legacyPromptContract.project as Record<string, unknown>)
                  .context === "string"
            ? ((legacyPromptContract.project as Record<string, unknown>)
              .context as string)
            : fallback?.context,
          constraints: typeof legacyPromptContract.policies === "object" &&
              legacyPromptContract.policies &&
              Array.isArray(
                (legacyPromptContract.policies as Record<string, unknown>).must,
              )
            ? ((legacyPromptContract.policies as Record<string, unknown>)
              .must as string[])
            : fallback?.constraints,
          negativePrompt: typeof legacyPromptContract.policies === "object" &&
              legacyPromptContract.policies &&
              Array.isArray(
                (legacyPromptContract.policies as Record<string, unknown>)
                  .must_not,
              )
            ? ((legacyPromptContract.policies as Record<string, unknown>)
              .must_not as string[])
            : fallback?.negativePrompt,
          outputSchema:
            typeof legacyPromptContract.output_contract === "object" &&
              legacyPromptContract.output_contract
              ? {
                formato: String(
                  (legacyPromptContract.output_contract as Record<
                    string,
                    unknown
                  >).format || "markdown",
                ),
                estrutura: Array.isArray(
                    (legacyPromptContract.output_contract as Record<
                      string,
                      unknown
                    >).response_rules,
                  )
                  ? ((legacyPromptContract.output_contract as Record<
                    string,
                    unknown
                  >).response_rules as string[]).join(
                    ", ",
                  )
                  : "",
              }
              : fallback?.outputSchema,
          schemaVersion: typeof legacyPromptContract.meta === "object" &&
              legacyPromptContract.meta &&
              typeof (legacyPromptContract.meta as Record<string, unknown>)
                  .schema_version === "string"
            ? ((legacyPromptContract.meta as Record<string, unknown>)
              .schema_version as string)
            : fallback?.schemaVersion,
          language: typeof legacyPromptContract.meta === "object" &&
              legacyPromptContract.meta &&
              typeof (legacyPromptContract.meta as Record<string, unknown>)
                  .language === "string"
            ? ((legacyPromptContract.meta as Record<string, unknown>)
              .language as string)
            : fallback?.language,
          contextMenus: Object.keys(legacySelectionMap).length > 0
            ? legacySelectionMap
            : fallback?.contextMenus,
          enabledMenuIds: Array.isArray(legacyPromptContract.enabled_menu_ids)
            ? (legacyPromptContract.enabled_menu_ids as string[])
            : fallback?.enabledMenuIds,
        },
        menuDefinitions,
      );
    }
  }

  return createTemplatePayloadFromLegacyRecord(fallback || {}, menuDefinitions);
}

export function parsePromptPayload(
  rawPayload: unknown,
  fallback?: LegacyPromptRecord,
  menuDefinitions: MenuDefinition[] = [],
): TemplatePayload {
  return parseTemplatePayload(rawPayload, fallback, menuDefinitions);
}

export function parseUserSelection(
  rawSelection: unknown,
  templateId: string,
  fallback?: LegacyPromptRecord,
): UserSelection {
  const parsedSelection = UserSelectionSchema.safeParse(rawSelection);
  if (parsedSelection.success) {
    return parsedSelection.data;
  }

  return UserSelectionSchema.parse({
    template_id: templateId,
    selected_menus: convertContextMenuSelectionToSelectedMenus(
      fallback?.contextMenus,
      fallback?.enabledMenuIds,
    ),
    free_inputs: {},
  });
}

export function compilePromptPayload(
  template: TemplatePayload,
  rawSelection: UserSelection,
): CompiledPromptPayload {
  const selection = sanitizeUserSelection(template, rawSelection);
  const definitionMap = new Map(
    template.menu_definitions.map((menu) => [menu.menu_id, menu]),
  );
  const menuInterpretation = selection.selected_menus.reduce<
    Record<string, unknown>
  >(
    (accumulator, menuSelection) => {
      const menuDefinition = definitionMap.get(menuSelection.menu_id);
      if (!menuDefinition) return accumulator;

      accumulator[menuSelection.menu_id] = {
        selected_options: menuSelection.selected_options.map((item) =>
          item.option_value
        ),
        selected_sub_options: menuSelection.selected_options.flatMap((item) =>
          item.selected_sub_options
        ),
        selections: menuSelection.selected_options.map((selectedOption) => {
          const optionDefinition = menuDefinition.options.find(
            (option) => option.value === selectedOption.option_value,
          );

          return {
            option_value: selectedOption.option_value,
            option_label: optionDefinition?.label ||
              selectedOption.option_value,
            selected_sub_options: selectedOption.selected_sub_options.map(
              (subOptionValue) => {
                const subOptionDefinition = optionDefinition?.sub_options.find(
                  (subOption) => subOption.value === subOptionValue,
                );

                return {
                  value: subOptionValue,
                  label: subOptionDefinition?.label || subOptionValue,
                };
              },
            ),
          };
        }),
      };
      return accumulator;
    },
    {},
  );

  return CompiledPromptPayloadSchema.parse({
    template_id: template.meta.template_id,
    meta: {
      template_name: template.meta.template_name,
      template_type: template.meta.template_type,
      schema_version: template.meta.schema_version,
      language: template.meta.language,
    },
    compiled_context: {
      menu_interpretation: menuInterpretation,
      free_inputs: selection.free_inputs,
    },
    prompt_definition: template.prompt_definition,
    output_contract: template.output_contract,
  });
}

export function getPromptSummaryFields(payload: TemplatePayload) {
  return {
    title: payload.meta.template_name,
    schemaVersion: payload.meta.schema_version,
    language: payload.meta.language,
    outputFormat: payload.output_contract.format,
    templateType: payload.meta.template_type,
    templateId: payload.meta.template_id,
    status: payload.meta.status,
  };
}

export function getPrimaryReferenceUrl(
  _payload?: TemplatePayload,
): string | undefined {
  return undefined;
}

export function getLegacyPromptColumns(
  template: TemplatePayload,
  selection?: UserSelection,
  compiledPayload?: CompiledPromptPayload,
) {
  const normalizedSelection = selection
    ? sanitizeUserSelection(template, selection)
    : createEmptyUserSelection(template.meta.template_id);

  return {
    system_role: template.prompt_definition.system_role,
    task: template.prompt_definition.task,
    context: template.prompt_definition.context,
    menus: {},
    context_menus: selectedMenusToLegacyContextMenus(
      normalizedSelection.selected_menus,
    ),
    enabled_menu_ids: normalizedSelection.selected_menus.map((item) =>
      item.menu_id
    ),
    constraints: template.prompt_definition.constraints,
    negative_prompt: template.prompt_definition.negative_prompt,
    output_schema: {
      formato: template.output_contract.format,
      estrutura: template.output_contract.response_rules.join(", "),
    },
    selection_payload_jsonb: normalizedSelection,
    compiled_payload_jsonb: compiledPayload ||
      compilePromptPayload(template, normalizedSelection),
  };
}

export function buildLegacyFallbackFromTemplate(
  template: TemplatePayload,
): LegacyPromptRecord {
  return {
    title: template.meta.template_name,
    systemRole: template.prompt_definition.system_role,
    task: template.prompt_definition.task,
    context: template.prompt_definition.context,
    constraints: template.prompt_definition.constraints,
    negativePrompt: template.prompt_definition.negative_prompt,
    outputSchema: {
      formato: template.output_contract.format,
      estrutura: template.output_contract.response_rules.join(", "),
    },
    language: template.meta.language,
    schemaVersion: template.meta.schema_version,
  };
}
