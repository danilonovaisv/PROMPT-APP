import "../_chunks/rolldown-runtime.mjs";
import "../_chunks/libs/ws.mjs";
import node_default from "../adapters/node.mjs";
import { NodeRequest, serve as serve$1 } from "srvx/node";

//#region src/server/node.ts
function plugin(wsOpts) {
	return (server) => {
		const ws = node_default({
			hooks: wsOpts,
			resolve: wsOpts.resolve,
			...wsOpts.options?.deno
		});
		const originalServe = server.serve;
		server.serve = () => {
			server.node?.server.on("upgrade", (req, socket, head) => {
				ws.handleUpgrade(req, socket, head, new NodeRequest({
					req,
					upgrade: {
						socket,
						head
					}
				}));
			});
			return originalServe.call(server);
		};
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