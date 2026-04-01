import { RequestContextFactory } from '@netlify/cache/bootstrap';
import { NetlifyGlobal, Context } from '@netlify/types';

interface BlobsOptions {
    edgeURL: string;
    primaryRegion: string;
    uncachedEdgeURL: string;
    token: string;
}

type GlobalScope = Record<string, any>;

interface StartRuntimeOptions {
    blobs?: BlobsOptions;
    branch?: string;
    cache: {
        getCacheAPIContext: RequestContextFactory;
        purgeToken?: string;
    };
    deployID: string;
    env: NetlifyGlobal['env'];
    getRequestContext: () => Context | null;
    globalScope?: GlobalScope;
    preferGlobal?: boolean;
    siteID: string;
    userAgent?: string;
}
declare const startRuntime: ({ blobs, branch, cache, deployID, env, getRequestContext, globalScope, preferGlobal, siteID, userAgent, }: StartRuntimeOptions) => void;

export { startRuntime };
