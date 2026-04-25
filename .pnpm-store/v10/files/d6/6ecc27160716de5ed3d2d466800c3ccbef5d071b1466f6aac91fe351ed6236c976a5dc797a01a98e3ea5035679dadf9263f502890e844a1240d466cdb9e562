import fs from 'fs';
import type { StatusCallback } from './status-cb.js';
interface DropDeployInfo {
    id: string;
    deploy_id: string;
    subdomain: string;
    url: string;
    state: string;
    required: string[];
}
interface DropApiOptions {
    apiBase: string;
    userAgent: string;
}
export interface DropApiError extends Error {
    status?: number;
}
export declare const getDropToken: ({ apiBase, userAgent }: DropApiOptions) => Promise<string>;
export declare const createDropDeploy: ({ apiBase, userAgent }: DropApiOptions, files: Record<string, string>, token: string, createdVia?: string) => Promise<DropDeployInfo>;
export declare const uploadDropFile: ({ apiBase, userAgent }: DropApiOptions, deployId: string, filePath: string, body: fs.ReadStream | Buffer, token: string) => Promise<void>;
export declare const waitForDropDeploy: ({ apiBase, userAgent }: DropApiOptions, siteId: string, deployId: string, timeout?: number) => Promise<Record<string, unknown>>;
export declare const claimDropSite: ({ apiBase, userAgent }: DropApiOptions, siteId: string, dropToken: string, authToken: string) => Promise<void>;
export interface UploadListItem {
    normalizedPath: string;
    filepath: string;
    hash: string;
}
export declare const uploadDropFiles: (apiOptions: DropApiOptions, deployId: string, uploadList: UploadListItem[], token: string, { concurrentUpload, maxRetry, statusCb, }?: {
    concurrentUpload?: number;
    maxRetry?: number;
    statusCb?: StatusCallback;
}) => Promise<void>;
export {};
//# sourceMappingURL=drop-api.d.ts.map