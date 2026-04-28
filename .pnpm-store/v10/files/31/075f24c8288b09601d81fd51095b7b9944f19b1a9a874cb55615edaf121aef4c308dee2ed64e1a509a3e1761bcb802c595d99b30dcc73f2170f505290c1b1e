import { a as Hooks } from "./adapter.mjs";
import { n as BunOptions } from "./bun.mjs";
import { n as CloudflareOptions } from "./cloudflare.mjs";
import { n as DenoOptions } from "./deno.mjs";
import { n as NodeOptions } from "./node.mjs";
import { n as SSEOptions } from "./sse.mjs";
import { Server, ServerOptions, ServerPlugin, ServerRequest } from "srvx";

//#region src/server/_types.d.ts
type WSOptions = Partial<Hooks> & {
  resolve?: (req: ServerRequest) => Partial<Hooks> | Promise<Partial<Hooks>>;
  options?: {
    bun?: BunOptions;
    deno?: DenoOptions;
    node?: NodeOptions;
    sse?: SSEOptions;
    cloudflare?: CloudflareOptions;
  };
};
type ServerWithWSOptions = ServerOptions & {
  websocket?: WSOptions;
};
//#endregion
export { WSOptions as n, ServerWithWSOptions as t };