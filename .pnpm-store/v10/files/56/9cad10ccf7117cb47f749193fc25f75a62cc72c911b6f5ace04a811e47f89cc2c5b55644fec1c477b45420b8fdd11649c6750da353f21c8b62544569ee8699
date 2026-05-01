import { createRequire } from "node:module";
import { _rollupPluginInternal } from "@sentry/rollup-plugin";
import { sentryCliBinaryExists } from "@sentry/bundler-plugin-core";
//#region src/index.ts
function getViteMajorVersion() {
	try {
		return createRequire(import.meta.url)("vite").version?.split(".")[0];
	} catch (err) {}
}
const sentryVitePlugin = (options) => {
	return [{
		enforce: "pre",
		..._rollupPluginInternal(options, "vite", getViteMajorVersion())
	}];
};
//#endregion
export { sentryCliBinaryExists, sentryVitePlugin };

//# sourceMappingURL=index.mjs.map