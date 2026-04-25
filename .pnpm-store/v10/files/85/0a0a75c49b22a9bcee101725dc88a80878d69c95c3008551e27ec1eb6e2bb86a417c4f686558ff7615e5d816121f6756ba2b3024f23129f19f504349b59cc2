Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let _sentry_bundler_plugin_core = require("@sentry/bundler-plugin-core");
let magic_string = require("magic-string");
magic_string = __toESM(magic_string);
let node_path = require("node:path");
node_path = __toESM(node_path);
let node_module = require("node:module");
//#region src/index.ts
function hasExistingDebugID(code) {
	const chunkStartSnippet = code.slice(0, 6e3);
	const chunkEndSnippet = code.slice(-500);
	if (chunkStartSnippet.includes("_sentryDebugIdIdentifier") || chunkEndSnippet.includes("//# debugId=")) return true;
	return false;
}
function getRollupMajorVersion() {
	try {
		return (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href)("rollup").VERSION?.split(".")[0];
	} catch (err) {}
}
/**
* @ignore - this is the internal plugin factory function only used for the Vite plugin!
*/
function _rollupPluginInternal(userOptions = {}, buildTool, buildToolMajorVersion) {
	const sentryBuildPluginManager = (0, _sentry_bundler_plugin_core.createSentryBuildPluginManager)(userOptions, {
		loggerPrefix: userOptions._metaOptions?.loggerPrefixOverride ?? `[sentry-${buildTool}-plugin]`,
		buildTool,
		buildToolMajorVersion: buildToolMajorVersion || getRollupMajorVersion()
	});
	const { logger, normalizedOptions: options, bundleSizeOptimizationReplacementValues: replacementValues, bundleMetadata, createDependencyOnBuildArtifacts } = sentryBuildPluginManager;
	if (options.disable) return { name: "sentry-noop-plugin" };
	if (process.cwd().match(/\\node_modules\\|\/node_modules\//)) logger.warn("Running Sentry plugin from within a `node_modules` folder. Some features may not work.");
	const freeGlobalDependencyOnBuildArtifacts = createDependencyOnBuildArtifacts();
	const upload = (0, _sentry_bundler_plugin_core.createDebugIdUploadFunction)({ sentryBuildPluginManager });
	const sourcemapsEnabled = options.sourcemaps?.disable !== true;
	const staticInjectionCode = new _sentry_bundler_plugin_core.CodeInjection();
	if (!options.release.inject) logger.debug("Release injection disabled via `release.inject` option. Will not inject release.");
	else if (!options.release.name) logger.debug("No release name provided. Will not inject release. Please set the `release.name` option to identify your release.");
	else staticInjectionCode.append((0, _sentry_bundler_plugin_core.generateReleaseInjectorCode)({
		release: options.release.name,
		injectBuildInformation: options._experiments.injectBuildInformation || false
	}));
	if (Object.keys(bundleMetadata).length > 0) staticInjectionCode.append((0, _sentry_bundler_plugin_core.generateModuleMetadataInjectorCode)(bundleMetadata));
	const transformAnnotations = options.reactComponentAnnotation?.enabled ? (0, _sentry_bundler_plugin_core.createComponentNameAnnotateHooks)(options.reactComponentAnnotation?.ignoredComponents || [], !!options.reactComponentAnnotation?._experimentalInjectIntoHtml) : void 0;
	const transformReplace = Object.keys(replacementValues).length > 0;
	const shouldTransform = transformAnnotations || transformReplace;
	function buildStart() {
		sentryBuildPluginManager.telemetry.emitBundlerPluginExecutionSignal().catch(() => {});
	}
	async function transform(code, id) {
		if (transformAnnotations?.transform) {
			const result = await transformAnnotations.transform(code, id);
			if (result) return result;
		}
		if (transformReplace) return (0, _sentry_bundler_plugin_core.replaceBooleanFlagsInCode)(code, replacementValues);
		return null;
	}
	function renderChunk(code, chunk, _, meta) {
		if (!(0, _sentry_bundler_plugin_core.isJsFile)(chunk.fileName)) return null;
		if ((0, _sentry_bundler_plugin_core.shouldSkipCodeInjection)(code, chunk.facadeModuleId)) return null;
		const injectCode = staticInjectionCode.clone();
		if (sourcemapsEnabled && !hasExistingDebugID(code)) {
			const debugId = (0, _sentry_bundler_plugin_core.stringToUUID)(code);
			injectCode.append((0, _sentry_bundler_plugin_core.getDebugIdSnippet)(debugId));
		}
		if (injectCode.isEmpty()) return null;
		const ms = meta?.magicString || new magic_string.default(code, { filename: chunk.fileName });
		const match = code.match(_sentry_bundler_plugin_core.COMMENT_USE_STRICT_REGEX)?.[0];
		if (match) ms.appendLeft(match.length, injectCode.code());
		else ms.prepend(injectCode.code());
		if (ms?.constructor?.name === "BindingMagicString") return { code: ms };
		return {
			code: ms.toString(),
			map: ms.generateMap({
				file: chunk.fileName,
				hires: "boundary"
			})
		};
	}
	async function writeBundle(outputOptions, bundle) {
		try {
			await sentryBuildPluginManager.createRelease();
			if (sourcemapsEnabled && options.sourcemaps?.disable !== "disable-upload") if (outputOptions.dir) {
				const outputDir = outputOptions.dir;
				await upload(await (0, _sentry_bundler_plugin_core.globFiles)([
					"/**/*.js",
					"/**/*.mjs",
					"/**/*.cjs",
					"/**/*.js.map",
					"/**/*.mjs.map",
					"/**/*.cjs.map"
				].map((q) => `${q}?(\\?*)?(#*)`), { root: outputDir }));
			} else if (outputOptions.file) await upload([outputOptions.file]);
			else await upload(Object.keys(bundle).map((asset) => node_path.join(node_path.resolve(), asset)));
		} finally {
			freeGlobalDependencyOnBuildArtifacts();
			await sentryBuildPluginManager.deleteArtifacts();
		}
	}
	const name = `sentry-${buildTool}-plugin`;
	if (shouldTransform) return {
		name,
		buildStart,
		transform,
		renderChunk,
		writeBundle
	};
	return {
		name,
		buildStart,
		renderChunk,
		writeBundle
	};
}
function sentryRollupPlugin(userOptions = {}) {
	return [_rollupPluginInternal(userOptions, "rollup")];
}
//#endregion
exports._rollupPluginInternal = _rollupPluginInternal;
Object.defineProperty(exports, "sentryCliBinaryExists", {
	enumerable: true,
	get: function() {
		return _sentry_bundler_plugin_core.sentryCliBinaryExists;
	}
});
exports.sentryRollupPlugin = sentryRollupPlugin;

//# sourceMappingURL=index.js.map