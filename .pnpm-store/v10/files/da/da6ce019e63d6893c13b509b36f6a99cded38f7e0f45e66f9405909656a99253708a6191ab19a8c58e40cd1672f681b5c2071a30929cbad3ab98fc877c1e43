import { N as NetlifyCache } from './cache-B9TsVKLp.cjs';

/**
 * Polyfill for local development environments where `globalThis.caches` is not
 * available. It's a no-op cache. In production it will use the real one that
 * has been set up in the environment by the bootstrap layer.
 */
declare class NetlifyCacheStorageProxy implements CacheStorage {
    delete(name: string): Promise<boolean>;
    has(name: string): Promise<boolean>;
    keys(): Promise<string[]>;
    match(request: RequestInfo, options?: MultiCacheQueryOptions): Promise<Response | undefined>;
    open(cacheName: string): Promise<Cache>;
}
declare const caches: NetlifyCacheStorageProxy;

interface CacheSettings {
    /**
     * Persist the response in the durable cache, shared across all CDN nodes.
     *
     * {@link} https://ntl.fyi/durable
     */
    durable?: boolean;
    /**
     * Override the default behavior of revalidating cached responses with new
     * deploys. You must provide one or more values that will be registered as
     * cache tags for you to purge the responses on-demand.
     *
     * {@link} https://ntl.fyi/cache-id
     */
    overrideDeployRevalidation?: string | string[];
    /**
     * Provide one or more cache tags to associate with the response. You can use
     * these tags to revalidate responses on-demand, making sure you target the
     * specific responses you want based on your application logic.
     *
     * {@link} https://ntl.fyi/cache-tags
     */
    tags?: string[];
    /**
     * Define the period of time (in seconds) during which the response can be
     * considered fresh. After this period, the response will revalidated in
     * the background if used with the `stale-while-revalidate` directive,
     * otherwise the response will be discarded.
     *
     * {@link} https://ntl.fyi/cache-ttl
     */
    ttl?: number;
    /**
     * Define the period of time (in seconds) after the response is considered
     * stale (set by the `ttl` property) and during which it can still
     * be served, while starting a revalidation in the background.
     *
     * {@link} https://ntl.fyi/cache-swr
     */
    swr?: boolean | number;
    /**
     * Defines how cache key variations are created for the response, giving you
     * fine-grained control over which parts of a request are taken into
     * consideration for matching cache objects.
     *
     * {@link} https://ntl.fyi/cache-vary
     */
    vary?: VaryOptions;
}
interface VaryOptions {
    /**
     * Define cache key variations based on a subset of cookie keys.
     */
    cookie?: string | string[];
    /**
     * Define cache key variations based on the geographical origin of the request.
     */
    country?: string | (string | string[])[];
    /**
     * Define cache key variations based on your custom request headers and most
     * standard request headers.
     */
    header?: string | string[];
    /**
     * Define cache key variations for one or more individual languages or custom
     * language groups.
     */
    language?: string | (string | string[])[];
    /**
     * Define cache key variations based on a specific subset of query parameters
     * included with a request or all request query parameters.
     */
    query?: boolean | string | string[];
}

declare const cacheHeaders: (cacheSettings: CacheSettings) => Record<string, string>;
declare const setCacheHeaders: (response: Response, cacheSettings: CacheSettings) => Response;

interface CacheStatus {
    /**
     * Whether the response was served from a Netlify cache.
     */
    hit: boolean;
    /**
     * Granular information about how the different Netlify caches have
     * contributed to the delivery of the response.
     */
    caches: {
        /**
         * How the response has interacted with the durable cache.
         *
         * {@link} https://ntl.fyi/durable
         */
        durable?: {
            hit: boolean;
            fresh: boolean;
            stored?: boolean;
            ttl: number;
        };
        /**
         * How the response has interacted with the edge cache.
         *
         * {@link} https://ntl.fyi/edge-cache
         */
        edge?: {
            hit: boolean;
            fresh: boolean;
        };
    };
}
type ParseCacheStatus = {
    (header: string): CacheStatus | null;
    (headers: Headers): CacheStatus | null;
    (response: Response): CacheStatus | null;
};
/**
 * Returns whether a cached response includes a signal that the client should
 * perform a background revalidation. This may happen when using the Cache API
 * with the `stale-while-revalidate` directive, since unlike the regular cache,
 * the client is the one responsible for explicitly inserting new entries into
 * the cache. So when this returns `true`, the caller should fetch the resource
 * and write the fresh response back to the cache with `cache.put()`.
 */
declare const needsRevalidation: (response: Response) => boolean;
/**
 * Retrieves information about how a response has interacted with Netlify's
 * global caching infrastructure, including whether the response has been
 * served by a cache and whether it's fresh or stale.
 */
declare const getCacheStatus: ParseCacheStatus;

type CacheOptions = CacheSettings & {
    /**
     * A `Cache` instance or the name of the cache that should be used. If not
     * set, a cache without a name (i.e. `""`) will be used.
     */
    cache?: NetlifyCache | string;
    /**
     * A custom `fetch` implementation to be used instead of the native one.
     */
    fetch?: typeof globalThis.fetch;
    /**
     * When `fetchWithCache` fetches a new response and adds it to the cache, the
     * `Promise` it returns waits for both the network call to finish and for the
     * response to be cached. Customize this behavior by setting a `onCachePut`
     * handler that receives the cache write `Promise`, giving you the option to
     * handle it as you like. This lets you remove the cache write from the "hot
     * path" and run it in the background.
     */
    onCachePut?: (cachePut: Promise<void>) => void | Promise<void>;
};
type FetchWithCache = {
    (request: string | URL | Request, init?: RequestInit): Promise<Response>;
    (request: string | URL | Request, cacheSettings?: CacheOptions): Promise<Response>;
    (request: string | URL | Request, init: RequestInit, cacheSettings?: CacheOptions): Promise<Response>;
};
/**
 * Serves a resource from the Cache API if available, otherwise it's fetched
 * from the network and added to the cache. It's a drop-in replacement for
 * `fetch`, supporting the same arguments and return value. A third (optional)
 * argument makes it possible to set the caching configuration of the response
 * as it's added to the cache, overridding any cache control settings it sets.
 * It returns a `Promise` that resolves with the resulting `Response` object,
 * whether it comes from the cache or from the network.
 */
declare const fetchWithCache: FetchWithCache;

/**
 * Number of seconds in one minute.
 */
declare const MINUTE = 60;
/**
 * Number of seconds in one hour.
 */
declare const HOUR: number;
/**
 * Number of seconds in one day.
 */
declare const DAY: number;
/**
 * Number of seconds in one week.
 */
declare const WEEK: number;
/**
 * Number of seconds in one year.
 */
declare const YEAR: number;

export { DAY, HOUR, MINUTE, WEEK, YEAR, cacheHeaders, caches, fetchWithCache, getCacheStatus, needsRevalidation, setCacheHeaders };
