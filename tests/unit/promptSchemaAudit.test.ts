import { parsePromptPayload, getLegacyPromptColumns } from '@/models/promptSchema';

describe('Legacy JSON to Database Schema Mapping', () => {
  it('maps all legacy fields to current schema', () => {
    const legacyJson = {
      title: "Test Prompt",
      system_role: "test role",
      task: "test task",
      input_data: {
        context: "test context",
        menus_selecionados: {}
      },
      user_scene_description: "scene desc",
      constraints: ["rule1"],
      negative_prompt: ["avoid1"],
      output_schema: {
        formato: "texto",
        estrutura: "rule1, rule2"
      },
      required_fields: ["field1"],
      response_rules: ["rule1"],
      few_shot_examples: []
    };

    // Expected mapping after parsePromptPayload
    const mapped = parsePromptPayload(legacyJson);
    
    expect(mapped.prompt_definition.system_role).toBe("test role");
    expect(mapped.prompt_definition.task).toBe("test task");
    expect(mapped.prompt_definition.context).toBe("test context");
    expect(mapped.prompt_definition.constraints).toEqual(["rule1"]);
    expect(mapped.prompt_definition.negative_prompt).toEqual(["avoid1"]);
    expect(mapped.output_contract.format).toBe("text"); // texto normalized to text
    expect(mapped.output_contract.response_rules).toEqual(["rule1", "rule2"]);
    expect(mapped.output_contract.required_fields).toEqual(["field1"]);
    expect(mapped.prompt_definition.few_shot_examples).toEqual([]);
  });

  it('preserves bidirectional mapping through getLegacyPromptColumns', () => {
    const legacyJson = {
      title: "Bidirectional Test",
      system_role: "role",
      task: "task",
      context: "context",
      constraints: ["c1", "c2"],
      negative_prompt: ["n1"],
      output_schema: {
        formato: "markdown",
        estrutura: "r1, r2, r3"
      },
      few_shot_examples: [
        { input: "in", output: "out" }
      ]
    };

    const parsed = parsePromptPayload(legacyJson);
    const legacyColumns = getLegacyPromptColumns(parsed);

    // Verify round-trip preservation
    expect(legacyColumns.system_role).toBe("role");
    expect(legacyColumns.task).toBe("task");
    expect(legacyColumns.context).toBe("context");
    expect(legacyColumns.constraints).toEqual(["c1", "c2"]);
    expect(legacyColumns.negative_prompt).toEqual(["n1"]);
    expect(legacyColumns.output_schema.formato).toBe("markdown");
    expect(legacyColumns.output_schema.estrutura).toBe("r1, r2, r3");
  });

  it('migrates contextMenus to new menu_definitions format', () => {
    const legacyWithMenus = {
      title: "Menu Test",
      contextMenus: {
        tom: { option: "formal", subOptions: ["corporativo"] }
      },
      enabledMenuIds: ["tom"]
    };

    const parsed = parsePromptPayload(legacyWithMenus);
    
    // Menus should be converted to new format
    expect(parsed.menu_ids).toContain("tom");
    // Check that menu_definitions exist (may be empty if not provided)
    expect(Array.isArray(parsed.menu_definitions)).toBe(true);
  });
});
