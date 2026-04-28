import sse_default from "../adapters/sse.mjs";
import { serve as serve$1 } from "srvx";

//#region src/server/default.ts
function plugin(wsOpts) {
	const ws = sse_default({
		hooks: wsOpts,
		resolve: wsOpts.resolve,
		...wsOpts.options?.sse
	});
	console.warn("[crossws] Using SSE adapter for WebSocket support. This requires a custom WebSocket client (https://crossws.h3.dev/adapters/sse).");
	return (server) => {
		server.options.middleware.unshift((req, next) => {
			if (req.headers.get("upgrade")?.toLowerCase() === "websocket") return ws.fetch(req);
			return next();
		});
	};
}
function serve(options) {
	if (options.websocket) {
		options.plugins ||= [];
		options.plugins.push(plugin(options.websocket));
	}
	return serve$1(options);
}

//#endregion
export { plugin, serve };