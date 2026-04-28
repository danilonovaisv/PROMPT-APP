import type { Client } from 'pg';
import type { SQLExecutor } from '@netlify/dev';
export declare class PgClientExecutor implements SQLExecutor {
    #private;
    constructor(client: Client);
    exec(sql: string): Promise<void>;
    query<T>(sql: string, params?: unknown[]): Promise<{
        rows: T[];
    }>;
    transaction<T>(fn: (tx: SQLExecutor) => Promise<T>): Promise<T>;
}
//# sourceMappingURL=pg-client-executor.d.ts.map