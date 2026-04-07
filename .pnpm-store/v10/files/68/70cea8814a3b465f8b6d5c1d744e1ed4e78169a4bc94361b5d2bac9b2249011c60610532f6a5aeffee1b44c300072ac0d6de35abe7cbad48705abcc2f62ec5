// src/main.ts
import { promises as fs2 } from "fs";
import path2 from "path";
import process2 from "process";
import { parseAIGatewayContext, setupAIGateway } from "@netlify/ai/bootstrap";
import { resolveConfig } from "@netlify/config";
import {
  ensureNetlifyIgnore,
  FileWatcher,
  getAPIToken,
  getGeoLocation,
  LocalState,
  HTTPServer,
  Reactive
} from "@netlify/dev-utils";
import { EdgeFunctionsHandler } from "@netlify/edge-functions-dev";
import { FunctionsHandler } from "@netlify/functions-dev";
import { HeadersHandler } from "@netlify/headers";
import { ImageHandler } from "@netlify/images";
import { RedirectsHandler } from "@netlify/redirects";
import { StaticHandler } from "@netlify/static";
import { NetlifyDB } from "@netlify/db-dev";
import { applyMigrations, resetDatabase } from "@netlify/db-dev";

// src/lib/env.ts
var SUPPORTED_CONTEXTS = ["all", "production", "deploy-preview", "branch-deploy", "dev", "dev-server"];
var injectEnvVariables = async ({
  accountSlug,
  baseVariables = {},
  envAPI,
  netlifyAPI,
  siteID
}) => {
  const results = {};
  let variables = baseVariables;
  if (netlifyAPI && siteID && accountSlug) {
    variables = await getEnvelopeEnv({
      accountId: accountSlug,
      api: netlifyAPI,
      env: baseVariables,
      siteId: siteID
    });
  }
  for (const [key, variable] of Object.entries(variables)) {
    const existsInProcess = envAPI.has(key);
    const [usedSource, ...overriddenSources] = existsInProcess ? ["process", ...variable.sources] : variable.sources;
    const isInternal = variable.sources.includes("internal");
    const result = {
      isInternal,
      originalValue: envAPI.get(key),
      overriddenSources,
      usedSource,
      value: variable.value
    };
    if (!existsInProcess || isInternal) {
      envAPI.set(key, variable.value);
    }
    results[key] = result;
  }
  return results;
};
var getValueForContext = (values, contextOrBranch) => {
  const isSupportedContext = SUPPORTED_CONTEXTS.includes(contextOrBranch);
  if (!isSupportedContext) {
    const valueMatchingAsBranch = values.find((val) => val.context_parameter === contextOrBranch);
    if (valueMatchingAsBranch != null) {
      return valueMatchingAsBranch;
    }
    const valueMatchingContext = values.find((val) => val.context === "all" || val.context === "branch-deploy");
    return valueMatchingContext ?? void 0;
  }
  const valueMatchingAsContext = values.find((val) => val.context === "all" || val.context === contextOrBranch);
  return valueMatchingAsContext ?? void 0;
};
var filterEnvBySource = (env, source) => Object.fromEntries(Object.entries(env).filter(([, variable]) => variable.sources[0] === source));
var fetchEnvelopeItems = async function({
  accountId,
  api,
  key,
  siteId
}) {
  if (accountId === void 0) {
    return [];
  }
  try {
    if (key) {
      const envelopeItem = await api.getEnvVar({ accountId, key, siteId });
      return [envelopeItem];
    }
    const envelopeItems = await api.getEnvVars({ accountId, siteId });
    return envelopeItems;
  } catch {
    return [];
  }
};
var formatEnvelopeData = ({
  context = "dev",
  envelopeItems = [],
  scope = "any",
  source
}) => envelopeItems.filter(({ values }) => Boolean(getValueForContext(values, context))).filter(({ scopes }) => scope === "any" ? true : scopes.includes(scope)).sort((left, right) => left.key.toLowerCase() < right.key.toLowerCase() ? -1 : 1).reduce((acc, cur) => {
  const val = getValueForContext(cur.values, context);
  if (val === void 0) {
    throw new TypeError(`failed to locate environment variable value for ${context} context`);
  }
  const { context: itemContext, context_parameter: branch, value } = val;
  return {
    ...acc,
    [cur.key]: {
      context: itemContext,
      branch,
      scopes: cur.scopes,
      sources: [source],
      value
    }
  };
}, {});
var getEnvelopeEnv = async ({
  accountId,
  api,
  context = "dev",
  env,
  key = "",
  raw = false,
  scope = "any",
  siteId
}) => {
  const [accountEnvelopeItems, siteEnvelopeItems] = await Promise.all([
    fetchEnvelopeItems({ api, accountId, key }),
    fetchEnvelopeItems({ api, accountId, key, siteId })
  ]);
  const accountEnv = formatEnvelopeData({ context, envelopeItems: accountEnvelopeItems, scope, source: "account" });
  const siteEnv = formatEnvelopeData({ context, envelopeItems: siteEnvelopeItems, scope, source: "ui" });
  if (raw) {
    const entries = Object.entries({ ...accountEnv, ...siteEnv });
    return entries.reduce(
      (obj, [envVarKey, metadata]) => ({
        ...obj,
        [envVarKey]: metadata.value
      }),
      {}
    );
  }
  const generalEnv = filterEnvBySource(env, "general");
  const internalEnv = filterEnvBySource(env, "internal");
  const addonsEnv = filterEnvBySource(env, "addons");
  const configFileEnv = filterEnvBySource(env, "configFile");
  const includeConfigEnvVars = /any|builds|post[-_]processing/.test(scope);
  return {
    ...generalEnv,
    ...accountEnv,
    ...includeConfigEnvVars ? addonsEnv : {},
    ...siteEnv,
    ...includeConfigEnvVars ? configFileEnv : {},
    ...internalEnv
  };
};

