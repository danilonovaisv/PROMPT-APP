export interface ContextMenuCloudPayload {
  user_id: string;
  menu_id: string;
  menu_name: string;
  description?: string;
  selection_mode?: string;
  options: unknown[];
  is_deleted?: boolean;
  deleted_at?: string | null;
}

export interface ContextMenuSyncResult {
  id: number;
}

export interface ContextMenuSyncRepository {
  findRemoteIdByUserAndMenuId(userId: string, menuId: string): Promise<number | null>;
  insert(payload: ContextMenuCloudPayload): Promise<ContextMenuSyncResult>;
  updateById(id: number, payload: ContextMenuCloudPayload): Promise<ContextMenuSyncResult>;
}

export async function persistContextMenuRecord(
  repository: ContextMenuSyncRepository,
  payload: ContextMenuCloudPayload,
  remoteId?: number,
): Promise<ContextMenuSyncResult> {
  if (remoteId) {
    return repository.updateById(remoteId, payload);
  }

  const existingRemoteId = await repository.findRemoteIdByUserAndMenuId(
    payload.user_id,
    payload.menu_id,
  );

  if (existingRemoteId) {
    return repository.updateById(existingRemoteId, payload);
  }

  return repository.insert(payload);
}
