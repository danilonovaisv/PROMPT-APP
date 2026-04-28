import { IncomingMessage } from 'node:http';
import { Logger } from '@netlify/dev-utils';
import { HeadersCollector } from '@netlify/headers';
import { NetlifyDB } from '@netlify/database-dev';
export { SQLExecutor, applyMigrations, resetDatabase } from '@netlify/database-dev';

interface Features {
    /**
     * Configuration options for Netlify Blobs.
     *
     * {@link} https://docs.netlify.com/blobs/overview/
     */
    blobs?: {
        enabled?: boolean;
    };
    /**
     * Configuration options for environment variables.
     *
     * {@link} https://docs.netlify.com/edge-functions/overview/
     */
    edgeFunctions?: {
        enabled?: boolean;
    };
    /**
     * Configuration options for environment variables.
     *
     * {@link} https://docs.netlify.com/environment-variables/overview/
     */
    environmentVariables?: {
        enabled?: boolean;
    };
    /**
     * Configuration options for Netlify Functions.
     *
     * {@link} https://docs.netlify.com/functions/overview/
     */
    functions?: {
        enabled?: boolean;
    };
    /**
     * Configuration options for geolocation data used by Functions and Edge Functions.
     *
     * {@link} https://docs.netlify.com/build/edge-functions/api/#geo
     */
    geolocation?: {
        enabled?: boolean;
        /**
         * Cache the result of the API call. When disabled, the location is retrieved
         * each time.
         *
         * {@default} true
         */
        cache?: boolean;
    };
    /**
     * Configuration options for Netlify response headers.
     *
     * {@link} https://docs.netlify.com/routing/headers/
     */
    headers?: {
        enabled?: boolean;
    };
    /**
     * Configuration options for Netlify Image CDN.
     *
     * {@link} https://docs.netlify.com/image-cdn/overview/
     */
    images?: {
        enabled?: boolean;
        /**
         * Allowed URL patterns for remote images, described as an array of regular
         * expression strings. This list will be merged with  the `remote_images`
         * configuration property.
         *
         * {@link} https://docs.netlify.com/image-cdn/overview/#remote-path
         */
        remoteURLPatterns?: string[];
    };
    /**
     * Configuration options for Netlify redirects and rewrites.
     *
     * {@link} https://docs.netlify.com/routing/redirects/
     */
    redirects?: {
        enabled?: boolean;
    };
    /**
     * Configuration options for serving static files.
     */
    staticFiles?: {
        enabled?: boolean;
        /**
         * Additional list of directories where static files can be found. The
         * `publish` directory configured on your site will be used automatically.
         */
        directories?: string[];
    };
    /**
     * Configuration options for Netlify AI Gateway.
     *
     * {@link} https://docs.netlify.com/ai/overview/
     */
    aiGateway?: {
        enabled?: boolean;
    };
}
interface NetlifyDevOptions extends Features {
    apiURL?: string;
    apiToken?: string;
    logger?: Logger;
    projectRoot?: string;
    /**
     * If your local development setup has its own HTTP server (e.g. Vite), set
     * its address here.
     */
    serverAddress?: string | null;
}
interface HandleOptions {
    /**
     * An optional callback that will be called with every header (key and value)
     * coming from header rules.
     *
     * {@link} https://docs.netlify.com/routing/headers/
     */
    headersCollector?: HeadersCollector;
    /**
     * If your local development setup has its own HTTP server (e.g. Vite), you
     * can supply its address here. It will override any value defined in the
     * top-level `serverAddress` setting.
     */
    serverAddress?: string;
}
type ResponseType = 'edge-function' | 'function' | 'image' | 'redirect' | 'static';
declare class NetlifyDev {
    #private;
    constructor(options: NetlifyDevOptions);
    private getServerAddress;
    /**
     * Runs a request through the Netlify request chain and returns a `Response`
     * if there's a match. We must not disturb the incoming request unless we
     * know we will be returning a response, so this method takes a read-only
     * request that is safe to access (used for matching) and a getter for the
     * actual request (used for handling matches).
     *
     * @param readRequest Read-only version of the request (without a body)
     * @param getWriteRequest Getter for the actual request (with a body)
     * @param destPath Destination directory for compiled files
     * @param options Options object
     * @returns
     */
    private handleInEphemeralDirectory;
    private getConfig;
    /**
     * Runs a `Request` through the Netlify request chain. If there is a match,
     * it returns the resulting `Response` object; if not, it returns `undefined`.
     */
    handle(request: Request, options?: HandleOptions): Promise<Response | undefined>;
    /**
     * Runs a `Request` through the Netlify request chain. If there is a match,
     * it returns an object with the resulting `Response` object and information
     * about the match; if not, it returns `undefined`.
     */
    handleAndIntrospect(request: Request, options?: HandleOptions): Promise<{
        response: Response;
        type: ResponseType;
    } | undefined>;
    /**
     * Runs a Node.js `IncomingMessage` through the Netlify request chain. If
     * there is a match, it returns an object with the resulting `Response`
     * object and information about the match; if not, it returns `undefined`.
     */
    handleAndIntrospectNodeRequest(request: IncomingMessage, options?: HandleOptions): Promise<{
        response: Response;
        type: ResponseType;
    } | undefined>;
    get siteIsLinked(): boolean;
    start(): Promise<{
        serverAddress: string | undefined;
    }>;
    get db(): NetlifyDB | undefined;
    stop(): Promise<void>;
    getEnabledFeatures(): string[];
}

export { type Features, NetlifyDev, type ResponseType };
