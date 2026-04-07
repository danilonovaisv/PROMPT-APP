// src/node/main.ts
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import {
  renderFunctionErrorPage,
  killProcess
} from "@netlify/dev-utils";
import {
  find,
  generateManifest,
  mergeDeclarations,
  DenoBridge
} from "@netlify/edge-bundler";
import { base64Encode } from "@netlify/runtime-utils";
import getAvailablePort from "get-port";

// src/node/headers.ts
var headers = {
  BlobsInfo: "x-nf-blobs-info",
  DeployID: "x-nf-deploy-id",
  DeployContext: "x-nf-deploy-context",
  FeatureFlags: "x-nf-feature-flags",
  ForwardedHost: "x-forwarded-host",
  ForwardedProtocol: "x-forwarded-proto",
  Functions: "x-nf-edge-functions",
  InvocationMetadata: "x-nf-edge-functions-metadata",
  Geo: "x-nf-geo",
  Passthrough: "x-nf-passthrough",
  PassthroughHost: "x-nf-passthrough-host",
  PassthroughProtocol: "x-nf-passthrough-proto",
  IP: "x-nf-client-connection-ip",
  Site: "X-NF-Site-Info",
  DebugLogging: "x-nf-debug-logging",
  Account: "x-nf-account-info",
  RequestID: "x-nf-request-id",
  AvailableFunctions: "x-nf-available-edge-functions",
  FunctionDeclarations: "x-nf-edge-functions-declarations",
  UncaughtError: "x-nf-uncaught-error",
  AcceptEncoding: "accept-encoding"
};

