import { importFromJsonText } from '@/services/importService';
import { db } from '@/db/database';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
    })),
  },
  assertSupabaseConfigured: jest.fn(),
}));

describe('importService Bulk Export', () => {
  beforeEach(async () => {
    await db.prompts.clear();
    await db.categories.clear();
    await db.contextMenus.clear();
    await db.promptMemory.clear();
    jest.clearAllMocks();
  });

  test('should process bulk export with menu definitions', async () => {
    const bulkData = {
      version: '2.0.0',
      menuDefinitions: [
        {
          menu_id: 'test-menu',
          menu_name: 'Test Menu',
          options: [{ value: 'v1', label: 'L1' }]
        }
      ],
      prompts: [
        {
          category: 'Test',
          prompt: {
            meta: { 
              template_id: 't1', 
              template_name: 'P1', 
              template_type: 'custom', 
              schema_version: '1.0.0',
              language: 'pt-BR',
              status: 'active'
            },
            output_contract: { format: 'markdown', language: 'pt-BR', strict_mode: true, required_fields: [], response_rules: [] },
            prompt_definition: { system_role: '', task: '', context: '', user_scene_description: '', constraints: [], negative_prompt: [], few_shot_examples: [] },
            menu_definitions: [],
            menu_ids: ['test-menu']
          }
        }
      ]
    };

    const result = await importFromJsonText(JSON.stringify(bulkData), 'bulk.json');
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    
    const menus = await db.contextMenus.toArray();
    expect(menus.length).toBe(1);
    expect(menus[0].menuId).toBe('test-menu');
  });

  test('should treat legacy menu-only files as menu imports, not prompts', async () => {
    const menuOnly = {
      app: 'Prompt App',
      version: '1.0.0',
      format: 'menu-import',
      exportedAt: '2026-07-25T00:00:00.000Z',
      menuDefinitions: [
        {
          menu_id: 'menu-only',
          menu_name: 'Menu Only',
          description: '',
          selection_mode: 'single',
          required: false,
          options: [{ value: 'v1', label: 'L1', description: '', sub_options: [] }],
        },
      ],
    };

    const result = await importFromJsonText(JSON.stringify(menuOnly), 'menu-only.json');

    expect(result.success).toBe(true);
    expect(result.importedPrompts).toBe(0);
    expect(result.importedMenus).toBe(1);
    expect((await db.prompts.toArray()).length).toBe(0);
    expect((await db.contextMenus.toArray()).length).toBe(1);
  });

  test('should import canonical prompt-app-import envelope with memory context', async () => {
    const canonical = {
      app: 'Prompt App',
      version: '3.0.0',
      format: 'prompt-app-import',
      schemaVersion: '1.1.0',
      exportedAt: '2026-07-25T00:00:00.000Z',
      context_menus: [],
      prompts: [
        {
          meta: {
            template_id: 'memory-template',
            template_name: 'Memory Template',
            template_type: 'generic_prompt',
            schema_version: '1.1.0',
            language: 'pt-BR',
            status: 'active',
          },
          prompt_definition: {
            system_role: 'Consultor',
            task: 'Analise {{memory.nome_empresa}}',
            context: '',
            user_scene_description: '',
            constraints: [],
            negative_prompt: [],
            few_shot_examples: [],
          },
          context_menus: [],
          menu_ids: [],
          prompt_memory_context: {
            enabled: true,
            merge_strategy: 'preserve_existing',
            entries: [
              {
                key: 'nome_empresa',
                label: 'Nome da empresa',
                value: 'Acme',
                type: 'text',
                scope: 'user',
                required: true,
                editable: true,
                description: '',
              },
            ],
          },
          output_contract: {
            format: 'markdown',
            language: 'pt-BR',
            strict_mode: true,
            required_fields: [],
            response_rules: [],
          },
        },
      ],
    };

    const result = await importFromJsonText(JSON.stringify(canonical), 'canonical.json');

    expect(result.success).toBe(true);
    expect(result.importedPrompts).toBe(1);
    expect(result.importedMemory).toBe(1);

    const prompts = await db.prompts.toArray();
    const memory = await db.promptMemory.toArray();
    expect(prompts[0].promptPayload.prompt_memory_context?.entries).toHaveLength(1);
    expect(memory[0].key).toBe('nome_empresa');
    expect(memory[0].value).toBe('Acme');
  });
});
