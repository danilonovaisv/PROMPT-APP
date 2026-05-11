import type { ContextMenu } from "@/models/types";
import {
  createEmptyPromptPayload,
  type TemplatePayload,
} from "@/models/promptSchema";
import {
  contextMenuToDefinition,
  renderFinalPromptText,
  syncTemplateWithLinkedMenus,
  syncTemplateWithMenuDefinitions,
} from "@/utils/promptArtifacts";

function buildContextMenu(overrides: Partial<ContextMenu> = {}): ContextMenu {
  return {
    id: 1,
    menuId: "tom",
    menuName: "Tom",
    description: "Define o tom",
    selectionMode: "single",
    options: [
      {
        label: "Formal",
        value: "formal",
        subOptions: [{ label: "Corporativo", value: "corporativo" }],
      },
    ],
    createdAt: new Date("2026-03-10T00:00:00.000Z"),
    updatedAt: new Date("2026-03-10T00:00:00.000Z"),
    ...overrides,
  };
}

describe("syncTemplateWithLinkedMenus", () => {
  test("materializa snapshots dos menus vinculados e remove ids desconhecidos", () => {
    const template = {
      ...createEmptyPromptPayload("Template com menus"),
      menu_ids: ["tom", "desconhecido", "tom"],
    } satisfies TemplatePayload;

    const synced = syncTemplateWithLinkedMenus(template, [buildContextMenu()]);

    expect(synced.menu_ids).toEqual(["tom"]);
    expect(synced.menu_definitions).toHaveLength(1);
    expect(synced.menu_definitions[0]).toEqual(
      contextMenuToDefinition(buildContextMenu()),
    );
  });
});

describe("syncTemplateWithMenuDefinitions", () => {
  test("hidrata snapshots a partir de definições importadas quando o template só traz menu_ids", () => {
    const importedDefinition = contextMenuToDefinition(buildContextMenu());
    const template = {
      ...createEmptyPromptPayload("Template importado"),
      menu_ids: ["tom"],
      menu_definitions: [],
    } satisfies TemplatePayload;

    const synced = syncTemplateWithMenuDefinitions(template, [
      importedDefinition,
    ]);

    expect(synced.menu_ids).toEqual(["tom"]);
    expect(synced.menu_definitions).toEqual([importedDefinition]);
  });
});

describe("contextMenuToDefinition", () => {
  test("normaliza options inválido sem lançar erro de map em valor não-array", () => {
    const malformedMenu = buildContextMenu({
      options: {
        label: "Formal",
        value: "formal",
        sub_options: { label: "Corporativo", value: "corporativo" },
      } as unknown as ContextMenu["options"],
    });

    expect(contextMenuToDefinition(malformedMenu).options).toEqual([
      {
        label: "Formal",
        value: "formal",
        description: "",
        sub_options: [{
          label: "Corporativo",
          value: "corporativo",
          description: "",
        }],
      },
    ]);
  });
});

describe("renderFinalPromptText", () => {
  test("gera um prompt final legível com menus, inputs livres e contrato de saída", () => {
    const template = syncTemplateWithLinkedMenus(
      {
        ...createEmptyPromptPayload("Template operacional"),
        prompt_definition: {
          system_role: "Você é um estrategista de prompts.",
          task: "Gerar um prompt final reutilizável.",
          context: "Contexto base do projeto.",
          user_scene_description: "",
          constraints: ["Ser preciso", "Manter clareza"],
          negative_prompt: ["Não inventar contexto"],
          few_shot_examples: [],
        },
        output_contract: {
          format: "markdown",
          language: "pt-BR",
          strict_mode: true,
          required_fields: ["titulo", "corpo"],
          response_rules: ["Responder em português"],
        },
        menu_ids: ["tom"],
      },
      [buildContextMenu()],
    );

    const rendered = renderFinalPromptText(template, {
      template_id: template.meta.template_id,
      meta: {
        template_name: template.meta.template_name,
        template_type: template.meta.template_type,
        schema_version: template.meta.schema_version,
        language: template.meta.language,
      },
      compiled_context: {
        menu_interpretation: {
          tom: {
            selected_options: ["formal"],
            selected_sub_options: ["corporativo"],
            selections: [
              {
                option_value: "formal",
                option_label: "Formal",
                selected_sub_options: [{
                  value: "corporativo",
                  label: "Corporativo",
                }],
              },
            ],
          },
        },
        free_inputs: {
          objetivo: "Auditar o fluxo final",
        },
      },
      prompt_definition: template.prompt_definition,
      output_contract: template.output_contract,
    });

    expect(rendered).toContain("Você é um estrategista de prompts.");
    expect(rendered).toContain("Tom: Formal");
    expect(rendered).toContain("Sub-opções: Corporativo");
    expect(rendered).toContain("objetivo: Auditar o fluxo final");
    expect(rendered).toContain("Formato: markdown");
    expect(rendered).toContain("Campos obrigatórios: titulo, corpo");
  });

  test("injeta variáveis de memória fixa e inputs livres no texto final", () => {
    const template = createEmptyPromptPayload("Template com Variáveis");
    template.prompt_definition.system_role = "Você é um especialista em {{TOPICO}}.";
    template.prompt_definition.task = "Ajudar com {{DEMANDA}}.";

    const rendered = renderFinalPromptText(template, {
      template_id: template.meta.template_id,
      meta: {
        template_name: template.meta.template_name,
        template_type: template.meta.template_type,
        schema_version: template.meta.schema_version,
        language: template.meta.language,
      },
      compiled_context: {
        menu_interpretation: {},
        free_inputs: {
          DEMANDA: "escrita criativa",
        },
        fixed_variables: {
          TOPICO: "literatura",
        },
      },
      prompt_definition: template.prompt_definition,
      output_contract: template.output_contract,
    });

    expect(rendered).toContain("Você é um especialista em literatura.");
    expect(rendered).toContain("Ajudar com escrita criativa.");
  });
});
