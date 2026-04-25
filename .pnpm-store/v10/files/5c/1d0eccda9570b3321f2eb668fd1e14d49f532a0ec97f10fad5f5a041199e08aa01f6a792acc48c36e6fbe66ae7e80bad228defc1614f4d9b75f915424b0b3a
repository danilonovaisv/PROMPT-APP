import { n as AdapterInstance, r as AdapterOptions, t as Adapter } from "./adapter.mjs";

//#region src/adapters/sse.d.ts
interface SSEAdapter extends AdapterInstance {
  fetch(req: Request): Promise<Response>;
}
interface SSEOptions extends AdapterOptions {
  bidir?: boolean;
}
declare const sseAdapter: Adapter<SSEAdapter, SSEOptions>;
//#endregion
export { SSEOptions as n, sseAdapter as r, SSEAdapter as t };