// src/lib/fs.ts
import { promises as fs } from "fs";
var isDirectory = async (path3) => {
  try {
    const stat = await fs.stat(path3);
    return stat.isDirectory();
  } catch {
  }
  return false;
};
var isFile = async (path3) => {
  try {
    const stat = await fs.stat(path3);
    return stat.isFile();
  } catch {
  }
  return false;
};

// src/lib/reqres.ts
import { Readable } from "stream";
var normalizeHeaders = (request) => {
  const result = [];
  let headers = request.headers;
  if (request.httpVersionMajor >= 2) {
    headers = { ...headers };
    delete headers[":authority"];
    delete headers[":method"];
    delete headers[":path"];
    delete headers[":scheme"];
  }
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      result.push([key, value.join(",")]);
    } else if (typeof value === "string") {
      result.push([key, value]);
    }
  }
  return result;
};
var getNormalizedRequest = (input, requestID, removeBody) => {
  const method = input.method.toUpperCase();
  const headers = input.headers;
  headers.set("x-nf-request-id", requestID);
  return new Request(input.url, {
    body: method === "GET" || method === "HEAD" || removeBody ? null : input.body,
    // @ts-expect-error Not typed!
    duplex: "half",
    headers,
    method
  });
};
var getNormalizedRequestFromNodeRequest = (input, requestID, removeBody) => {
  const { headers, url = "" } = input;
  const origin = `http://${headers.host ?? "localhost"}`;
  const fullUrl = new URL(url, origin);
  const method = input.method?.toUpperCase() ?? "GET";
  const body = input.method === "GET" || input.method === "HEAD" || removeBody ? null : Readable.toWeb(input);
  const normalizedHeaders = normalizeHeaders(input);
  normalizedHeaders.push(["x-nf-request-id", requestID]);
  return new Request(fullUrl, {
    body,
    // @ts-expect-error Not typed!
    duplex: "half",
    headers: normalizedHeaders,
    method
  });
};

// src/lib/request_id.ts
import { ulid } from "ulid";
var generateRequestID = () => ulid();

