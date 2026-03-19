import {
  persistContextMenuRecord,
  type ContextMenuCloudPayload,
  type ContextMenuSyncRepository,
} from '@/services/contextMenuSync';

function buildPayload(overrides: Partial<ContextMenuCloudPayload> = {}): ContextMenuCloudPayload {
  return {
    user_id: 'user-123',
    menu_id: 'tom',
    menu_name: 'Tom',
    description: 'Define o tom',
    selection_mode: 'single',
    options: [{ label: 'Formal', value: 'formal' }],
    ...overrides,
  };
}

function buildRepository(): jest.Mocked<ContextMenuSyncRepository> {
  return {
    findRemoteIdByUserAndMenuId: jest.fn(),
    insert: jest.fn(),
    updateById: jest.fn(),
  };
}

describe('persistContextMenuRecord', () => {
  test('atualiza pelo remoteId existente quando o menu já foi sincronizado', async () => {
    const repository = buildRepository();
    repository.updateById.mockResolvedValue({ id: 77 });

    const result = await persistContextMenuRecord(repository, buildPayload(), 77);

    expect(repository.findRemoteIdByUserAndMenuId).not.toHaveBeenCalled();
    expect(repository.insert).not.toHaveBeenCalled();
    expect(repository.updateById).toHaveBeenCalledWith(77, buildPayload());
    expect(result).toEqual({ id: 77 });
  });

  test('reaproveita o registro remoto existente quando ainda não há remoteId local', async () => {
    const repository = buildRepository();
    repository.findRemoteIdByUserAndMenuId.mockResolvedValue(42);
    repository.updateById.mockResolvedValue({ id: 42 });

    const result = await persistContextMenuRecord(repository, buildPayload());

    expect(repository.findRemoteIdByUserAndMenuId).toHaveBeenCalledWith('user-123', 'tom');
    expect(repository.insert).not.toHaveBeenCalled();
    expect(repository.updateById).toHaveBeenCalledWith(42, buildPayload());
    expect(result).toEqual({ id: 42 });
  });

  test('insere um novo registro quando ainda não existe menu remoto para o usuário', async () => {
    const repository = buildRepository();
    repository.findRemoteIdByUserAndMenuId.mockResolvedValue(null);
    repository.insert.mockResolvedValue({ id: 15 });

    const result = await persistContextMenuRecord(repository, buildPayload());

    expect(repository.findRemoteIdByUserAndMenuId).toHaveBeenCalledWith('user-123', 'tom');
    expect(repository.updateById).not.toHaveBeenCalled();
    expect(repository.insert).toHaveBeenCalledWith(buildPayload());
    expect(result).toEqual({ id: 15 });
  });
});
