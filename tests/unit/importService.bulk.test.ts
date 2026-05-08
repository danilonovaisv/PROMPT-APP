import { importFromJsonText } from '@/services/importService';
import { db } from '@/db/database';
import { supabase } from '@/lib/supabase';

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
            version: '1.0',
            meta: { 
              template_id: 't1', 
              template_name: 'P1', 
              template_type: 'custom', 
              schema_version: '1.0.0',
              language: 'pt-BR',
              status: 'active'
            },
            output_contract: { format: 'markdown', response_rules: [] },
            prompt_definition: { system_role: '', task: '', context: '', constraints: '', negative_prompt: '', output_schema: '', reference_url: '', few_shot_examples: [] },
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
});
