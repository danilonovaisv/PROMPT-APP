import { type SQLExecutor } from '@netlify/dev';
export interface MigrationFile {
    version: number;
    name: string;
    path: string;
}
export type AppliedMigrationsFetcher = () => Promise<MigrationFile[]>;
interface RemoteOptions {
    siteId: string;
    accessToken: string;
    basePath: string;
    branch: string;
}
export declare const remoteAppliedMigrations: (options: RemoteOptions) => AppliedMigrationsFetcher;
interface LocalOptions {
    executor: SQLExecutor;
}
export declare const localAppliedMigrations: (options: LocalOptions) => AppliedMigrationsFetcher;
export {};
//# sourceMappingURL=applied-migrations.d.ts.map