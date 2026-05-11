import { jest } from "@jest/globals";
import { saveLocalBackup, getLocalBackupInfo } from '@/utils/backupManager';
import { decrypt } from '@/utils/crypto';
import { db } from '@/db/database';

describe('Backup Encryption', () => {
    const BACKUP_KEY = 'prompt_app_global_backup';

    beforeEach(async () => {
        jest.clearAllMocks();
        localStorage.clear();
        await db.categories.clear();
        await db.prompts.clear();
        await db.contextMenus.clear();
    });

    it('should save backup encrypted in LocalStorage', async () => {
        // Setup initial data
        await db.categories.add({
            name: 'Test Category',
            icon: '📁',
            color: '#000000',
            createdAt: new Date()
        });

        await saveLocalBackup();

        const storedData = localStorage.getItem(BACKUP_KEY);
        expect(storedData).not.toBeNull();

        // Should NOT be plain JSON
        expect(storedData!.startsWith('{')).toBe(false);

        // Should be decryptable
        const decrypted = await decrypt(storedData!);
        expect(decrypted).not.toBeNull();

        const parsed = JSON.parse(decrypted!);
        expect(parsed.data.categories[0].name).toBe('Test Category');
    });

    it('should be able to read back encrypted backup info', async () => {
        await db.categories.add({
            name: 'Test Category',
            icon: '📁',
            color: '#000000',
            createdAt: new Date()
        });

        await saveLocalBackup();

        const info = await getLocalBackupInfo();
        expect(info).not.toBeNull();
        expect(info?.count.categories).toBeGreaterThan(0);
    });

    it('should still handle legacy unencrypted backups', async () => {
        const legacySnapshot = {
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            data: {
                categories: [{ name: 'Legacy' }],
                prompts: [],
                contextMenus: []
            }
        };

        localStorage.setItem(BACKUP_KEY, JSON.stringify(legacySnapshot));

        const info = await getLocalBackupInfo();
        expect(info).not.toBeNull();
        expect(info?.count.categories).toBe(1);
    });
});
