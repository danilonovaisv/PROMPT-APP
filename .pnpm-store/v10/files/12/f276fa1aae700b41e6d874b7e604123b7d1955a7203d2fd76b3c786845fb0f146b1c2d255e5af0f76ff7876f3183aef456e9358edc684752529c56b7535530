type Logger = (...args: any[]) => void;
interface EnvironmentOptions {
    getContext: RequestContextFactory;
    userAgent?: string;
}
declare enum Operation {
    Delete = "delete",
    Read = "read",
    Write = "write"
}
type RequestContextFactory = (options: {
    operation: Operation;
}) => RequestContext | null;
interface RequestContext {
    host: string;
    logger?: Logger;
    token: string;
    url: string;
}

type NetlifyCacheOptions = EnvironmentOptions & {
    name: string;
};
declare const getInternalHeaders: unique symbol;
declare const serializeRequestHeaders: unique symbol;
declare const serializeResponseHeaders: unique symbol;
declare class NetlifyCache implements Cache {
    #private;
    constructor({ getContext, name, userAgent }: NetlifyCacheOptions);
    private [getInternalHeaders];
    private [serializeRequestHeaders];
    private [serializeResponseHeaders];
    add(request: RequestInfo | URL): Promise<void>;
    addAll(requests: RequestInfo[]): Promise<void>;
    delete(request: RequestInfo | URL): Promise<boolean>;
    keys(_request?: Request | URL): Promise<never[]>;
    match(request: RequestInfo | URL): Promise<Response | undefined>;
    matchAll(request?: RequestInfo | URL, _options?: CacheQueryOptions): Promise<readonly Response[]>;
    put(request: RequestInfo | URL, response: Response): Promise<void>;
}

export { type EnvironmentOptions as E, NetlifyCache as N, Operation as O, type RequestContextFactory as R };
