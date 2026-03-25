import { getTemplateFile } from '@/utils/exportJson';
import { PromptContractSchema } from '@/models/promptSchema';

describe('getTemplateFile', () => {
  it('returns a Blob with valid JSON content matching PromptContractSchema', async () => {
    const blob = getTemplateFile();

    // Verify it is a Blob
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/json');

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
      expect(result.data.meta.template_id).toBe('novo_template');
      expect(result.data.meta.template_name).toBe('Novo Template');
      expect(result.data.meta.status).toBe('draft');
      expect(result.data.prompt_definition).toBeDefined();
      expect(result.data.output_contract).toBeDefined();
    }
  });
});
