import { E as EnvironmentOptions } from '../cache-B9TsVKLp.cjs';
export { N as NetlifyCache, O as Operation, R as RequestContextFactory } from '../cache-B9TsVKLp.cjs';

declare class NetlifyCacheStorage {
    #private;
    constructor(environmentOptions: EnvironmentOptions);
    open(name: string): Promise<Cache>;
    has(name: string): Promise<boolean>;
    delete(name: string): Promise<boolean>;
    keys(): Promise<string[]>;
    match(request: RequestInfo | URL, options?: MultiCacheQueryOptions): Promise<Response | undefined>;
}

export { NetlifyCacheStorage };
