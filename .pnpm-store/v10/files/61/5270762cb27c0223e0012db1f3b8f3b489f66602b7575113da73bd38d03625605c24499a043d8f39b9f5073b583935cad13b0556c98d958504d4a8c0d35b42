// src/lib/environment/blobs.ts
import { base64Encode } from "@netlify/runtime-utils";
var setupBlobsEnvironment = ({
  deployID,
  edgeURL,
  env,
  globalScope,
  primaryRegion,
  preferGlobal,
  siteID,
  token,
  uncachedEdgeURL
}) => {
  const context = {
    deployID,
    edgeURL,
    primaryRegion,
    siteID,
    token,
    uncachedEdgeURL
  };
  const serializedContext = base64Encode(JSON.stringify(context));
  if (preferGlobal) {
    globalScope.netlifyBlobsContext = serializedContext;
  } else {
    env.set("NETLIFY_BLOBS_CONTEXT", serializedContext);
  }
};

// src/lib/environment/branch.ts
var setupBranchEnvironment = ({ branch, env }) => {
  env.set("NETLIFY_BRANCH", branch);
};

// src/lib/environment/purge.ts
var setupCachePurgeEnvironment = ({ env, token }) => {
  env.set("NETLIFY_PURGE_API_TOKEN", token);
};

// src/lib/globals.ts
import { NetlifyCacheStorage } from "@netlify/cache/bootstrap";
var setCachesGlobal = (globalScope, getContext, userAgent) => {
  globalScope.caches = new NetlifyCacheStorage({
    getContext,
    userAgent
  });
};
var setNetlifyGlobal = (globalScope, env, getContext) => {
  globalScope.Netlify = {
    get context() {
      return getContext();
    },
    env
  };
};
var setGlobals = ({ env, getCacheContext, getRequestContext, globalScope, userAgent }) => {
  setCachesGlobal(globalScope, getCacheContext, userAgent);
  setNetlifyGlobal(globalScope, env, getRequestContext);
};

// src/lib/util.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length !== 0;

// src/main.ts
var startRuntime = ({
  blobs,
  branch,
  cache,
  deployID,
  env,
  getRequestContext,
  globalScope = globalThis,
  preferGlobal,
  siteID,
  userAgent
}) => {
  if (blobs) {
    setupBlobsEnvironment({
      ...blobs,
      deployID,
      env,
      globalScope,
      preferGlobal,
      siteID
    });
  }
  setGlobals({
    env,
    getCacheContext: cache.getCacheAPIContext,
    getRequestContext,
    globalScope,
    userAgent
  });
  if (isNonEmptyString(cache.purgeToken)) {
    setupCachePurgeEnvironment({
      env,
      token: cache.purgeToken
    });
  }
  if (isNonEmptyString(branch)) {
    setupBranchEnvironment({ branch, env });
  }
};
export {
  startRuntime
};
