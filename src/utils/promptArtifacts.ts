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
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
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

function applyReplacements(text: string, variables: Record<string, string>): string {
  let result = text || "";
  Object.entries(variables).forEach(([key, value]) => {
    // Escapa a chave para uso em regex (embora chaves geralmente sejam seguras A-Z0-9_)
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`{{${escapedKey}}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
}

export function renderFinalPromptText(
  template: TemplatePayload,
  compiledPayload: CompiledPromptPayload
): string {
  const sections: string[] = [];
  const promptDefinition = template.prompt_definition;
  const outputContract = template.output_contract;
  
  // Coletar todas as variáveis para substituição
  const allVariables = {
    ...(compiledPayload.compiled_context.fixed_variables || {}),
    ...(compiledPayload.compiled_context.free_inputs || {}),
  };

  const systemRole = applyReplacements(promptDefinition.system_role.trim(), allVariables);
  if (systemRole) {
    sections.push(`# ROLE: ${systemRole}`);
  }

  const contextParts: string[] = [];
  const task = applyReplacements(promptDefinition.task.trim(), allVariables);
  if (task) {
    contextParts.push(`Task:\n${task}`);
  }
  
  const baseContext = applyReplacements(promptDefinition.context.trim(), allVariables);
  if (baseContext) {
    contextParts.push(`Contexto base:\n${baseContext}`);
  }
  
  const sceneDescription = applyReplacements(promptDefinition.user_scene_description.trim(), allVariables);
  if (sceneDescription) {
    contextParts.push(`Descrição da cena:\n${sceneDescription}`);
  }

  const menuLines = buildMenuLines(template, compiledPayload);
  if (menuLines.length > 0) {
    contextParts.push(['Menus selecionados:', ...menuLines].join('\n'));
  }

  // Filtrar inputs livres que já foram usados no find-and-replace se desejar,
  // ou manter a lista completa para referência. 
  // O usuário pediu para atualizar o render final. 
  // Geralmente, se a variável foi substituída, não precisamos dela na lista de inputs.
  // No entanto, para evitar confusão, vamos listar apenas os free_inputs (não as fixed_variables).
  const freeInputsList = Object.entries(compiledPayload.compiled_context.free_inputs || {}).map(
    ([key, value]) => `${key}: ${value}`
  );
  if (freeInputsList.length > 0) {
    contextParts.push(['Inputs livres:', ...freeInputsList.map((item) => `- ${item}`)].join('\n'));
  }

  if (contextParts.length > 0) {
    sections.push(`## CONTEXT\n${contextParts.join('\n\n')}`);
  }

  const constraintsAndRules: string[] = [];
  const constraints = promptDefinition.constraints.map(c => applyReplacements(c, allVariables));
  const constraintBlock = buildListBlock('Restrições:', constraints);
  if (constraintBlock.length > 0) {
    constraintsAndRules.push(constraintBlock.join('\n'));
  }
  
  const negativePrompt = promptDefinition.negative_prompt.map(p => applyReplacements(p, allVariables));
  const negativeBlock = buildListBlock('Evitar:', negativePrompt);
  if (negativeBlock.length > 0) {
    constraintsAndRules.push(negativeBlock.join('\n'));
  }
  
  if (outputContract.response_rules.length > 0) {
    const rules = outputContract.response_rules.map(r => applyReplacements(r, allVariables));
    const rulesBlock = buildListBlock('Regras de resposta:', rules);
    constraintsAndRules.push(rulesBlock.join('\n'));
  }
  
  if (constraintsAndRules.length > 0) {
    sections.push(`## CONSTRAINTS\n${constraintsAndRules.join('\n\n')}`);
  }

  if (promptDefinition.few_shot_examples && promptDefinition.few_shot_examples.length > 0) {
    const exampleLines = promptDefinition.few_shot_examples.map((example, index) => {
      const input = applyReplacements(example.input, allVariables);
      const output = applyReplacements(example.output, allVariables);
      return `### Exemplo ${index + 1}:\nENTRADA: ${input}\nSAÍDA: ${output}`;
    });
    sections.push(`## FEW-SHOT EXAMPLES\n${exampleLines.join('\n\n')}`);
  }

  const outputLines = [
    `Formato: ${outputContract.format}`,
    `Idioma: ${outputContract.language}`,
    `Modo estrito: ${outputContract.strict_mode ? 'sim' : 'não'}`,
  ];
  if (outputContract.required_fields.length > 0) {
    outputLines.push(`Campos obrigatórios: ${outputContract.required_fields.join(', ')}`);
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
