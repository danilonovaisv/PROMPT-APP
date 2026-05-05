import { db } from '@/db/database';
import { syncToCloud, downloadFromCloud } from '@/services/syncService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => {
    return {
        isSupabaseConfigured: true,
        assertSupabaseConfigured: jest.fn(),
        supabase: {
            auth: {
                onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
                getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'test-user' } } }, error: null })),
                refreshSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'test-user' } } }, error: null })),
            },
            from: jest.fn(() => ({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        range: jest.fn(() => Promise.resolve({ data: [], error: null })),
                    })),
                })),
                upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
                insert: jest.fn(() => ({
                    select: jest.fn(() => ({
                        single: jest.fn(() => Promise.resolve({ data: { id: 1 }, error: null }))
                    }))
                })),
                delete: jest.fn(() => ({
                    eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
                })),
                update: jest.fn(() => ({
                    eq: jest.fn().mockReturnThis(),
                })),
            })),
        },
    };
});

// Mock Parse/Compile to avoid deep Zod errors for mock data
jest.mock('@/models/promptSchema', () => ({
    parsePromptPayload: jest.fn((p) => p),
    compilePromptPayload: jest.fn((p) => p),
    parseUserSelection: jest.fn((p) => p),
    createEmptyUserSelection: jest.fn((p) => p),
    getPromptSummaryFields: jest.fn((p) => ({ ...p })),
    getLegacyPromptColumns: jest.fn((p) => ({ ...p })),
    getPrimaryReferenceUrl: jest.fn((p) => ""),
    CompiledPromptPayloadSchema: { parse: jest.fn((p) => p) }
}));

describe('Sync Stress Test', () => {
    beforeEach(async () => {
        // Reset DB for each test
        await db.prompts.clear();
        await db.categories.clear();
        await db.contextMenus.clear();
        jest.clearAllMocks();
    });

    it('should handle high-concurrency local updates and sync correctly', async () => {
        // 1. Setup - Create 10 original prompts
        const prompts = Array.from({ length: 10 }, (_, i) => ({
            title: `Prompt ${i}`,
            categoryId: 1,
            schemaVersion: '1.0.0',
            language: 'pt-BR',
            outputFormat: 'markdown',
            fewShotExamples: [],
            promptPayload: { 
                version: '1.0', 
                meta: { 
                    template_id: `t-${i}`,
                    template_name: `Prompt ${i}`,
                    template_type: 'custom',
                    schema_version: '1.0.0',
                    language: 'pt-BR',
                    status: 'active'
                },
                output_contract: { 
                    format: 'markdown',
                    response_rules: []
                },
                prompt_definition: { system_role: '', task: '', context: '', constraints: '', negative_prompt: '', output_schema: '', reference_url: '', few_shot_examples: [] },
                menu_definitions: [],
                menu_ids: []
            },
            syncStatus: 'synced' as const,
            createdAt: new Date(Date.now() - 20000), // 20s ago
            updatedAt: new Date(Date.now() - 10000), // 10s ago
        })) as any[];
        await db.prompts.bulkAdd(prompts);

        // 2. Simulate Stress - 50 concurrent updates to different and same records
        console.log('🚀 Starting concurrent local updates...');
        const updates = Array.from({ length: 50 }, (_, i) => {
            const promptId = (i % 10) + 1; // Loop over the 10 prompts
            return db.prompts.update(promptId, {
                title: `Updated Title ${i}`,
                syncStatus: 'pending',
                updatedAt: new Date(),
            });
        });

        await Promise.all(updates);

        // 3. Trigger Sync
        console.log('🔄 Triggering Cloud Sync...');
        const syncResult = await syncToCloud();
        expect(syncResult).toBe(true);

        // 4. Verify - All should be marked as 'synced'
        const pending = await db.prompts.where('syncStatus').equals('pending').count();
        expect(pending).toBe(0);

        // Verify that supabase.from was called
        expect(supabase.from).toHaveBeenCalledWith('prompts');
    }, 30000);

    it('should maintain data integrity during Smart Merge (Cloud -> Local)', async () => {
        // 1. Mock remote data with 100 items
        const remotePrompts = Array.from({ length: 100 }, (_, i) => ({
            id: i + 1000,
            title: `Remote ${i}`,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            prompt_payload_jsonb: { 
                version: '1.0', 
                meta: { 
                    template_id: `remote-${i}`,
                    template_name: `Remote ${i}`,
                    template_type: 'custom',
                    schema_version: '1.0.0',
                    language: 'pt-BR',
                    status: 'active'
                },
                output_contract: { 
                    format: 'markdown',
                    response_rules: []
                },
                prompt_definition: { system_role: '', task: '', context: '', constraints: '', negative_prompt: '', output_schema: '', reference_url: '', few_shot_examples: [] },
                menu_definitions: [],
                menu_ids: []
            },
            category_id: 1,
            schema_version: '1.0.0',
            language: 'pt-BR',
            output_format: 'markdown',
            is_deleted: false,
        }));

        (supabase.from as jest.Mock).mockImplementation((table: string) => {
            return {
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        // .range() chain required by fetchAllPages in downloadFromCloud
                        range: jest.fn(() => Promise.resolve({ 
                            data: table === 'prompts' ? remotePrompts : [], 
                            error: null 
                        })),
                    })),
                })),
                upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
            } as any;
        });

        // 2. Run Smart Merge
        console.log('☁️ Running massive Smart Merge...');
        await downloadFromCloud();

        // 3. Verify
        const count = await db.prompts.count();
        expect(count).toBe(100);
        
        const first = await db.prompts.toCollection().first();
        expect(first?.syncStatus).toBe('synced');
    });
});
