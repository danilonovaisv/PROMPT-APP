import type { ContextMenu, Prompt } from '@/models/types';
import {
  type CompiledPromptPayload,
  type MenuDefinition,
  type TemplatePayload,
  compilePromptPayload,
  createEmptyUserSelection,
  MenuDefinitionSchema,
  TemplatePayloadSchema,
} from '@/models/promptSchema';
import { normalizeContextMenuOptions } from '@/utils/contextMenuOptions';

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function contextMenuToDefinition(menu: ContextMenu): MenuDefinition {
  const options = normalizeContextMenuOptions(menu.options);

  return MenuDefinitionSchema.parse({
    menu_id: menu.menuId,
    menu_name: menu.menuName,
    description: menu.description,
    selection_mode: menu.selectionMode,
    required: false,
    options: options.map((option) => ({
      label: option.label,
      value: option.value,
      description: '',
      sub_options: (option.subOptions || []).map((subOption) => ({
        label: subOption.label,
        value: subOption.value,
        description: '',
      })),
    })),
  });
}

export function syncTemplateWithLinkedMenus(
  template: TemplatePayload,
  contextMenus: ContextMenu[]
): TemplatePayload {
  return syncTemplateWithMenuDefinitions(
    template,
    contextMenus.map((menu) => contextMenuToDefinition(menu))
  );
}

export function syncTemplateWithMenuDefinitions(
  template: TemplatePayload,
  menuDefinitions: MenuDefinition[]
): TemplatePayload {
  const registryMenus = new Map(menuDefinitions.map((menu) => [menu.menu_id, menu]));
  const existingSnapshots = new Map(template.menu_definitions.map((menu) => [menu.menu_id, menu]));
  const requestedIds = uniqueStrings([
    ...(template.menu_ids || []),
    ...template.menu_definitions.map((menu) => menu.menu_id),
  ]).filter((menuId) => registryMenus.has(menuId) || existingSnapshots.has(menuId));

  return TemplatePayloadSchema.parse({
    ...template,
    menu_ids: requestedIds,
    menu_definitions: requestedIds.map((menuId) => {
      return registryMenus.get(menuId) || existingSnapshots.get(menuId)!;
    }),
  });
}

function buildMenuLines(template: TemplatePayload, compiledPayload: CompiledPromptPayload): string[] {
  const menuDefinitions = new Map(
    template.menu_definitions.map((menu) => [menu.menu_id, menu.menu_name])
  );

  return Object.entries(compiledPayload.compiled_context.menu_interpretation).flatMap(
    ([menuId, menuSelection]) => {
      const menuName = menuDefinitions.get(menuId) || menuId;
      return menuSelection.selections.flatMap((selection) => {
        const lines = [`- ${menuName}: ${selection.option_label}`];
        if (selection.selected_sub_options.length > 0) {
          lines.push(
            `  Sub-opções: ${selection.selected_sub_options
              .map((subOption) => subOption.label)
              .join(', ')}`
          );
        }
        return lines;
      });
    }
  );
}

function buildListBlock(title: string, items: string[]): string[] {
  if (items.length === 0) return [];
  return [title, ...items.map((item) => `- ${item}`)];
}

export function renderFinalPromptText(
  template: TemplatePayload,
  compiledPayload: CompiledPromptPayload
): string {
  const sections: string[] = [];
  const promptDefinition = template.prompt_definition;
  const outputContract = template.output_contract;

  if (promptDefinition.system_role.trim()) {
    sections.push(`# ROLE: ${promptDefinition.system_role.trim()}`);
  }

  const contextParts: string[] = [];
  if (promptDefinition.task.trim()) {
    contextParts.push(`Task:\n${promptDefinition.task.trim()}`);
  }
  if (promptDefinition.context.trim()) {
    contextParts.push(`Contexto base:\n${promptDefinition.context.trim()}`);
  }

  const menuLines = buildMenuLines(template, compiledPayload);
  if (menuLines.length > 0) {
    contextParts.push(['Menus selecionados:', ...menuLines].join('\n'));
  }

  const freeInputs = Object.entries(compiledPayload.compiled_context.free_inputs || {}).map(
    ([key, value]) => `${key}: ${value}`
  );
  if (freeInputs.length > 0) {
    contextParts.push(['Inputs livres:', ...freeInputs.map((item) => `- ${item}`)].join('\n'));
  }

  if (contextParts.length > 0) {
    sections.push(`## CONTEXT\n${contextParts.join('\n\n')}`);
  }

  const constraintsAndRules: string[] = [];
  const constraintBlock = buildListBlock('Restrições:', promptDefinition.constraints);
  if (constraintBlock.length > 0) {
    constraintsAndRules.push(constraintBlock.join('\n'));
  }
  const negativeBlock = buildListBlock('Evitar:', promptDefinition.negative_prompt);
  if (negativeBlock.length > 0) {
    constraintsAndRules.push(negativeBlock.join('\n'));
  }
  if (outputContract.response_rules.length > 0) {
    const rulesBlock = buildListBlock('Response rules:', outputContract.response_rules);
    constraintsAndRules.push(rulesBlock.join('\n'));
  }
  if (constraintsAndRules.length > 0) {
    sections.push(`## CONSTRAINTS\n${constraintsAndRules.join('\n\n')}`);
  }

  if (promptDefinition.few_shot_examples && promptDefinition.few_shot_examples.length > 0) {
    const exampleLines = promptDefinition.few_shot_examples.map((example, index) => 
      `### Example ${index + 1}:\nINPUT: ${example.input}\nOUTPUT: ${example.output}`
    );
    sections.push(`## FEW-SHOT EXAMPLES\n${exampleLines.join('\n\n')}`);
  }

  const outputLines = [
    `Format: ${outputContract.format}`,
    `Language: ${outputContract.language}`,
    `Strict mode: ${outputContract.strict_mode ? 'yes' : 'no'}`,
  ];
  if (outputContract.required_fields.length > 0) {
    outputLines.push(`Required fields: ${outputContract.required_fields.join(', ')}`);
  }
  sections.push(`## OUTPUT FORMAT\n${outputLines.map((line) => `- ${line}`).join('\n')}`);

  return sections.filter(Boolean).join('\n\n').trim();
}

export function getCompiledPayloadForPrompt(prompt: Prompt): CompiledPromptPayload {
  if (prompt.compiledPayload) {
    return prompt.compiledPayload;
  }

  return compilePromptPayload(
    prompt.promptPayload,
    prompt.selectionPayload || createEmptyUserSelection(prompt.promptPayload.meta.template_id)
  );
}

export function renderPromptTextFromPrompt(prompt: Prompt): string {
  return renderFinalPromptText(prompt.promptPayload, getCompiledPayloadForPrompt(prompt));
}
