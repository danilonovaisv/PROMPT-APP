import { toExportFormat, formatPromptAsMarkdown, getTemplateFile } from "@/utils/exportJson";
import {
  type CompiledPromptPayload,
  PromptContractSchema,
  type TemplatePayload,
} from "@/models/promptSchema";
import { Prompt } from "@/models/types";

describe("toExportFormat", () => {
  const mockTemplatePayload: TemplatePayload = {
    meta: {
      template_id: 'test_prompt',
      template_name: 'Test Prompt',
      template_type: 'generic_prompt',
      schema_version: '1.0.0',
      language: 'pt-BR',
      status: 'active',
    },
    prompt_definition: {
      system_role: 'System Role',
      task: 'Task',
      context: 'Context',
      user_scene_description: '',
      constraints: ['Constraint 1'],
      negative_prompt: ['Negative 1'],
      few_shot_examples: [],
    },
    menu_definitions: [],
    menu_ids: [],
    output_contract: {
      format: 'markdown',
      language: 'pt-BR',
      strict_mode: true,
      required_fields: [],
      response_rules: [],
    },
  };

  const mockPrompt: Prompt = {
    id: 1,
    categoryId: 1,
    title: 'Test Prompt',
    promptPayload: mockTemplatePayload,
    schemaVersion: '1.0.0',
    language: 'pt-BR',
    outputFormat: 'markdown',
    fewShotExamples: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should correctly transform a valid Prompt into a PromptContract', () => {
    const result = toExportFormat(mockPrompt);
    expect(result).toEqual(mockTemplatePayload);
  });

  it('should throw an error if the promptPayload is invalid', () => {
    const invalidPrompt = {
      ...mockPrompt,
      promptPayload: {
        ...mockTemplatePayload,
        meta: {
          ...mockTemplatePayload.meta,
          template_id: '', // Invalid: min(1)
        },
      },
    } as unknown as Prompt;

    expect(() => toExportFormat(invalidPrompt)).toThrow();
  });
});

describe("getTemplateFile", () => {
  it("returns a Blob with valid JSON content matching PromptContractSchema", async () => {
    const blob = getTemplateFile();

    // Verify it is a Blob
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");

    // Extract text from Blob
    const text = await blob.text();
    const json = JSON.parse(text);

    // Verify it matches the schema
    const result = PromptContractSchema.safeParse(json);
    if (!result.success) {
      console.error(JSON.stringify(result.error.format(), null, 2));
    }
    expect(result.success).toBe(true);

    // Verify specific fields
    if (result.success) {
      expect(result.data.meta.template_id).toBe("novo_template");
      expect(result.data.meta.template_name).toBe("Novo Template");
      expect(result.data.meta.status).toBe("draft");
      expect(result.data.prompt_definition).toBeDefined();
      expect(result.data.output_contract).toBeDefined();
    }
  });
});

