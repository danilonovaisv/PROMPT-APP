interface SQLExecutor {
    exec(sql: string): Promise<unknown>;
    query<T>(sql: string, params?: unknown[]): Promise<{
        rows: T[];
    }>;
    transaction<T>(fn: (tx: Pick<SQLExecutor, 'exec' | 'query'>) => Promise<T>): Promise<T>;
}

declare function initializeTrackingTable(db: SQLExecutor): Promise<void>;
declare function applyMigrations(db: SQLExecutor, migrationsDirectory: string, target?: string): Promise<string[]>;

type Logger = (...message: unknown[]) => void;
interface NetlifyDBOptions {
    /**
     * Directory for data persistence. If not provided, uses in-memory storage.
     */
    directory?: string;
    /**
     * Function to log messages. Defaults to `console.log`.
     */
    logger?: Logger;
    /**
     * Port to run the database server on. If not provided, picks a random available port.
     */
    port?: number;
}
declare function resetDatabase(db: SQLExecutor): Promise<void>;
declare class NetlifyDB implements SQLExecutor {
    private db?;
    private directory?;
    private logger;
    private port?;
    private server?;
    private connections;
    private unsubNotification?;
    constructor({ directory, logger, port }?: NetlifyDBOptions);
    start(): Promise<string>;
    applyMigrations(migrationsDirectory: string, target?: string): Promise<string[]>;
    reset(): Promise<void>;
    exec(sql: string): Promise<unknown>;
    query<T>(sql: string, params?: unknown[]): Promise<{
        rows: T[];
    }>;
    transaction<T>(fn: (tx: Pick<SQLExecutor, 'exec' | 'query'>) => Promise<T>): Promise<T>;
    stop(): Promise<void>;
    private handleConnection;
}

export { NetlifyDB, type NetlifyDBOptions, type SQLExecutor, applyMigrations, initializeTrackingTable, resetDatabase };
