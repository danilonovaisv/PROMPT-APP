Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let _sentry_rollup_plugin = require("@sentry/rollup-plugin");
let node_module = require("node:module");
let _sentry_bundler_plugin_core = require("@sentry/bundler-plugin-core");
//#region src/index.ts
function getViteMajorVersion() {
	try {
		return (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href)("vite").version?.split(".")[0];
	} catch (err) {}
}
const sentryVitePlugin = (options) => {
	return [{
		enforce: "pre",
		...(0, _sentry_rollup_plugin._rollupPluginInternal)(options, "vite", getViteMajorVersion())
	}];
};
//#endregion
Object.defineProperty(exports, "sentryCliBinaryExists", {
	enumerable: true,
	get: function() {
		return _sentry_bundler_plugin_core.sentryCliBinaryExists;
	}
});
exports.sentryVitePlugin = sentryVitePlugin;

//# sourceMappingURL=index.js.map