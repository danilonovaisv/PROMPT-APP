interface StaticHandlerOptions {
    directory: string | string[];
}
interface StaticMatch {
    handle: () => Promise<Response>;
}
declare class StaticHandler {
    private publicDirectories;
    constructor(options: StaticHandlerOptions);
    match(request: Request): Promise<StaticMatch | undefined>;
}

export { StaticHandler, type StaticMatch };
