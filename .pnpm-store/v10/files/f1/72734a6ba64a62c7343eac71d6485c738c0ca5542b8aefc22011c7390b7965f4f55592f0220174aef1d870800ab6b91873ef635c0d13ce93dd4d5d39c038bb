import { Options } from "@sentry/bundler-plugin-core";
import MagicString, { SourceMap } from "magic-string";
import type { TransformResult } from "rollup";
/**
 * @ignore - this is the internal plugin factory function only used for the Vite plugin!
 */
export declare function _rollupPluginInternal(userOptions: Options | undefined, buildTool: "rollup" | "vite", buildToolMajorVersion?: string): {
    name: string;
    buildStart?: undefined;
    transform?: undefined;
    renderChunk?: undefined;
    writeBundle?: undefined;
} | {
    name: string;
    buildStart: () => void;
    transform: (code: string, id: string) => Promise<TransformResult>;
    renderChunk: (code: string, chunk: {
        fileName: string;
        facadeModuleId?: string | null;
    }, _?: unknown, meta?: {
        magicString?: MagicString;
    }) => {
        code: string;
        map?: SourceMap | undefined;
    } | null;
    writeBundle: (outputOptions: {
        dir?: string;
        file?: string;
    }, bundle: {
        [fileName: string]: unknown;
    }) => Promise<void>;
} | {
    name: string;
    buildStart: () => void;
    renderChunk: (code: string, chunk: {
        fileName: string;
        facadeModuleId?: string | null;
    }, _?: unknown, meta?: {
        magicString?: MagicString;
    }) => {
        code: string;
        map?: SourceMap | undefined;
    } | null;
    writeBundle: (outputOptions: {
        dir?: string;
        file?: string;
    }, bundle: {
        [fileName: string]: unknown;
    }) => Promise<void>;
    transform?: undefined;
};
export declare function sentryRollupPlugin(userOptions?: Options): any;
export type { Options as SentryRollupPluginOptions } from "@sentry/bundler-plugin-core";
export { sentryCliBinaryExists } from "@sentry/bundler-plugin-core";