describe("formatPromptAsMarkdown", () => {
  it("formats a minimal prompt correctly", () => {
    const template: Partial<TemplatePayload> = {
      prompt_definition: {
        system_role: "You are a helpful assistant",
        task: "Summarize the text",
        context: "",
        user_scene_description: "",
        constraints: [],
        negative_prompt: [],
        few_shot_examples: [],
      },
      menu_definitions: [],
      output_contract: {
        format: "markdown",
        language: "pt-BR",
        strict_mode: true,
        required_fields: [],
        response_rules: [],
      },
    };

    const compiledPayload: Partial<CompiledPromptPayload> = {
      compiled_context: {
        fixed_variables: {
          Infrastructure: 'Netlify Edge',
        },
        menu_interpretation: {},
        free_inputs: {},
      },
    };

    const result = formatPromptAsMarkdown(
      template as TemplatePayload,
      compiledPayload as CompiledPromptPayload,
    );

    expect(result).toContain("# ROLE: You are a helpful assistant");
    expect(result).toContain("## 1. CONTEXT & TASK");
    expect(result).toContain("Summarize the text");
    expect(result).toContain("## 2. DYNAMIC PARAMETERS");
    expect(result).toContain("- **Infrastructure**: Netlify Edge (from project context)");
    expect(result).toContain("## 3. RULES & CONSTRAINTS");
  });

  it("formats a full prompt with selections correctly", () => {
    const template: Partial<TemplatePayload> = {
      prompt_definition: {
        system_role: "Expert coder",
        task: "Write a function",
        context: "Project Alpha",
        user_scene_description: "",
        constraints: ["Use TypeScript"],
        negative_prompt: ["No classes"],
        few_shot_examples: [],
      },
      menu_definitions: [
        {
          menu_id: "lang",
          menu_name: "Language",
          options: [],
          selection_mode: "single",
          required: false,
          description: "",
        },
      ],
      output_contract: {
        format: "markdown",
        language: "en-US",
        strict_mode: true,
        required_fields: [],
        response_rules: [],
      },
    };

    const compiledPayload: Partial<CompiledPromptPayload> = {
      compiled_context: {
        menu_interpretation: {
          lang: {
            selections: [
              {
                option_label: "TypeScript",
                selected_sub_options: [{ label: "Strict", value: "strict" }],
                option_value: "ts",
              },
            ],
            selected_options: [],
            selected_sub_options: [],
          },
        },
        fixed_variables: {
          Runtime: 'Supabase Realtime',
        },
        free_inputs: {
          Username: "Jules",
        },
      },
    };

    const result = formatPromptAsMarkdown(
      template as TemplatePayload,
      compiledPayload as CompiledPromptPayload,
    );

    expect(result).toContain("# ROLE: Expert coder");
    expect(result).toContain("Project Alpha");
    expect(result).toContain("Write a function");
    expect(result).toContain("- **Language**: TypeScript (Strict)");
    expect(result).toContain("- **Runtime**: Supabase Realtime (from project context)");
    expect(result).toContain("- **Username**: Jules");
    expect(result).toContain("- Use TypeScript");
    expect(result).toContain("- No classes");
  });

  it("formats a prompt with selected_options fallback correctly", () => {
    const template: Partial<TemplatePayload> = {
      prompt_definition: {
        system_role: "Expert coder",
        task: "Write a function",
        context: "",
        user_scene_description: "",
        constraints: [],
        negative_prompt: [],
        few_shot_examples: [],
      },
      menu_definitions: [
        {
          menu_id: "lang",
          menu_name: "Language",
          options: [
            {
              label: "TypeScript",
              value: "ts",
              sub_options: [
                { label: "Strict", value: "strict", description: "" },
              ],
              description: "",
            },
          ],
          selection_mode: "single",
          required: false,
          description: "",
        },
      ],
      output_contract: {
        format: "markdown",
        language: "en-US",
        strict_mode: true,
        required_fields: [],
        response_rules: [],
      },
    };

    const compiledPayload: Partial<CompiledPromptPayload> = {
      compiled_context: {
        menu_interpretation: {
          lang: {
            selections: [],
            selected_options: ["ts"],
            selected_sub_options: ["strict"],
          },
        },
        free_inputs: {},
      },
    };

    const result = formatPromptAsMarkdown(
      template as TemplatePayload,
      compiledPayload as CompiledPromptPayload,
    );

    expect(result).toContain("- **Language**: TypeScript (Strict)");
    expect(result).toContain("- **Runtime**: Supabase Realtime (from project context)");
  });

  it('should include few-shot examples if present', () => {
    const template: Partial<TemplatePayload> = {
      prompt_definition: {
        system_role: "Assistant",
        task: "Task",
        context: "",
        user_scene_description: "",
        constraints: [],
        negative_prompt: [],
        few_shot_examples: [
          { input: 'Hello', output: 'Olá' }
        ],
      },
      menu_definitions: [],
      output_contract: {
        format: "markdown",
        language: "pt-BR",
        strict_mode: true,
        required_fields: [],
        response_rules: [],
      },
    };

    const compiledPayload: Partial<CompiledPromptPayload> = {
      compiled_context: {
        fixed_variables: {
          Infrastructure: 'Netlify Edge',
        },
        menu_interpretation: {},
        free_inputs: {},
      },
    };

    const result = formatPromptAsMarkdown(template as TemplatePayload, compiledPayload as CompiledPromptPayload);
    expect(result).toContain('## 4. FEW-SHOT EXAMPLES');
    expect(result).toContain('### Example 1:');
    expect(result).toContain('INPUT: Hello');
    expect(result).toContain('OUTPUT: Olá');
  });
});
