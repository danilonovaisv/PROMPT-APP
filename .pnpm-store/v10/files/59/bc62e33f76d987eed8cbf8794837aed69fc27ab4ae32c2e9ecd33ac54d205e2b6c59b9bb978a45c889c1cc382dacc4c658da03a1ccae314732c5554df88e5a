import "../_chunks/bun.mjs";
import "../_chunks/cloudflare.mjs";
import "../_chunks/node.mjs";
import { n as WSOptions, t as ServerWithWSOptions } from "../_chunks/_types.mjs";
import { Server, ServerPlugin } from "srvx";

//#region src/server/cloudflare.d.ts
declare function plugin(wsOpts: WSOptions): ServerPlugin;
declare function serve(options: ServerWithWSOptions): Server;
//#endregion
export { plugin, serve };