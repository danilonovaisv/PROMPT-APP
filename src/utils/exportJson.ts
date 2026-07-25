import { db } from "@/db/database";
import {
  type CompiledPromptPayload,
  ImportEnvelopeSchema,
  type PromptContract,
  PromptContractSchema,
  type TemplatePayload,
} from "@/models/promptSchema";
import type { Prompt, ContextMenu } from "@/models/types";
import { contextMenuToDefinition } from "@/utils/promptArtifacts";
import {
  CURRENT_PROMPT_SCHEMA_VERSION,
} from "@/utils/schemaCompatibility";

export function toExportFormat(prompt: Prompt, contextMenus?: ContextMenu[]): PromptContract {
  const payload = { ...prompt.promptPayload };
  if (contextMenus && prompt.selectedMenuIds) {
    const menuMap = new Map(contextMenus.map((m) => [m.id, m.menuId]));
    const menuIds = prompt.selectedMenuIds
      .map((id) => menuMap.get(id))
      .filter((id): id is string => typeof id === "string");
    payload.menu_ids = Array.from(new Set([
      ...(payload.menu_ids || []),
      ...menuIds
    ]));
  }
  return PromptContractSchema.parse(payload);
}

export function downloadJson(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function downloadPrompt(prompt: Prompt) {
  const contextMenus = await db.contextMenus.toArray();
  const exported = toExportFormat(prompt, contextMenus);
  const safeName = prompt.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  downloadJson(exported, `prompt_${safeName}`);
}

export async function downloadAllPrompts() {
  const prompts = await db.prompts.toArray();
  const contextMenus = await db.contextMenus.toArray();
  const bulk = ImportEnvelopeSchema.parse({
    app: "Prompt App",
    version: "3.0.0",
    format: "prompt-app-import",
    schemaVersion: CURRENT_PROMPT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    context_menus: contextMenus.map(contextMenuToDefinition),
    prompts: prompts.map((prompt) => toExportFormat(prompt, contextMenus)),
  });

  downloadJson(bulk, `prompt_app_export_${Date.now()}`);
}

export function getTemplateFile(): Blob {
  const internalTemplate = ImportEnvelopeSchema.parse({
    app: "Prompt App",
    version: "3.0.0",
    format: "prompt-app-import",
    schemaVersion: CURRENT_PROMPT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    context_menus: [],
    prompts: [
      PromptContractSchema.parse({
        meta: {
          template_id: "novo_template",
          template_name: "Novo Template",
          template_type: "generic_prompt",
          schema_version: CURRENT_PROMPT_SCHEMA_VERSION,
          language: "pt-BR",
          status: "draft",
        },
        prompt_definition: {
          system_role: "",
          task: "",
          context: "",
          user_scene_description: "",
          constraints: [],
          negative_prompt: [],
          few_shot_examples: [],
        },
        menu_definitions: [],
        menu_ids: [],
        prompt_memory_context: {
          enabled: false,
          merge_strategy: "preserve_existing",
          entries: [],
        },
        output_contract: {
          format: "text",
          language: "pt-BR",
          strict_mode: true,
          required_fields: [],
          response_rules: [],
        },
      }),
    ],
  });

  const template = {
    ...internalTemplate,
    prompts: internalTemplate.prompts.map((prompt) => {
      const { menu_definitions: menuDefinitions, ...externalPrompt } = prompt;
      return {
        ...externalPrompt,
        context_menus: menuDefinitions,
      };
    }),
  };

  return new Blob([JSON.stringify(template, null, 2)], {
    type: "application/json",
  });
}

/**
 * Formats the compiled prompt as structured Markdown
 */
export function formatPromptAsMarkdown(
  template: TemplatePayload,
  compiledPayload: CompiledPromptPayload,
): string {
  const lines: string[] = [];

  // # ROLE
  lines.push(`# ROLE: ${template.prompt_definition.system_role}`);
  lines.push("");

  // ## 1. CONTEXT & TASK
  lines.push("## 1. CONTEXT & TASK");
  if (template.prompt_definition.context) {
    lines.push(template.prompt_definition.context);
    lines.push("");
  }
  lines.push(template.prompt_definition.task);
  lines.push("");

  // ## 2. DYNAMIC PARAMETERS
  lines.push("## 2. DYNAMIC PARAMETERS");

  const fixedVars = compiledPayload.compiled_context.fixed_variables;
  if (fixedVars && Object.keys(fixedVars).length > 0) {
    Object.entries(fixedVars).forEach(([key, value]) => {
      lines.push(`- **${key}**: ${value} (from project context)`);
    });
  }

  const menuInterpretation =
    compiledPayload.compiled_context.menu_interpretation;
  if (menuInterpretation && Object.keys(menuInterpretation).length > 0) {
    Object.entries(menuInterpretation).forEach(([menuId, menuData]) => {
      const menuDef = template.menu_definitions.find((m) =>
        m.menu_id === menuId
      );
      if (!menuDef) {
        return;
      }

      if (menuData.selections.length > 0) {
        menuData.selections.forEach((selection) => {
          let paramLine = `- **${menuDef.menu_name}**: ${selection.option_label}`;

          if (selection.selected_sub_options.length > 0) {
            paramLine += ` (${selection.selected_sub_options
              .map((subOption) => subOption.label)
              .join(", ")})`;
          }

          lines.push(paramLine);
        });
        return;
      }

      menuData.selected_options.forEach((optionValue) => {
        const optionDef = menuDef.options.find((o) =>
          o.value === optionValue
        );
        if (!optionDef) {
          return;
        }

        let paramLine = `- **${menuDef.menu_name}**: ${optionDef.label}`;

        if (menuData.selected_sub_options.length > 0) {
          const subOptionLabels = menuData.selected_sub_options.map(
            (subValue) => {
              const subDef = optionDef.sub_options?.find((s) =>
                s.value === subValue
              );
              return subDef?.label || subValue;
            },
          );
          paramLine += ` (${subOptionLabels.join(", ")})`;
        }

        lines.push(paramLine);
      });
    });
  }


  const freeInputs = compiledPayload.compiled_context.free_inputs;
  if (freeInputs && Object.keys(freeInputs).length > 0) {
    Object.entries(freeInputs).forEach(([key, value]) => {
      lines.push(`- **${key}**: ${value}`);
    });
  }

  lines.push("");

  // ## 3. RULES & CONSTRAINTS
  lines.push("## 3. RULES & CONSTRAINTS");
  if (template.prompt_definition.constraints.length > 0) {
    template.prompt_definition.constraints.forEach((constraint) => {
      lines.push(`- ${constraint}`);
    });
  }
  if (template.prompt_definition.negative_prompt.length > 0) {
    template.prompt_definition.negative_prompt.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }
  
  const outputContract = template.output_contract;
  if (outputContract?.response_rules && outputContract.response_rules.length > 0) {
    outputContract.response_rules.forEach((rule) => {
      lines.push(`- ${rule}`);
    });
  }
  lines.push("");

  // ## 4. FEW-SHOT EXAMPLES
  if (template.prompt_definition.few_shot_examples && template.prompt_definition.few_shot_examples.length > 0) {
    lines.push("## 4. FEW-SHOT EXAMPLES");
    template.prompt_definition.few_shot_examples.forEach((example, index) => {
      lines.push(`### Example ${index + 1}:`);
      lines.push(`INPUT: ${example.input}`);
      lines.push(`OUTPUT: ${example.output}`);
      lines.push("");
    });
  }

  // ## 5. OUTPUT FORMAT
  if (outputContract) {
    lines.push("## 5. OUTPUT FORMAT");
    lines.push(`- **Format**: ${outputContract.format}`);
    lines.push(`- **Language**: ${outputContract.language}`);
    if (outputContract.required_fields && outputContract.required_fields.length > 0) {
      lines.push(`- **Required fields**: ${outputContract.required_fields.join(", ")}`);
    }
  }
  lines.push("");

  return lines.join("\n");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
}