// src/lib/runtime.ts
import path from "path";
import process from "process";
import { BlobsServer } from "@netlify/blobs/server";
import { startRuntime } from "@netlify/runtime";
var restoreEnvironment = (snapshot) => {
  for (const key in snapshot) {
    if (snapshot[key] === void 0) {
      delete process.env[key];
    } else {
      process.env[key] = snapshot[key];
    }
  }
};
var getRuntime = async ({ blobs, deployID, projectRoot, siteID }) => {
  const blobsToken = Math.random().toString().slice(2);
  const blobsServer = blobs ? new BlobsServer({
    directory: path.join(projectRoot, ".netlify", "blobs-serve"),
    token: blobsToken
  }) : null;
  const blobsServerDetails = await blobsServer?.start();
  const envSnapshot = {};
  const env = {
    delete: (key) => {
      envSnapshot[key] = envSnapshot[key] || process.env[key];
      delete process.env[key];
    },
    get: (key) => process.env[key],
    has: (key) => Boolean(process.env[key]),
    set: (key, value) => {
      envSnapshot[key] = envSnapshot[key] || process.env[key];
      process.env[key] = value;
    },
    toObject: () => process.env
  };
  startRuntime({
    blobs: blobsServerDetails ? {
      edgeURL: `http://localhost:${blobsServerDetails.port}`,
      uncachedEdgeURL: `http://localhost:${blobsServerDetails.port}`,
      primaryRegion: "us-east-2",
      token: blobsToken
    } : void 0,
    cache: {
      getCacheAPIContext: () => null,
      purgeToken: ""
    },
    deployID,
    env,
    getRequestContext: () => null,
    siteID
  });
  return {
    env,
    envSnapshot,
    stop: async () => {
      restoreEnvironment(envSnapshot);
      await blobsServer?.stop();
    }
  };
};

