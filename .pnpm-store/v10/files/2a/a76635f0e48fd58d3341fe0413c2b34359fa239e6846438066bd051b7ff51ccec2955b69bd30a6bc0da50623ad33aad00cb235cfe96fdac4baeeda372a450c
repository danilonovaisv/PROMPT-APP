import type { Bundle } from './bundle.js';
import { FunctionConfig } from './config.js';
import { Declaration, type HeaderMatch } from './declaration.js';
import { EdgeFunction } from './edge_function.js';
import { FeatureFlags } from './feature_flags.js';
import { Layer } from './layer.js';
interface Route {
    function: string;
    headers?: Record<string, HeaderMatch>;
    pattern: string;
    excluded_patterns: string[];
    path?: string;
    methods?: string[];
}
interface TrafficRules {
    action: {
        type: string;
        config: {
            rate_limit_config: {
                algorithm: string;
                window_size: number;
                window_limit: number;
            };
            aggregate: {
                keys: {
                    type: string;
                }[];
            };
            to?: string;
        };
    };
}
export interface EdgeFunctionConfig {
    excluded_patterns: string[];
    on_error?: string;
    generator?: string;
    name?: string;
    traffic_rules?: TrafficRules;
}
interface BundlingTiming {
    tarball_ms?: number;
}
interface Manifest {
    bundler_version: string;
    bundles: {
        asset: string;
        format: string;
    }[];
    bundling_timing?: BundlingTiming;
    import_map?: string;
    layers: {
        name: string;
        flag: string;
    }[];
    routes: Route[];
    post_cache_routes: Route[];
    function_config: Record<string, EdgeFunctionConfig>;
}
interface GenerateManifestFunctionConfigOptions {
    functions: EdgeFunction[];
    internalFunctionConfig?: Record<string, FunctionConfig>;
    userFunctionConfig?: Record<string, FunctionConfig>;
}
interface GenerateManifestRoutesOptions {
    functions: EdgeFunction[];
    declarations?: Declaration[];
}
interface GenerateManifestOptionsBase {
    bundles?: Bundle[];
    featureFlags?: FeatureFlags;
    importMap?: string;
    layers?: Layer[];
    bundlingTiming?: BundlingTiming;
    functions: EdgeFunction[];
}
export declare const generateManifestFunctionConfig: ({ functions, userFunctionConfig, internalFunctionConfig, }: GenerateManifestFunctionConfigOptions) => Record<string, EdgeFunctionConfig>;
export declare const generateManifestRoutes: ({ functions, declarations }: GenerateManifestRoutesOptions) => {
    preCacheRoutes: Route[];
    postCacheRoutes: Route[];
    unroutedFunctions: string[];
    declarationsWithoutFunction: Set<string>;
};
type GenerateManifestOptions = GenerateManifestOptionsBase & (GenerateManifestFunctionConfigOptions | {
    manifestFunctionConfig: ReturnType<typeof generateManifestFunctionConfig>;
}) & (GenerateManifestRoutesOptions | {
    manifestRoutes: ReturnType<typeof generateManifestRoutes>;
});
declare const generateManifest: ({ bundles, importMap, layers, bundlingTiming, functions, ...rest }: GenerateManifestOptions) => {
    declarationsWithoutFunction: string[];
    manifest: Manifest;
    unroutedFunctions: string[];
};
type WriteManifestOptions = GenerateManifestOptions & {
    distDirectory: string;
};
declare const writeManifest: ({ distDirectory, ...rest }: WriteManifestOptions) => Promise<Manifest>;
export { generateManifest, Manifest, Route, writeManifest };
