import { Logger } from '@netlify/dev-utils';
import { MinimalHeader } from '@netlify/headers-parser';

type HeadersCollector = (key: string, value: string) => void;
interface HeadersHandlerOptions {
    configPath?: string | undefined;
    configHeaders?: MinimalHeader[] | undefined;
    /**
     * Base directory of the project. This can be absolute or relative
     * to the current working directory.
     */
    projectDir: string;
    /**
     * Publish directory of the project, relative to the `projectDir`.
     */
    publishDir?: string | undefined;
    logger: Logger;
}
declare class HeadersHandler {
    #private;
    constructor({ configPath, configHeaders, projectDir, publishDir, logger }: HeadersHandlerOptions);
    get headersFiles(): string[];
    apply(request: Request, response?: Response, collector?: HeadersCollector): Promise<{
        [key: string]: string;
    }>;
}

export { type HeadersCollector, HeadersHandler };
