import type { NetlifyAPI } from '@netlify/api';
import type { LogEntry } from '../log-api.js';
interface NetlifyFunction {
    a: string;
    oid: string;
    n: string;
    branch?: string | null;
}
export declare const listFunctions: (client: NetlifyAPI, siteId: string, deployId?: string) => Promise<NetlifyFunction[]>;
export declare const selectFunctions: (allFunctions: NetlifyFunction[], filterNames: string[]) => NetlifyFunction[];
export declare const validateFunctionCount: (count: number) => void;
export declare const fetchFunctionHistoricalLogs: ({ functions, siteId, accessToken, from, to, deployId, }: {
    functions: NetlifyFunction[];
    siteId: string;
    accessToken: string | null | undefined;
    from: number;
    to: number;
    deployId?: string;
}) => Promise<LogEntry[]>;
export declare const streamFunctions: (functions: NetlifyFunction[], siteId: string, accessToken: string | null | undefined, onEntry: (entry: LogEntry) => void) => (() => void);
export {};
//# sourceMappingURL=functions.d.ts.map