// src/node/main.ts
var denoRunPath = path.resolve(fileURLToPath(import.meta.url), "../../deno/server.mjs");
var DENO_SERVER_POLL_INTERVAL = 50;
var DENO_SERVER_POLL_TIMEOUT = 3e3;
var LOCAL_HOST = "127.0.0.1";
var UPSTREAM_REQUEST_TIMEOUT = 37e3;
var REQUEST_TIMEOUT = UPSTREAM_REQUEST_TIMEOUT - 1e3;
var EdgeFunctionsHandler = class {
  configDeclarations;
  denoServerProcess;
  directories;
  geolocation;
  initialization;
  initialized;
  stopped;
  logger;
  requestTimeout;
  siteID;
  siteName;
  constructor(options) {
    this.configDeclarations = options.configDeclarations;
    this.directories = options.directories;
    this.geolocation = options.geolocation;
    this.initialization = this.initialize({
      ...options.env,
      DENO_REGION: "dev"
    });
    this.initialized = false;
    this.stopped = false;
    this.logger = options.logger;
    this.requestTimeout = options.requestTimeout ?? REQUEST_TIMEOUT;
    this.siteID = options.siteID;
    this.siteName = options.siteName;
  }
  /**
   * Retrieves the in-source configuration objects for a set of edge functions.
   * The evaluation of the functions and the retrieval of the configs must take
   * place in Deno, but all the logic for processing those configurations and
   * merging them with other sources lives in Node.js. To keep a single source
   * of truth, we make a request to the Deno server with a special method that
   * instructs the handler to evaluate the functions and return their configs,
   * which are then returned by this method.
   */
  async getFunctionConfigs(denoPort, functions) {
    const url = new URL(`http://${LOCAL_HOST}:${denoPort.toString()}`);
    url.searchParams.set("functions", encodeURIComponent(JSON.stringify(functions)));
    const res = await fetch(url, {
      method: "NETLIFYCONFIG"
    });
    const data = await res.json();
    if (res.ok) {
      return { configs: data };
    }
    return { error: data.error };
  }
  /**
   * Returns the list of edge functions that should run for a given request.
   * It computes both the names of the edge functions that should run as well
   * as the invocation metadata object that must be included in the request.
   */
  getFunctionsForRequest(req, availableFunctions, functionConfigs) {
    const url = new URL(req.url);
    const declarations = mergeDeclarations(this.configDeclarations, functionConfigs, {}, []);
    const { manifest } = generateManifest({
      declarations,
      userFunctionConfig: functionConfigs,
      functions: availableFunctions
    });
    const matchingFunctionNames = [];
    const routeIndexes = [];
    const routes = [...manifest.routes, ...manifest.post_cache_routes];
    routes.forEach((route, index) => {
      if (route.methods && route.methods.length !== 0 && !route.methods.includes(req.method)) {
        return;
      }
      const pattern = new RegExp(route.pattern);
      if (!pattern.test(url.pathname)) {
        return;
      }
      if (route.headers) {
        const headerMatches = Object.entries(route.headers).every(([headerName, headerMatch]) => {
          const requestHeaderValue = req.headers.get(headerName);
          if (headerMatch?.matcher === "exists") {
            return requestHeaderValue !== null;
          }
          if (headerMatch?.matcher === "missing") {
            return requestHeaderValue === null;
          }
          if (requestHeaderValue && headerMatch?.matcher === "regex") {
            const pattern2 = new RegExp(headerMatch.pattern);
            return pattern2.test(requestHeaderValue.split(", ").join(","));
          }
          return false;
        });
        if (!headerMatches) {
          return;
        }
      }
      const isExcludedForFunction = manifest.function_config[route.function]?.excluded_patterns?.some(
        (pattern2) => new RegExp(pattern2).test(url.pathname)
      );
      if (isExcludedForFunction) {
        return;
      }
      const isExcludedForRoute = route.excluded_patterns.some((pattern2) => new RegExp(pattern2).test(url.pathname));
      if (isExcludedForRoute) {
        return;
      }
      matchingFunctionNames.push(route.function);
      routeIndexes.push(index);
    });
    const invocationMetadata = {
      function_config: manifest.function_config,
      req_routes: routeIndexes,
      routes: routes.map((route) => ({
        function: route.function,
        path: route.path,
        pattern: route.pattern
      }))
    };
    return { functionNames: matchingFunctionNames, invocationMetadata };
  }
  /**
   * Runs a request through the edge functions handler. The request may or may
   * not match any edge functions: if it does, this method takes ownership of
   * the request and returns the corresponding response; if it doesn't, the
   * method returns `undefined`.
   */
  async match(request) {
    if (request.headers.has(headers.Passthrough)) {
      return;
    }
    const functions = await find(this.directories);
    if (functions.length === 0) {
      return;
    }
    const functionsMap = functions.reduce(
      (acc, { name, path: path2 }) => ({
        ...acc,
        [name]: pathToFileURL(path2).toString()
      }),
      {}
    );
    const initMessage = setTimeout(() => {
      if (this.initialized) {
        return;
      }
      this.logger.log(
        "Setting up the Netlify Edge Functions environment. This may take up to a couple of minutes, depending on your internet connection."
      );
    }, 5e3);
    const { denoPort, success } = await this.initialization;
    if (!success) {
      clearTimeout(initMessage);
      return;
    }
    const acceptsHTML = Boolean(request.headers.get("accept")?.includes("text/html"));
    const { configs, error } = await this.getFunctionConfigs(denoPort, functionsMap);
    if (error) {
      return { handle: () => this.renderError(JSON.stringify({ error }), acceptsHTML) };
    }
    const { functionNames, invocationMetadata } = this.getFunctionsForRequest(request, functions, configs);
    if (functionNames.length === 0) {
      return;
    }
    return {
      handle: async (request2, originServerAddress) => {
        const originURL = new URL(originServerAddress);
        const url = new URL(request2.url);
        url.hostname = LOCAL_HOST;
        url.port = denoPort.toString();
        url.protocol = "http:";
        request2.headers.set(headers.AcceptEncoding, "identity");
        request2.headers.set(headers.AvailableFunctions, JSON.stringify(functionsMap));
        request2.headers.set(headers.DeployContext, "dev");
        request2.headers.set(headers.DeployID, "0");
        request2.headers.set(headers.ForwardedHost, `localhost:${originURL.port}`);
        request2.headers.set(headers.ForwardedProtocol, `http:`);
        request2.headers.set(headers.Functions, functionNames.join(","));
        request2.headers.set(headers.Geo, base64Encode(this.geolocation));
        request2.headers.set(headers.InvocationMetadata, base64Encode(invocationMetadata));
        request2.headers.set(headers.IP, LOCAL_HOST);
        request2.headers.set(headers.Passthrough, "passthrough");
        request2.headers.set(headers.PassthroughHost, `localhost:${originURL.port}`);
        request2.headers.set(headers.PassthroughProtocol, "http:");
        const site = {
          id: this.siteID,
          name: this.siteName,
          url: originServerAddress
        };
        request2.headers.set(headers.Site, base64Encode(site));
        const response = await fetch(url, request2);
        const isUncaughtError = response.headers.has(headers.UncaughtError);
        if (isUncaughtError) {
          return await this.renderError(await response.text(), acceptsHTML);
        }
        return response;
      }
    };
  }
  /**
   * Initializes the Deno server where the edge functions will run.
   */
  async initialize(env) {
    let success = true;
    const processRef = {};
    this.denoServerProcess = processRef;
    const denoPort = await getAvailablePort();
    const denoBridge = new DenoBridge({
      // TODO: Remove this override once `@netlify/edge-bundler` has been
      // updated to require Deno 2.x.
      versionRange: "^2.2.4"
    });
    const runOptions = {
      denoPort,
      requestTimeout: this.requestTimeout
    };
    const denoFlags = ["--allow-scripts", "--quiet", "--no-lock"];
    const script = `import('${pathToFileURL(denoRunPath).toString()}');`;
    try {
      await denoBridge.runInBackground(["eval", ...denoFlags, script, JSON.stringify(runOptions)], processRef, {
        env,
        extendEnv: false,
        pipeOutput: true
      });
      if (this.stopped) {
        await killProcess(processRef.ps);
        this.denoServerProcess = void 0;
        success = false;
      }
    } catch (error) {
      success = false;
      this.logger.error(`An error occurred while setting up the Netlify Edge Functions environment: ${String(error)}`);
    }
    if (success) {
      await this.waitForDenoServer(denoPort);
    }
    this.initialized = true;
    return {
      denoPort,
      success
    };
  }
  async renderError(errorBuffer, acceptsHTML) {
    const status = 500;
    const {
      error: { message, name, stack = "" }
    } = JSON.parse(errorBuffer);
    if (!acceptsHTML) {
      return new Response(`${name}: ${message}
 ${stack}`, { status });
    }
    const formattedError = JSON.stringify({
      errorType: name,
      errorMessage: message,
      trace: stack.split("\\n")
    });
    const errorBody = await renderFunctionErrorPage(formattedError, "edge function");
    return new Response(errorBody, {
      headers: {
        "Content-Type": "text/html"
      },
      status
    });
  }
  async waitForDenoServer(port, count = 1) {
    try {
      await fetch(`http://${LOCAL_HOST}:${port.toString()}`, {
        method: "HEAD"
      });
    } catch {
      if (!this.denoServerProcess) {
        return;
      }
      if ((count + 1) * DENO_SERVER_POLL_INTERVAL > DENO_SERVER_POLL_TIMEOUT) {
        throw new Error("Could not establish a connection to the Netlify Edge Functions local development server");
      }
      await new Promise((resolve) => setTimeout(resolve, DENO_SERVER_POLL_INTERVAL));
      return this.waitForDenoServer(port, count + 1);
    }
  }
  async stop() {
    if (this.stopped) return;
    this.stopped = true;
    if (!this.denoServerProcess?.ps) {
      return;
    }
    const { ps } = this.denoServerProcess;
    this.denoServerProcess = void 0;
    try {
      await killProcess(ps);
    } catch {
    }
  }
};
export {
  EdgeFunctionsHandler
};
