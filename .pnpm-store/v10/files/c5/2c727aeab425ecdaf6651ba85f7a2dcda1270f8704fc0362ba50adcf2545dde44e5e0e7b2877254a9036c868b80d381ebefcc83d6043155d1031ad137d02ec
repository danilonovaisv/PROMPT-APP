import { Reactive, DevEventHandler, FileWatcher, Geolocation } from '@netlify/dev-utils';
import { Manifest } from '@netlify/zip-it-and-ship-it';
import { EnvironmentContext } from '@netlify/blobs';

interface FunctionRegistryOptions {
    blobsContext?: EnvironmentContext;
    destPath: string;
    config: Reactive<any>;
    debug?: boolean;
    eventHandler?: DevEventHandler;
    frameworksAPIFunctionsPath?: string;
    internalFunctionsPath?: string;
    manifest?: Manifest;
    projectRoot: string;
    settings: any;
    timeouts?: {
        syncFunctions?: number;
        backgroundFunctions?: number;
    };
    fileWatcher?: FileWatcher;
}

interface FunctionMatch {
    handle: (req: Request) => Promise<Response>;
    preferStatic: boolean;
}
type FunctionsHandlerOptions = FunctionRegistryOptions & {
    accountId?: string;
    geolocation: Geolocation;
    siteId?: string;
    userFunctionsPath?: string;
};
declare class FunctionsHandler {
    private accountID?;
    private buildCache;
    private geolocation;
    private globalBuildDirectory;
    private registry;
    private scan;
    private siteID?;
    constructor({ accountId, geolocation, siteId, userFunctionsPath, ...registryOptions }: FunctionsHandlerOptions);
    private invoke;
    match(request: Request, buildDirectory?: string): Promise<FunctionMatch | undefined>;
}

export { type FunctionMatch, FunctionsHandler };
