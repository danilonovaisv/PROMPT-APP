import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EditorPage from '@/pages/EditorPage';
import { createEmptyPromptPayload, createEmptyUserSelection } from '@/models/promptSchema';
import type { Category, ContextMenu, Prompt } from '@/models/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';

const showToast = jest.fn();
let liveQueryRenderCount = 0;

const categories: Category[] = [
  {
    id: 1,
    name: 'Copywriting',
    icon: '✍️',
    color: '#ff6b35',
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    syncStatus: 'synced',
  },
];

const contextMenus: ContextMenu[] = [
  {
    id: 7,
    remoteId: 700,
    menuId: 'tone',
    menuName: 'Tone',
    description: 'Choose the tone',
    selectionMode: 'single',
    options: [],
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    syncStatus: 'synced',
  },
];

jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: jest.fn(),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ showToast }),
}));

jest.mock('@/hooks/useAccessibleModal', () => ({
  useAccessibleModal: jest.fn(),
}));

jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: unknown) => value,
}));

jest.mock('@/services/supabasePrompts', () => ({
  savePromptToSupabase: jest.fn(),
}));

jest.mock('@/utils/templateMigration', () => ({
  migrateTemplateToCurrentSchema: jest.fn((value) => ({
    template: value,
    warnings: [],
  })),
}));

jest.mock('@/utils/promptArtifacts', () => ({
  renderFinalPromptText: jest.fn(() => 'rendered prompt'),
  syncTemplateWithLinkedMenus: jest.fn((template) => template),
}));

jest.mock('@/components/Breadcrumb', () => ({
  Breadcrumb: ({ items }: { items: Array<{ label: string }> }) => (
    <nav data-testid="breadcrumb">{items.map((item) => item.label).join(' / ')}</nav>
  ),
}));

jest.mock('@/components/editor/EditorMetaForm', () => ({
  EditorMetaForm: ({ template, categoryId }: { template: { meta: { template_name: string } }; categoryId: number }) => (
    <div data-testid="meta-state">
      {template.meta.template_name}|{categoryId}
    </div>
  ),
}));

jest.mock('@/components/editor/EditorDefinitionForm', () => ({
  EditorDefinitionForm: ({
    selectedMenuIds,
    availableContextMenus,
  }: {
    selectedMenuIds: number[];
    availableContextMenus: ContextMenu[];
  }) => (
    <div data-testid="definition-state">
      {JSON.stringify(selectedMenuIds)}|{availableContextMenus.length}
    </div>
  ),
}));

jest.mock('@/components/editor/EditorPlayground', () => ({
  EditorPlayground: ({
    selection,
    selectedMenuIds,
  }: {
    selection: { template_id: string };
    selectedMenuIds: number[];
  }) => (
    <div data-testid="playground-state">
      {selection.template_id}|{JSON.stringify(selectedMenuIds)}
    </div>
  ),
}));

jest.mock('@/components/editor/EditorPreviewModal', () => ({
  EditorPreviewModal: ({ payload }: { payload: unknown }) => (
    <div data-testid="preview-state">{payload ? 'ready' : 'empty'}</div>
  ),
}));

jest.mock('@/db/database', () => ({
  db: {
    categories: {
      toArray: jest.fn(),
      get: jest.fn(),
    },
    prompts: {
      get: jest.fn(),
    },
    contextMenus: {
      toArray: jest.fn(),
    },
  },
}));

jest.mock('@/models/promptSchema', () => {
  const actual = jest.requireActual('@/models/promptSchema');

  return {
    ...actual,
    parsePromptPayload: actual.parsePromptPayload,
    parseUserSelection: actual.parseUserSelection,
    compilePromptPayload: actual.compilePromptPayload,
  };
});

describe('Editor state consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    liveQueryRenderCount = 0;
    localStorage.clear();

    (useLiveQuery as jest.Mock).mockImplementation(() => {
      liveQueryRenderCount += 1;
      return liveQueryRenderCount === 1 ? [] : contextMenus;
    });

    (db.categories.filter as jest.Mock).mockReturnValue({
      toArray: jest.fn().mockResolvedValue(categories)
    });
    (db.categories.toArray as jest.Mock).mockResolvedValue(categories);
    (db.categories.get as jest.Mock).mockResolvedValue(categories[0]);
    (db.contextMenus.toArray as jest.Mock).mockResolvedValue(contextMenus);

    const promptPayload = createEmptyPromptPayload('Old template');
    promptPayload.meta.template_id = 'existing-template';
    promptPayload.meta.template_name = 'Old template';
    promptPayload.menu_ids = ['tone'];

    const promptSelection = createEmptyUserSelection('existing-template');

    const prompt: Prompt = {
      id: 42,
      categoryId: 1,
      title: 'Old template',
      selectedMenuIds: [],
      promptPayload,
      selectionPayload: promptSelection,
      compiledPayload: {
        template_id: 'existing-template',
        meta: {
          template_name: 'Old template',
          template_type: 'prompt',
          schema_version: '1.0.0',
          language: 'pt-BR',
        },
        compiled_context: {
          menu_interpretation: {},
          free_inputs: {},
        },
        prompt_definition: promptPayload.prompt_definition,
        output_contract: promptPayload.output_contract,
      },
      schemaVersion: '1.0.0',
      language: 'pt-BR',
      outputFormat: 'markdown',
      fewShotExamples: [],
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
      updatedAt: new Date('2026-04-01T00:00:00.000Z'),
      syncStatus: 'synced',
    };

    (db.prompts.get as jest.Mock).mockResolvedValue(prompt);

    const draftPayload = createEmptyPromptPayload('Draft wins');
    draftPayload.meta.template_id = 'draft-template';
    draftPayload.meta.template_name = 'Draft wins';
    draftPayload.menu_ids = ['tone'];

    const draftSelection = createEmptyUserSelection('draft-template');
    draftSelection.selected_menus = [
      {
        menu_id: 'tone',
        selected_options: [{ option_value: 'formal', selected_sub_options: [] }],
      },
    ];

    localStorage.setItem(
      'template_draft_42',
      JSON.stringify({
        categoryId: 1,
        template: draftPayload,
        selection: draftSelection,
        freeInputs: [{ key: 'audience', value: 'founders' }],
        selectedMenuIds: [7],
      }),
    );
  });

  test('draft state survives async menu hydration without losing menu selection', async () => {
    render(
      <MemoryRouter initialEntries={['/editor/42']}>
        <Routes>
          <Route path="/editor/:id" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId('meta-state')).toHaveTextContent('Draft wins|1'));
    await waitFor(() => expect(screen.getByTestId('definition-state')).toHaveTextContent('[7]|1'));
    await waitFor(() => expect(screen.getByTestId('playground-state')).toHaveTextContent('draft-template|[7]'));
    expect(showToast).toHaveBeenCalledWith('Rascunho recuperado automaticamente!', 'info');
  });
});
