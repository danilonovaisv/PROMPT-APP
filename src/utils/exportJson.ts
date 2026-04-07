import { db } from "@/db/database";
import {
  type CompiledPromptPayload,
  type PromptContract,
  PromptContractSchema,
  type TemplatePayload,
} from "@/models/promptSchema";
import type { BulkExport, Prompt } from "@/models/types";
import { contextMenuToDefinition } from "@/utils/promptArtifacts";
import {
  CURRENT_BULK_EXPORT_VERSION,
  CURRENT_PROMPT_SCHEMA_VERSION,
} from "@/utils/schemaCompatibility";

export function toExportFormat(prompt: Prompt): PromptContract {
  return PromptContractSchema.parse(prompt.promptPayload);
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

export function downloadPrompt(prompt: Prompt) {
  const exported = toExportFormat(prompt);
  const safeName = prompt.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  downloadJson(exported, `prompt_${safeName}`);
}

export async function downloadAllPrompts() {
  const prompts = await db.prompts.toArray();
  const categories = await db.categories.toArray();
  const contextMenus = await db.contextMenus.toArray();
  const categoryMap = new Map(
    categories.map((category) => [category.id!, category.name]),
  );

  const bulk: BulkExport = {
    app: "Prompt App",
    version: CURRENT_BULK_EXPORT_VERSION,
    format: "prompt-app-bulk-export",
    schemaVersion: CURRENT_PROMPT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    menuDefinitions: contextMenus.map(contextMenuToDefinition),
    prompts: prompts.map((prompt) => ({
      title: prompt.title,
      category: categoryMap.get(prompt.categoryId) || "Sem categoria",
      schemaVersion: prompt.schemaVersion,
      prompt: toExportFormat(prompt),
    })),
  };

  downloadJson(bulk, `prompt_app_export_${Date.now()}`);
}

export function getTemplateFile(): Blob {
  const template = PromptContractSchema.parse({
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
      constraints: [],
      negative_prompt: [],
      few_shot_examples: [],
    },
    menu_definitions: [],
    output_contract: {
      format: "text",
      language: "pt-BR",
      strict_mode: true,
      required_fields: [],
      response_rules: [],
    },
  });

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
