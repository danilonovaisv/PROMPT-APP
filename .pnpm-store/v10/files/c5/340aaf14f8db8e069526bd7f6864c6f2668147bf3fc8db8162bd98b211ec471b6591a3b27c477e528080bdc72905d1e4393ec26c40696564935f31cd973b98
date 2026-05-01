import type { LogEntry } from '../log-api.js';
interface NetlifyEdgeFunction {
    name: string;
    generator?: string;
}
export declare const listEdgeFunctions: (apiBase: string, accessToken: string | null | undefined, deployId: string) => Promise<NetlifyEdgeFunction[]>;
export declare const fetchEdgeFunctionHistoricalLogs: ({ siteId, accessToken, from, to, deployId, filterNames, }: {
    siteId: string;
    accessToken: string | null | undefined;
    from: number;
    to: number;
    deployId?: string;
    filterNames: string[];
}) => Promise<LogEntry[]>;
export declare const streamEdgeFunctions: (siteId: string, deployId: string, accessToken: string | null | undefined, filterNames: string[], onEntry: (entry: LogEntry) => void) => (() => void);
export {};
//# sourceMappingURL=edge-functions.d.ts.map