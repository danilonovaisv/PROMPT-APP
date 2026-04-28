import type { NetlifyAPI } from '@netlify/api';
import type { LogEntry } from '../log-api.js';
export declare const fetchDeployHistoricalLogs: ({ apiBase, accessToken, deployId, from, to, }: {
    apiBase: string;
    accessToken: string | null | undefined;
    deployId: string;
    from: number;
    to: number;
}) => Promise<LogEntry[]>;
export declare const streamDeploy: (siteId: string, deployId: string, accessToken: string | null | undefined, onEntry: (entry: LogEntry) => void, onClose: () => void) => (() => void);
export declare const findCurrentBuildingDeploy: (client: NetlifyAPI, siteId: string) => Promise<string | undefined>;
export declare const findLatestReadyDeploy: (client: NetlifyAPI, siteId: string) => Promise<string | undefined>;
//# sourceMappingURL=deploy.d.ts.map