// src/main.ts
var notFoundHandler = async () => new Response("Not found", { status: 404 });
var NetlifyDev = class {
  #apiHost;
  #apiScheme;
  #apiToken;
  #cleanupJobs;
  #edgeFunctionsHandler;
  #functionsHandler;
  #geolocationConfig;
  #functionsServePath;
  #config;
  #features;
  #db;
  #headersHandler;
  #imageRemoteURLPatterns;
  #imageHandler;
  #logger;
  #projectRoot;
  #redirectsHandler;
  #serverAddress;
  #siteID;
  #staticHandler;
  #staticHandlerAdditionalDirectories;
  constructor(options) {
    if (options.apiURL) {
      const apiURL = new URL(options.apiURL);
      this.#apiHost = apiURL.host;
      this.#apiScheme = apiURL.protocol.slice(0, -1);
    }
    const projectRoot = options.projectRoot ?? process2.cwd();
    this.#apiToken = options.apiToken;
    this.#cleanupJobs = [];
    this.#geolocationConfig = options.geolocation;
    this.#features = {
      aiGateway: options.aiGateway?.enabled !== false,
      blobs: options.blobs?.enabled !== false,
      db: process2.env.EXPERIMENTAL_NETLIFY_DB_ENABLED === "1",
      edgeFunctions: options.edgeFunctions?.enabled !== false,
      environmentVariables: options.environmentVariables?.enabled !== false,
      functions: options.functions?.enabled !== false,
      geolocation: options.geolocation?.enabled !== false,
      headers: options.headers?.enabled !== false,
      images: options.images?.enabled !== false,
      redirects: options.redirects?.enabled !== false,
      static: options.staticFiles?.enabled !== false
    };
    this.#functionsServePath = path2.join(projectRoot, ".netlify", "functions-serve");
    this.#imageRemoteURLPatterns = options.images?.remoteURLPatterns ?? [];
    this.#logger = options.logger ?? globalThis.console;
    this.#serverAddress = options.serverAddress;
    this.#projectRoot = projectRoot;
    this.#staticHandlerAdditionalDirectories = options.staticFiles?.directories ?? [];
  }
  getServerAddress(requestServerAddress) {
    if (requestServerAddress) {
      return requestServerAddress;
    }
    if (typeof this.#serverAddress === "string") {
      return this.#serverAddress;
    }
    throw new Error("Server address is not defined");
  }
  /**
   * Runs a request through the Netlify request chain and returns a `Response`
   * if there's a match. We must not disturb the incoming request unless we
   * know we will be returning a response, so this method takes a read-only
   * request that is safe to access (used for matching) and a getter for the
   * actual request (used for handling matches).
   *
   * @param readRequest Read-only version of the request (without a body)
   * @param getWriteRequest Getter for the actual request (with a body)
   * @param destPath Destination directory for compiled files
   * @param options Options object
   * @returns
   */
  async handleInEphemeralDirectory(readRequest, getWriteRequest, destPath, options = {}) {
    const serverAddress = this.getServerAddress(options.serverAddress);
    const edgeFunctionMatch = await this.#edgeFunctionsHandler?.match(readRequest);
    if (edgeFunctionMatch) {
      return {
        response: await edgeFunctionMatch.handle(getWriteRequest(), serverAddress),
        type: "edge-function"
      };
    }
    const imageMatch = this.#imageHandler?.match(readRequest);
    if (imageMatch) {
      const response = await imageMatch.handle(serverAddress);
      return { response, type: "image" };
    }
    const functionMatch = await this.#functionsHandler?.match(readRequest, destPath);
    if (functionMatch) {
      if (functionMatch.preferStatic) {
        const staticMatch2 = await this.#staticHandler?.match(readRequest);
        if (staticMatch2) {
          const response = await staticMatch2.handle();
          await this.#headersHandler?.apply(readRequest, response, options.headersCollector);
          return { response, type: "static" };
        }
      }
      return { response: await functionMatch.handle(getWriteRequest()), type: "function" };
    }
    const redirectMatch = await this.#redirectsHandler?.match(readRequest);
    if (redirectMatch) {
      const redirectRequest = new Request(redirectMatch.target);
      const imageMatch2 = this.#imageHandler?.match(redirectRequest);
      if (imageMatch2) {
        const response2 = await imageMatch2.handle(serverAddress);
        return { response: response2, type: "image" };
      }
      const functionMatch2 = await this.#functionsHandler?.match(redirectRequest, destPath);
      if (functionMatch2 && !functionMatch2.preferStatic) {
        return {
          response: await functionMatch2.handle(getWriteRequest()),
          type: "function"
        };
      }
      const response = await this.#redirectsHandler?.handle(
        getWriteRequest(),
        redirectMatch,
        async (maybeStaticFile) => {
          const staticMatch2 = await this.#staticHandler?.match(maybeStaticFile);
          if (!staticMatch2) {
            return;
          }
          return async () => {
            const response2 = await staticMatch2.handle();
            await this.#headersHandler?.apply(new Request(redirectMatch.target), response2, options.headersCollector);
            return response2;
          };
        }
      );
      if (response) {
        return { response, type: "redirect" };
      }
    }
    const staticMatch = await this.#staticHandler?.match(readRequest);
    if (staticMatch) {
      const response = await staticMatch.handle();
      await this.#headersHandler?.apply(readRequest, response, options.headersCollector);
      return { response, type: "static" };
    }
  }
  async getConfig() {
    const configFilePath = path2.resolve(this.#projectRoot, "netlify.toml");
    const configFileExists = await isFile(configFilePath);
    const config = await resolveConfig({
      config: configFileExists ? configFilePath : void 0,
      context: "dev",
      cwd: process2.cwd(),
      host: this.#apiHost,
      offline: !this.#siteID,
      mode: "cli",
      repositoryRoot: this.#projectRoot,
      scheme: this.#apiScheme,
      siteId: this.#siteID,
      token: this.#apiToken
    });
    return config;
  }
  /**
   * Runs a `Request` through the Netlify request chain. If there is a match,
   * it returns the resulting `Response` object; if not, it returns `undefined`.
   */
  async handle(request, options = {}) {
    const result = await this.handleAndIntrospect(request, options);
    return result?.response;
  }
  /**
   * Runs a `Request` through the Netlify request chain. If there is a match,
   * it returns an object with the resulting `Response` object and information
   * about the match; if not, it returns `undefined`.
   */
  async handleAndIntrospect(request, options = {}) {
    await fs2.mkdir(this.#functionsServePath, { recursive: true });
    const destPath = await fs2.mkdtemp(path2.join(this.#functionsServePath, `_`));
    const requestID = generateRequestID();
    const matchRequest = getNormalizedRequest(request, requestID, true);
    const getHandleRequest = () => getNormalizedRequest(request, requestID, false);
    try {
      return await this.handleInEphemeralDirectory(matchRequest, getHandleRequest, destPath, options);
    } finally {
      try {
        await fs2.rm(destPath, { force: true, recursive: true });
      } catch {
      }
    }
  }
  /**
   * Runs a Node.js `IncomingMessage` through the Netlify request chain. If
   * there is a match, it returns an object with the resulting `Response`
   * object and information about the match; if not, it returns `undefined`.
   */
  async handleAndIntrospectNodeRequest(request, options = {}) {
    await fs2.mkdir(this.#functionsServePath, { recursive: true });
    const destPath = await fs2.mkdtemp(path2.join(this.#functionsServePath, `_`));
    const requestID = generateRequestID();
    const matchRequest = getNormalizedRequestFromNodeRequest(request, requestID, true);
    const getHandleRequest = () => getNormalizedRequestFromNodeRequest(request, requestID, false);
    try {
      return await this.handleInEphemeralDirectory(matchRequest, getHandleRequest, destPath, options);
    } finally {
      try {
        await fs2.rm(destPath, { force: true, recursive: true });
      } catch {
      }
    }
  }
  get siteIsLinked() {
    return Boolean(this.#siteID);
  }
  async start() {
    await ensureNetlifyIgnore(this.#projectRoot, this.#logger);
    this.#apiToken = this.#apiToken ?? await getAPIToken();
    const state = new LocalState(this.#projectRoot);
    const siteID = state.get("siteId");
    this.#siteID = siteID;
    const config = await this.getConfig();
    this.#config = config;
    const reactiveConfig = new Reactive(config);
    const fileWatcher = new FileWatcher();
    this.#cleanupJobs.push(() => fileWatcher.close());
    if (config.configPath) {
      const reloadConfig = () => {
        void (async () => {
          try {
            const newConfig = await this.getConfig();
            this.#config = newConfig;
            reactiveConfig.set(newConfig);
          } catch (error) {
            this.#logger.warn(`Failed to reload config: ${String(error)}`);
          }
        })();
      };
      fileWatcher.subscribe({
        id: "netlify-config",
        paths: config.configPath,
        onChange: reloadConfig,
        onAdd: reloadConfig,
        onUnlink: reloadConfig
      });
    }
    const runtime = await getRuntime({
      blobs: this.#features.blobs,
      deployID: "0",
      projectRoot: this.#projectRoot,
      siteID: siteID ?? "0"
    });
    this.#cleanupJobs.push(() => runtime.stop());
    if (this.#features.db) {
      try {
        const dbDirectory = path2.join(this.#projectRoot, ".netlify", "db");
        const db = new NetlifyDB({ directory: dbDirectory });
        const connectionString = await db.start();
        runtime.env.set("NETLIFY_DB_URL", connectionString);
        state.set("dbConnectionString", connectionString);
        this.#db = db;
        this.#cleanupJobs.push(async () => {
          await db.stop();
          state.delete("dbConnectionString");
        });
      } catch (error) {
        this.#db = void 0;
        this.#logger.warn(`Failed to start Netlify DB locally: ${String(error)}`);
      }
    }
    if (this.#features.aiGateway && config?.siteInfo?.capabilities?.ai_gateway_disabled) {
      this.#features.aiGateway = false;
    }
    if (this.#features.aiGateway && this.#features.environmentVariables && config?.api) {
      await setupAIGateway({
        api: config.api,
        env: config.env || {},
        siteID,
        siteURL: config.siteInfo?.url,
        accountID: config.siteInfo?.account_id,
        siteHasDeploy: !!config.siteInfo?.published_deploy
      });
      if (config.env.AI_GATEWAY) {
        runtime.env.set("AI_GATEWAY", config.env.AI_GATEWAY.value);
        const aiGatewayContext = parseAIGatewayContext(config.env.AI_GATEWAY.value);
        if (aiGatewayContext) {
          runtime.env.set("NETLIFY_AI_GATEWAY_KEY", aiGatewayContext.token);
          runtime.env.set("NETLIFY_AI_GATEWAY_URL", aiGatewayContext.url);
          if (aiGatewayContext.envVars) {
            for (const envVar of aiGatewayContext.envVars) {
              runtime.env.set(envVar.key, aiGatewayContext.token);
              runtime.env.set(envVar.url, aiGatewayContext.url);
            }
          }
        }
      }
    }
    let serverAddress;
    if (typeof this.#serverAddress === "string") {
      serverAddress = this.#serverAddress;
    } else if (this.#serverAddress !== null && (this.#features.edgeFunctions || this.#features.images)) {
      const passthroughServer = new HTTPServer(async (req) => {
        const res = await this.handle(req);
        return res ?? new Response(null, { status: 404 });
      });
      this.#cleanupJobs.push(() => passthroughServer.stop());
      serverAddress = await passthroughServer.start();
      this.#serverAddress = serverAddress;
    }
    let envVariables = {};
    if (this.#features.environmentVariables) {
      envVariables = await injectEnvVariables({
        accountSlug: config?.siteInfo?.account_slug,
        baseVariables: config?.env || {},
        envAPI: runtime.env,
        netlifyAPI: config?.api,
        siteID
      });
    }
    let geolocation;
    if (this.#features.edgeFunctions) {
      const edgeFunctionsEnv = {
        // User-defined env vars + documented runtime env vars
        ...Object.entries(envVariables).reduce(
          (acc, [key, variable]) => ({
            ...acc,
            [key]: variable.value
          }),
          {}
        ),
        // Add runtime env vars that we've set ourselves so far. These are "internal" env vars,
        // part of the runtime emulation. They've already been populated on this process's env, which
        // is needed to make other dev features work. These are different than the "documented" runtime
        // env vars, in that they are implementation details, needed to make our features work.
        ...Object.keys(runtime.envSnapshot).reduce(
          (acc, key) => ({
            ...acc,
            [key]: runtime.env.get(key) ?? ""
          }),
          {}
        )
      };
      geolocation ??= await getGeoLocation({
        enabled: this.#features.geolocation,
        cache: this.#geolocationConfig?.cache ?? true,
        state
      });
      const edgeFunctionsHandler = new EdgeFunctionsHandler({
        configDeclarations: this.#config?.config.edge_functions ?? [],
        directories: [this.#config?.config.build.edge_functions].filter(Boolean),
        env: edgeFunctionsEnv,
        geolocation,
        logger: this.#logger,
        siteID,
        siteName: config?.siteInfo.name
      });
      this.#edgeFunctionsHandler = edgeFunctionsHandler;
      this.#cleanupJobs.push(() => edgeFunctionsHandler.stop());
    }
    if (this.#features.functions) {
      const userFunctionsPath = this.#config?.config.functionsDirectory ?? path2.join(this.#projectRoot, "netlify/functions");
      const userFunctionsPathExists = await isDirectory(userFunctionsPath);
      geolocation ??= await getGeoLocation({
        enabled: this.#features.geolocation,
        cache: this.#geolocationConfig?.cache ?? true,
        state
      });
      this.#functionsHandler = new FunctionsHandler({
        config: reactiveConfig,
        destPath: this.#functionsServePath,
        fileWatcher,
        geolocation,
        projectRoot: this.#projectRoot,
        settings: {},
        siteId: this.#siteID,
        userFunctionsPath: userFunctionsPathExists ? userFunctionsPath : void 0
      });
    }
    if (this.#features.headers) {
      this.#headersHandler = new HeadersHandler({
        configPath: this.#config?.configPath,
        configHeaders: this.#config?.config.headers,
        projectDir: this.#projectRoot,
        publishDir: this.#config?.config.build.publish ?? void 0,
        logger: this.#logger
      });
    }
    if (this.#features.redirects) {
      this.#redirectsHandler = new RedirectsHandler({
        configPath: this.#config?.configPath,
        configRedirects: this.#config?.config.redirects,
        jwtRoleClaim: "",
        jwtSecret: "",
        notFoundHandler,
        projectDir: this.#projectRoot
      });
    }
    if (this.#features.static) {
      this.#staticHandler = new StaticHandler({
        directory: [
          this.#config?.config.build.publish ?? this.#projectRoot,
          ...this.#staticHandlerAdditionalDirectories
        ]
      });
    }
    if (this.#features.images) {
      const remoteImages = [...this.#config?.config?.images?.remote_images ?? [], ...this.#imageRemoteURLPatterns];
      this.#imageHandler = new ImageHandler({
        imagesConfig: {
          remote_images: remoteImages
        },
        logger: this.#logger
      });
    }
    return {
      serverAddress
    };
  }
  get db() {
    return this.#db;
  }
  async stop() {
    await Promise.allSettled(this.#cleanupJobs.map((task) => task()));
  }
  getEnabledFeatures() {
    return Object.entries(this.#features).filter(([_, enabled]) => enabled).map(([feature]) => feature);
  }
};
export {
  NetlifyDev,
  applyMigrations,
  resetDatabase
};
