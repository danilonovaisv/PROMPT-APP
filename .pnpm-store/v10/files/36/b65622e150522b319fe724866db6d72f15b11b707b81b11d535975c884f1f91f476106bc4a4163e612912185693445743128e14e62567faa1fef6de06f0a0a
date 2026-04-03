import { Geolocation, Logger } from '@netlify/dev-utils';
import { Declaration } from '@netlify/edge-bundler';
export { Declaration } from '@netlify/edge-bundler';

interface EdgeFunctionsHandlerOptions {
    configDeclarations: Declaration[];
    directories: string[];
    env: Record<string, string>;
    geolocation: Geolocation;
    logger: Logger;
    requestTimeout?: number;
    siteID?: string;
    siteName?: string;
}
type EdgeFunctionsMatch = Awaited<ReturnType<EdgeFunctionsHandler['getFunctionsForRequest']>>;
declare class EdgeFunctionsHandler {
    private configDeclarations;
    private denoServerProcess?;
    private directories;
    private geolocation;
    private initialization;
    private initialized;
    private stopped;
    private logger;
    private requestTimeout;
    private siteID?;
    private siteName?;
    constructor(options: EdgeFunctionsHandlerOptions);
    /**
     * Retrieves the in-source configuration objects for a set of edge functions.
     * The evaluation of the functions and the retrieval of the configs must take
     * place in Deno, but all the logic for processing those configurations and
     * merging them with other sources lives in Node.js. To keep a single source
     * of truth, we make a request to the Deno server with a special method that
     * instructs the handler to evaluate the functions and return their configs,
     * which are then returned by this method.
     */
    private getFunctionConfigs;
    /**
     * Returns the list of edge functions that should run for a given request.
     * It computes both the names of the edge functions that should run as well
     * as the invocation metadata object that must be included in the request.
     */
    private getFunctionsForRequest;
    /**
     * Runs a request through the edge functions handler. The request may or may
     * not match any edge functions: if it does, this method takes ownership of
     * the request and returns the corresponding response; if it doesn't, the
     * method returns `undefined`.
     */
    match(request: Request): Promise<{
        handle: (request: Request, originServerAddress: string) => Promise<Response>;
    } | undefined>;
    /**
     * Initializes the Deno server where the edge functions will run.
     */
    private initialize;
    private renderError;
    private waitForDenoServer;
    stop(): Promise<void>;
}

export { EdgeFunctionsHandler, type EdgeFunctionsMatch };
