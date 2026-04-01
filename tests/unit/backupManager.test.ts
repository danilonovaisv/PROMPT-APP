import { jest } from "@jest/globals";
import { getLocalBackupInfo } from '@/utils/backupManager';

describe('backupManager', () => {
    describe('getLocalBackupInfo', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            localStorage.clear();
        });

        it('should return null when no backup exists', () => {
            const result = getLocalBackupInfo();
            expect(result).toBeNull();
        });

        it('should return parsed backup info when valid backup exists', () => {
            const mockSnapshot = {
                version: '2.0.0',
                timestamp: '2023-01-01T12:00:00.000Z',
                data: {
                    categories: [{}, {}],
                    prompts: [{}, {}, {}],
                    contextMenus: []
                }
            };

            localStorage.setItem('prompt_app_global_backup', JSON.stringify(mockSnapshot));

            const result = getLocalBackupInfo();

            expect(result).toEqual({
                timestamp: '2023-01-01T12:00:00.000Z',
                count: {
                    prompts: 3,
                    categories: 2
                }
            });
        });

        it('should return null when backup data is invalid JSON', () => {
            localStorage.setItem('prompt_app_global_backup', 'invalid-json');

            const result = getLocalBackupInfo();

            expect(result).toBeNull();
        });
    });
});
