import BaseCommand from '../base-command.js';
import { type MigrationFile } from './util/applied-migrations.js';
export interface DatabaseStatusOptions {
    branch?: string;
    showCredentials?: boolean;
    json?: boolean;
}
interface MigrationEntry {
    version: number;
    name: string;
}
interface OutOfOrderEntry extends MigrationEntry {
    maxApplied: number;
}
interface MigrationsStatus {
    applied: MigrationEntry[];
    pending: MigrationEntry[];
    missingOnDisk: MigrationEntry[];
    outOfOrder: OutOfOrderEntry[];
}
export declare const computeStatus: (applied: MigrationFile[], local: MigrationEntry[]) => MigrationsStatus;
export declare const statusDb: (options: DatabaseStatusOptions, command: BaseCommand) => Promise<void>;
export {};
//# sourceMappingURL=db-status.d.ts.map