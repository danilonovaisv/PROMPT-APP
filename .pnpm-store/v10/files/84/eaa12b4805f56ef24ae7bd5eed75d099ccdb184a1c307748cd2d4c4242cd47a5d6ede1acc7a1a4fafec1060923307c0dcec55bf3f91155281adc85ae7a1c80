"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.neon = neon;
const serverless_1 = require("@neondatabase/serverless");
// actual implementation
function neon(connStrOrOptions, maybeOptions) {
    // Determine if first argument is connection string or options
    let connectionString;
    let options;
    if (typeof connStrOrOptions === "string") {
        // First argument is a connection string
        connectionString = connStrOrOptions;
        options = maybeOptions;
    }
    else {
        // First argument is options or undefined
        connectionString = undefined;
        options = connStrOrOptions;
    }
    // Check for connection string (either from args or env)
    if (connectionString === undefined &&
        process.env.NETLIFY_DATABASE_URL === undefined) {
        if (process.env.NODE_ENV === "development" && !process.env.CONTEXT) {
            throw new Error(`[@netlify/neon] Failed to instantiate Neon client. Make sure you are running your project with "netlify dev".`);
        }
        throw new Error(`[@netlify/neon] Failed to instantiate Neon client: connection string is not provided either as an argument or as an environment variable (\`NETLIFY_DATABASE_URL\`).
      
You can initialize a Database in Netlify by running the command: \`netlify db init\`

The \`netlify db init\` command will create a new database and add the \`NETLIFY_DATABASE_URL\` environment variable to your Netlify site.

Read more: https://cli.netlify.com/#db
`);
    }
    // Pass to the base neon function with connection string and options
    return (0, serverless_1.neon)(connectionString !== null && connectionString !== void 0 ? connectionString : process.env.NETLIFY_DATABASE_URL, options);
}
