import { NetlifyDev } from '@netlify/dev';
import type { EnvironmentVariables } from '../../utils/types.js';
interface StartNetlifyDevOptions {
    projectRoot: string;
    apiToken: string | undefined;
    env: EnvironmentVariables;
}
/**
 * Much of the core of local dev emulation of the Netlify platform was extracted
 * (duplicated) to https://github.com/netlify/primitives. This is a shim that
 * gradually enables *some* of this extracted functionality while falling back
 * to the legacy copy in this codebase for the rest.
 *
 * TODO: Hook this up to the request chain and fall through to the existing handler.
 * TODO: `@netlify/images` follows a different pattern (it is used directly).
 * Move that here.
 */
export declare const startNetlifyDev: ({ apiToken, env, projectRoot, }: StartNetlifyDevOptions) => Promise<InstanceType<typeof NetlifyDev> | undefined>;
export {};
//# sourceMappingURL=programmatic-netlify-dev.d.ts.map