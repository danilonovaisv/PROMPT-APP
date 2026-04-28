import { Client } from 'pg';
import { type SQLExecutor } from '@netlify/dev';
interface DBConnection {
    executor: SQLExecutor;
    connectionString: string;
    cleanup: () => Promise<void>;
}
export declare function connectToDatabase(buildDir: string, urlOverride?: string): Promise<DBConnection>;
interface RawDBConnection {
    client: Client;
    connectionString: string;
    cleanup: () => Promise<void>;
}
export declare function detectExistingLocalConnectionString(buildDir: string): string | null;
export declare const describeError: (err: unknown) => string;
export declare function connectRawClient(buildDir: string, urlOverride?: string): Promise<RawDBConnection>;
export {};
//# sourceMappingURL=db-connection.d.ts.map