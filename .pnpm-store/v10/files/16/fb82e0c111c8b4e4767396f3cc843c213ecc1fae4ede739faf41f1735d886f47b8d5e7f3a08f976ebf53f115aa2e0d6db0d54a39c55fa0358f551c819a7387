import type { NetlifyAPI } from '@netlify/api';
export declare const ANALYTICS_API_BASE = "https://analytics.services.netlify.com";
export declare const DEPLOY_ID_RE: RegExp;
export declare const SOURCE_INDICATORS: Record<LogEntry['source'], string>;
export declare const SOURCE_LABELS: Record<LogEntry['source'], string>;
export interface LogEntry {
    source: 'function' | 'edge-function' | 'deploy';
    name: string;
    ts: number;
    level: string;
    message: string;
    section?: string;
}
export interface HistoricalLogEntry {
    ts: number;
    type: string;
    message: string;
    request_id?: string;
    netlify_request_id?: string;
    level: string;
    section?: string;
    name?: string;
    function?: string;
    request_path?: string;
}
export declare const parseTimeValue: (input: string, now?: number) => number;
export declare const buildFunctionLogsUrl: ({ siteId, branch, functionName, }: {
    siteId: string;
    branch?: string | null;
    functionName: string;
}) => string;
export declare const buildEdgeFunctionLogsUrl: ({ siteId, search }: {
    siteId: string;
    search?: string;
}) => string;
export declare const debugFetch: (url: string, init?: RequestInit) => Promise<Response>;
export declare const fetchHistoricalLogs: ({ baseUrl, accessToken, from, to, deployId, }: {
    baseUrl: string;
    accessToken: string | null | undefined;
    from: number;
    to: number;
    deployId?: string;
}) => Promise<HistoricalLogEntry[]>;
export declare const createColorAssigner: () => ((label: string) => (text: string) => string);
export declare const formatLogLine: (entry: LogEntry, colorFn?: (text: string) => string) => string;
export declare const formatJsonLine: (entry: LogEntry) => string;
export declare const hostnamesForSite: (siteInfo: {
    name?: string;
    custom_domain?: string;
    domain_aliases?: string[];
    url?: string;
    ssl_url?: string;
}) => {
    canonicalHostnames: Set<string>;
    netlifyAppBaseHost: string | null;
};
export declare const resolveDeployIdFromUrl: (urlInput: string, client: NetlifyAPI, siteId: string, siteInfo: {
    name?: string;
    custom_domain?: string;
    domain_aliases?: string[];
    url?: string;
    ssl_url?: string;
}) => Promise<string | undefined>;
//# sourceMappingURL=log-api.d.ts.map