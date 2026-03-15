import { downloadFromCloud } from '@/services/syncService';
import { db } from '@/db/database';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
      }),
    },
    from: jest.fn(),
  },
}));

describe('Sync Performance', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('should measure downloadFromCloud performance', async () => {
    // Generate large number of items
    const numItems = 1000;

    const catData = Array.from({ length: numItems }).map((_, i) => ({
      id: i + 1,
      name: `Category ${i}`,
      icon: 'icon',
      color: 'color',
      created_at: new Date().toISOString(),
    }));

    const menuData = Array.from({ length: numItems }).map((_, i) => ({
      id: i + 1,
      menu_id: `menu_${i}`,
      menu_name: `Menu ${i}`,
      description: 'desc',
      selection_mode: 'single',
      options: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const promptData = Array.from({ length: numItems }).map((_, i) => ({
      id: i + 1,
      category_id: i + 1,
      title: `Prompt ${i}`,
      prompt_payload_jsonb: {
        meta: { template_id: `template_${i}`, author: 'test', version: '1.0' },
        system_role: 'role',
        task: 'task',
        input_data: {},
        output_schema: { type: 'text' }
      },
      schema_version: '1.0',
      language: 'pt-BR',
      output_format: 'text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    (supabase.from as jest.Mock).mockImplementation((table) => {
      let data = [];
      if (table === 'categories') data = catData;
      if (table === 'context_menus') data = menuData;
      if (table === 'prompts') data = promptData;
      return {
        select: jest.fn().mockResolvedValue({ data, error: null })
      };
    });

    const start = performance.now();
    await downloadFromCloud();
    const end = performance.now();

    console.log(`Sync took ${end - start} ms for ${numItems} items of each type.`);
  });
});
