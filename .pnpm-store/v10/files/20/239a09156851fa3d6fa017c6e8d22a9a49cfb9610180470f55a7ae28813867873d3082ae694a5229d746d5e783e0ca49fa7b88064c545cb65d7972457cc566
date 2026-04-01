import { NeonQueryFunction, HTTPTransactionOptions } from "@neondatabase/serverless";
/**
 * Netlify-optimized wrapper for the Neon serverless Postgres driver.
 *
 * **Netlify-specific behavior:**
 * - Automatically uses `NETLIFY_DATABASE_URL` environment variable when no connection string is provided
 * - Enhanced error messages for Netlify deployment contexts
 * - Built to work with the Neon Database extension for Netlify
 *
 * {@link @neondatabase/serverless#neon | Original Neon documentation:}
 *
 * This function returns an async tagged-template function that runs a single
 * SQL query (no session or transactions) with low latency over HTTPS. Support
 * for multiple queries as a non-interactive transaction is provided by
 * the `transaction` property of the query function.
 *
 * By default, the query function returns database rows directly. Types should
 * match those returned by this driver (i.e. Pool or Client) over WebSockets.
 *
 * The returned function can also be called directly (i.e. not as a template
 * function). In that case, pass it a query string with embedded `$1`, `$2`
 * (etc.), followed by an array of query parameters, followed (optionally) by
 * any of the same options you can pass to this function.
 *
 * @example <caption>Basic Netlify usage</caption>
 * ```
 * import { neon } from "@netlify/neon";
 *
 * // Uses NETLIFY_DATABASE_URL automatically
 * const sql = neon();
 * const rows = await sql`SELECT version()`;
 * ```
 *
 * @example <caption>Explicit connection string</caption>
 * ```
 * const sql = neon("postgres://user:pass@host/db");
 * const result = await sql`SELECT NOW()`;
 * ```
 *
 * @example <caption>With options</caption>
 * ```
 * const sql = neon({
 *   arrayMode: true,
 *   fetchOptions: { priority: 'high' }
 * });
 *
 * const data = await sql("SELECT $1::text", ["Netlify"]);
 * ```
 *
 * @param connectionString Optional Postgres connection string (`postgres://user:pass@host/db`).
 * When omitted:
 * - Uses `NETLIFY_DATABASE_URL` in production
 * @param options Driver configuration:
 * - `arrayMode` - Return results as arrays instead of objects
 * - `fullResults` - Return complete query metadata
 * - `fetchOptions` - Customize underlying fetch requests
 *
 * @see {@link https://neon.tech/docs/serverless/serverless-driver | Neon Driver Docs}
 */
export declare function neon(connectionString?: string, options?: HTTPTransactionOptions<false, false>): NeonQueryFunction<false, false>;
export declare function neon(options?: HTTPTransactionOptions<false, false>): NeonQueryFunction<false, false>;
//# sourceMappingURL=index.d.ts.map