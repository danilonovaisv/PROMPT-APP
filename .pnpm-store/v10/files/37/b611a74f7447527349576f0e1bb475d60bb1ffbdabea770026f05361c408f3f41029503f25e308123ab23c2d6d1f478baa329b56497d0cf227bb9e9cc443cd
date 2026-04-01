import { Handler } from '@netlify/dev-utils';

type HttpStatusCode = number;
interface Redirect {
    from: string;
    to?: string;
    status?: HttpStatusCode;
    force?: boolean;
    signed?: string;
    query?: Partial<Record<string, string>>;
    headers?: Partial<Record<string, string>>;
    conditions?: Partial<Record<'Language' | 'Role' | 'Country' | 'Cookie', readonly string[]>>;
}

interface RedirectsMatch {
    error?: Error;
    external: boolean;
    force: boolean;
    headers: Record<string, string>;
    hiddenProxy: boolean;
    redirect: boolean;
    statusCode: number;
    target: URL;
    targetRelative: string;
}
interface RedirectsHandlerOptions {
    configPath?: string | undefined;
    configRedirects: Redirect[];
    geoCountry?: string | undefined;
    jwtRoleClaim: string;
    jwtSecret: string;
    notFoundHandler?: Handler;
    projectDir: string;
    publicDir?: string | undefined;
    siteID?: string;
    siteURL?: string;
}
type GetStaticFile = (request: Request) => Promise<(() => Promise<Response>) | undefined>;
declare class RedirectsHandler {
    private notFoundHandler;
    private rewriter;
    private siteID;
    private siteURL;
    constructor({ configPath, configRedirects, geoCountry, jwtRoleClaim, jwtSecret, notFoundHandler, projectDir, publicDir, siteID, siteURL, }: RedirectsHandlerOptions);
    match(request: Request): Promise<RedirectsMatch | undefined>;
    handle(request: Request, match: RedirectsMatch, getStaticFile: GetStaticFile): Promise<Response | undefined>;
}

export { RedirectsHandler };
