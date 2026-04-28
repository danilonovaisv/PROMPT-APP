import type { NetlifyPluginConstants } from '../../core/constants.js';
import type { ReturnValue } from '../../steps/return_values.ts';
import type { NetlifyPluginUtils } from '../../types/options/netlify_plugin_utils.js';
type BuildEvent = 'onPreBuild' | 'onBuild' | 'onPostBuild' | 'onError' | 'onSuccess' | 'onEnd';
type RunState = Record<string, unknown>;
type DeployEnvVarsData = {
    key: string;
    value: string;
    isSecret: boolean;
    scopes: string[];
}[];
export declare const getUtils: ({ event, constants: { FUNCTIONS_SRC, INTERNAL_FUNCTIONS_SRC, CACHE_DIR }, generatedFunctions, runState, deployEnvVars, }: {
    event: BuildEvent;
    constants: NetlifyPluginConstants;
    generatedFunctions?: ReturnValue["generatedFunctions"];
    runState: RunState;
    deployEnvVars: DeployEnvVarsData;
}) => NetlifyPluginUtils;
export {};
