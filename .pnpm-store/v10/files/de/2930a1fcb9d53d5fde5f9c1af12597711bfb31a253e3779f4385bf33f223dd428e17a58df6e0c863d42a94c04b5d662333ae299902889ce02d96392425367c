// src/main.ts
import process from "process";
import { NetlifyDev } from "@netlify/dev";
import { fromWebResponse, netlifyCommand, warning } from "@netlify/dev-utils";
import dedent from "dedent";

// src/lib/logger.ts
import { netlifyBanner } from "@netlify/dev-utils";
var createLoggerFromViteLogger = (viteLogger) => ({
  error: (msg) => viteLogger.error(msg ?? "", { timestamp: true, environment: netlifyBanner }),
  log: (msg) => viteLogger.info(msg ?? "", { timestamp: true, environment: netlifyBanner }),
  warn: (msg) => viteLogger.warn(msg ?? "", { timestamp: true, environment: netlifyBanner })
});

// src/lib/build.ts
import { mkdir, writeFile } from "fs/promises";
import { join, relative, sep } from "path";
import { sep as posixSep } from "path/posix";
import js from "dedent";

// package.json
var name = "@netlify/vite-plugin";
var version = "2.11.2";

// src/lib/build.ts
var NETLIFY_FUNCTIONS_DIR = ".netlify/v1/functions";
var NETLIFY_FUNCTION_FILENAME = "server.mjs";
var NETLIFY_FUNCTION_DEFAULT_NAME = "@netlify/vite-plugin server handler";
var toPosixPath = (path) => path.split(sep).join(posixSep);
var createNetlifyFunctionHandler = (serverEntrypointPath, displayName) => js`
import serverEntrypoint from "${serverEntrypointPath}";

if (typeof serverEntrypoint?.fetch !== "function") {
  console.error("The server entry point must have a default export with a property \`fetch: (req: Request) => Promise<Response>\`");
}

export default serverEntrypoint.fetch;

export const config = {
  name: "${displayName}",
  generator: "${name}@${version}",
  path: "/*",
  preferStatic: true,
};
`;
var getServerEntrypoint = (bundle, outDir) => {
  const entryChunks = Object.values(bundle).filter(
    (chunk) => chunk.type === "chunk" && chunk.isEntry
  );
  if (entryChunks.length === 0) {
    throw new Error("Could not find entry chunk in bundle - aborting!");
  }
  if (entryChunks.length > 1) {
    throw new Error("Found multiple entry chunks, unable to resolve server entry point - aborting!");
  }
  return join(outDir, entryChunks[0].fileName);
};
function createBuildPlugin(options) {
  let resolvedConfig;
  return {
    name: "vite-plugin-netlify:build",
    apply: "build",
    /** @see {@link https://vite.dev/guide/api-environment-plugins.html#per-environment-plugins} */
    applyToEnvironment({ name: name2 }) {
      return name2 === "ssr";
    },
    /** @see {@link https://vite.dev/guide/api-plugin.html#configresolved} */
    configResolved(config) {
      resolvedConfig = config;
    },
    /** @see {@link https://rollupjs.org/plugin-development/#writebundle} */
    async writeBundle(_, bundle) {
      const functionsDirectory = join(resolvedConfig.root, NETLIFY_FUNCTIONS_DIR);
      await mkdir(functionsDirectory, { recursive: true });
      const serverEntrypoint = getServerEntrypoint(bundle, this.environment.config.build.outDir);
      const serverEntrypointRelativePath = toPosixPath(relative(functionsDirectory, serverEntrypoint));
      await writeFile(
        join(functionsDirectory, NETLIFY_FUNCTION_FILENAME),
        createNetlifyFunctionHandler(
          serverEntrypointRelativePath,
          options?.displayName ?? NETLIFY_FUNCTION_DEFAULT_NAME
        )
      );
      createLoggerFromViteLogger(resolvedConfig.logger).log(
        `\u2713 Wrote SSR entry point to ${join(NETLIFY_FUNCTIONS_DIR, NETLIFY_FUNCTION_FILENAME)}
`
      );
    }
  };
}

// src/main.ts
function netlify(options = {}) {
  if (process.env.NETLIFY_DEV) {
    return [];
  }
  const devPlugin = {
    name: "vite-plugin-netlify",
    async configureServer(viteDevServer) {
      if (!viteDevServer.httpServer) {
        return;
      }
      const logger = createLoggerFromViteLogger(viteDevServer.config.logger);
      warnOnDuplicatePlugin(logger);
      const {
        blobs,
        edgeFunctions,
        environmentVariables,
        functions,
        images,
        middleware = true,
        redirects,
        staticFiles
      } = options;
      const netlifyDev = new NetlifyDev({
        blobs,
        edgeFunctions,
        environmentVariables,
        functions,
        images,
        logger,
        redirects,
        serverAddress: null,
        staticFiles: {
          ...staticFiles,
          directories: [viteDevServer.config.root, viteDevServer.config.publicDir]
        },
        projectRoot: viteDevServer.config.root
      });
      await netlifyDev.start();
      viteDevServer.httpServer.once("close", () => {
        delete process.env.__VITE_PLUGIN_NETLIFY_LOADED__;
        netlifyDev.stop();
      });
      logger.log("Environment loaded");
      if (middleware) {
        viteDevServer.middlewares.use(async function netlifyPreMiddleware(nodeReq, nodeRes, next) {
          const headers = {};
          const result = await netlifyDev.handleAndIntrospectNodeRequest(nodeReq, {
            headersCollector: (key, value) => {
              headers[key] = value;
            },
            serverAddress: `http://localhost:${nodeReq.socket.localPort}`
          });
          const isStaticFile = result?.type === "static";
          if (result && !isStaticFile) {
            await fromWebResponse(result.response, nodeRes);
            return;
          }
          for (const key in headers) {
            nodeRes.setHeader(key, headers[key]);
          }
          next();
        });
        logger.log(`Middleware loaded. Emulating features: ${netlifyDev.getEnabledFeatures().join(", ")}.`);
      }
      if (!netlifyDev.siteIsLinked) {
        logger.log(
          `\u{1F4AD} Linking this project to a Netlify site lets you deploy your site, use any environment variables defined on your team and site and much more. Run ${netlifyCommand("npx netlify init")} to get started.`
        );
      }
    }
  };
  const { enabled, ...buildOptions } = options.build ?? {};
  return [devPlugin, ...enabled === true ? [createBuildPlugin(buildOptions)] : []];
}
var warnOnDuplicatePlugin = (logger) => {
  if (process.env.__VITE_PLUGIN_NETLIFY_LOADED__) {
    logger.warn(
      warning(dedent`
        Multiple instances of @netlify/vite-plugin have been loaded. This may cause unexpected \
        behavior if the plugin is configured differently in each instance. If you have one \
        instance of this plugin in your Vite config, you may safely remove it.
      `)
    );
    return;
  }
  process.env.__VITE_PLUGIN_NETLIFY_LOADED__ = "true";
};
export {
  netlify as default
};
