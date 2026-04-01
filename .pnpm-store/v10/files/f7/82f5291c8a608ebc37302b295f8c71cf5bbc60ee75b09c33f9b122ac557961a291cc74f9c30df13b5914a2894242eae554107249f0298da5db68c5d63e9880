// src/polyfill.ts
var NetlifyCacheStorageProxy = class {
  async delete(name) {
    if (globalThis.caches) {
      return globalThis.caches.delete(name);
    }
    return false;
  }
  async has(name) {
    if (globalThis.caches) {
      return globalThis.caches.has(name);
    }
    return false;
  }
  async keys() {
    if (globalThis.caches) {
      return globalThis.caches.keys();
    }
    return [];
  }
  async match(request, options) {
    if (globalThis.caches) {
      return globalThis.caches.match(request, options);
    }
  }
  async open(cacheName) {
    if (globalThis.caches) {
      return globalThis.caches.open(cacheName);
    }
    return new NetlifyNoopCache();
  }
};
var NetlifyNoopCache = class {
  async add(_) {
  }
  async addAll(_) {
  }
  async delete(_) {
    return true;
  }
  async keys(_) {
    return [];
  }
  async match(_) {
  }
  async matchAll(_) {
    return [];
  }
  async put(_, __) {
  }
};
var caches = new NetlifyCacheStorageProxy();

// src/headers.ts
var CacheStatus = "cache-status";
var NetlifyCacheId = "netlify-cache-id";
var NetlifyCacheTag = "netlify-cache-tag";
var NetlifyCdnCacheControl = "netlify-cdn-cache-control";
var NetlifyVary = "netlify-vary";

// src/cache-headers/validation.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var requireArrayOfStrings = (name, value) => {
  if (!Array.isArray(value) || value.some((part) => typeof part !== "string" || part.length === 0)) {
    throw new TypeError(`'${name}' must be an array of non-empty strings.`);
  }
  return value;
};
var requireArrayOfStringsWithNesting = (name, value, joiner) => {
  if (!Array.isArray(value)) {
    throw new TypeError(`'${name}' must be an array.`);
  }
  return value.map((part, index) => {
    if (typeof part === "string") {
      return part;
    }
    return requireArrayOfStrings(`${name}[${index}]`, part).join(joiner);
  });
};
var requirePositiveInteger = (name, value) => {
  const number = Number.parseFloat(value);
  if (Number.isNaN(number) || !Number.isInteger(number) || number < 0 || number === Number.POSITIVE_INFINITY) {
    throw new TypeError(`'${name}' must be a positive integer number.`);
  }
  return number;
};

// src/cache-headers/cache-headers.ts
var ONE_YEAR = 60 * 24 * 365;
var cacheHeaders = (cacheSettings) => {
  const { durable, overrideDeployRevalidation: id, tags, ttl, swr, vary } = cacheSettings;
  const headers = {};
  const cacheControlDirectives = [];
  if (ttl) {
    const ttlValue = requirePositiveInteger("ttl", ttl);
    if (ttlValue > 0) {
      cacheControlDirectives.push(`s-maxage=${ttlValue}`);
    }
  }
  if (swr) {
    const swrValue = swr === true ? ONE_YEAR : requirePositiveInteger("swr", swr);
    if (swrValue > 0) {
      cacheControlDirectives.push(`stale-while-revalidate=${swrValue}`);
    }
  }
  if (cacheControlDirectives.length > 0) {
    if (durable) {
      cacheControlDirectives.push("durable");
    }
    headers[NetlifyCdnCacheControl] = cacheControlDirectives.join(",");
  }
  if (tags) {
    headers[NetlifyCacheTag] = requireArrayOfStrings("tags", tags).join(",");
  }
  const netlifyVary = getNetlifyVary(vary);
  if (netlifyVary) {
    headers[NetlifyVary] = netlifyVary;
  }
  if (id) {
    headers[NetlifyCacheId] = requireArrayOfStrings("id", ensureArray(id)).join(",");
  }
  return headers;
};
var getNetlifyVary = (varyOptions) => {
  if (!varyOptions) {
    return null;
  }
  const { cookie, country, header, language, query } = varyOptions;
  const directives = [];
  if (cookie) {
    directives.push(`cookie=${requireArrayOfStrings("cookie", ensureArray(cookie)).join("|")}`);
  }
  if (country) {
    directives.push(`country=${requireArrayOfStringsWithNesting("country", ensureArray(country), "+").join("|")}`);
  }
  if (header) {
    directives.push(`header=${requireArrayOfStrings("header", ensureArray(header)).join("|")}`);
  }
  if (language) {
    directives.push(`language=${requireArrayOfStringsWithNesting("language", ensureArray(language), "+").join("|")}`);
  }
  if (query) {
    if (query === true) {
      directives.push(`query`);
    } else {
      directives.push(`query=${requireArrayOfStrings("query", ensureArray(query)).join("|")}`);
    }
  }
  if (directives.length === 0) {
    return null;
  }
  return directives.join(",");
};
var applyHeaders = (subject, headersObject) => {
  for (const name in headersObject) {
    if (name === NetlifyCdnCacheControl) {
      subject.set(name, headersObject[name]);
    } else {
      subject.append(name, headersObject[name]);
    }
  }
};
var setCacheHeaders = (response, cacheSettings) => {
  if (!(response instanceof Response)) {
    throw new TypeError("Input must be a Response object.");
  }
  const newResponse = new Response(response.body, response);
  applyHeaders(newResponse.headers, cacheHeaders(cacheSettings));
  return newResponse;
};

// src/cache-status/cache-status.ts
var CACHE_DURABLE = "netlify durable";
var CACHE_EDGE = "netlify edge";
var parseCacheStatusValue = (value) => {
  const parts = value.split(";").map((part) => part.trim());
  const [namePart, ...attributeParts] = parts;
  const name = (namePart ?? "").replace(/"/g, "").toLowerCase();
  const attributes = attributeParts.reduce(
    (acc, part) => {
      const [key, value2 = ""] = part.split("=");
      return {
        ...acc,
        [key]: value2
      };
    },
    {}
  );
  return {
    attributes,
    name
  };
};
var parseCacheStatusValues = (cacheStatusValues) => {
  const cacheStatus = {
    hit: false,
    caches: {}
  };
  for (const value of cacheStatusValues.split(",")) {
    const { attributes, name } = parseCacheStatusValue(value);
    if (name === CACHE_EDGE) {
      const hit = attributes.hit !== void 0;
      cacheStatus.caches.edge = {
        hit,
        fresh: hit && attributes.fwd !== "stale"
      };
      cacheStatus.hit = cacheStatus.hit || hit;
      continue;
    }
    if (name === CACHE_DURABLE) {
      let ttl = 0;
      if (attributes.ttl !== void 0) {
        const parsedTTL = Number.parseInt(attributes.ttl);
        if (!Number.isNaN(parsedTTL)) {
          ttl = parsedTTL;
        }
      }
      const hit = attributes.hit !== void 0;
      cacheStatus.caches.durable = {
        hit,
        fresh: hit && attributes.fwd !== "stale",
        stored: attributes.stored === "true",
        ttl
      };
      cacheStatus.hit = cacheStatus.hit || hit;
      continue;
    }
  }
  if (Object.keys(cacheStatus.caches).length === 0) {
    return null;
  }
  return cacheStatus;
};
var needsRevalidation = (response) => {
  const header = response.headers.get(CacheStatus);
  if (!header) {
    return false;
  }
  for (const value of header.split(",")) {
    const { attributes, name } = parseCacheStatusValue(value);
    if (name === CACHE_DURABLE && attributes.detail === "client-revalidate") {
      return true;
    }
  }
  return false;
};
var getCacheStatus = (input) => {
  if (typeof input === "string") {
    return parseCacheStatusValues(input);
  }
  if (input instanceof Headers) {
    return parseCacheStatusValues(input.get(CacheStatus) ?? "");
  }
  if (input instanceof Response) {
    return parseCacheStatusValues(input.headers.get(CacheStatus) ?? "");
  }
  throw new TypeError("`getCacheStatus` expects a string, a `Headers` object or a `Response` object.");
};

// src/fetchwithcache.ts
var requestInitOptions = [
  "method",
  "keepalive",
  "headers",
  "body",
  "redirect",
  "integrity",
  "signal",
  "credentials",
  "mode",
  "referrer",
  "referrerPolicy",
  "window",
  "dispatcher",
  "duplex"
];
var isRequestInit = (input) => {
  if (typeof input !== "object") {
    return false;
  }
  for (const property of requestInitOptions) {
    if (property in input) {
      return true;
    }
  }
  return false;
};
var fetchWithCache = async (requestOrURL, optionsOrCacheSettings, cacheOptionsParam) => {
  let cacheOptions;
  let requestInit;
  if (isRequestInit(optionsOrCacheSettings)) {
    cacheOptions = cacheOptionsParam || {};
    requestInit = optionsOrCacheSettings;
  } else {
    cacheOptions = optionsOrCacheSettings || {};
    requestInit = {};
  }
  const request = new Request(requestOrURL, requestInit);
  if (request.method.toLowerCase() !== "get") {
    throw new TypeError("`fetchWithCache` only supports GET requests.");
  }
  let cache;
  const { cache: cacheParam, onCachePut, ...cacheSettings } = cacheOptions;
  if (cacheParam) {
    if (typeof cacheParam === "string") {
      cache = await caches.open(cacheParam);
    } else if (cacheParam instanceof Cache) {
      cache = cacheParam;
    } else {
      throw new TypeError("`cache` must be a string representing the cache name or an instance of `Cache`.");
    }
  } else {
    cache = await caches.open("");
  }
  const cached = await cache.match(request);
  if (cached) {
    if (needsRevalidation(cached)) {
      const { fetch: fetchFn = globalThis.fetch } = cacheOptions;
      const revalidation = performBackgroundRevalidation(request, cache, cacheSettings, fetchFn);
      if (onCachePut) {
        await onCachePut(revalidation);
      } else {
        const netlifyGlobal = globalThis.Netlify;
        const requestContext = netlifyGlobal?.context;
        if (requestContext) {
          requestContext.waitUntil(revalidation);
        }
      }
    }
    return cached;
  }
  const { fetch = globalThis.fetch } = cacheOptions;
  const fresh = await fetch(request);
  if (!fresh.body) {
    return fresh;
  }
  const [clientStream, cacheStream] = fresh.body.tee();
  const clientResponse = new Response(clientStream, fresh);
  const cacheResponse = new Response(cacheStream, fresh);
  applyHeaders(cacheResponse.headers, cacheHeaders(cacheSettings));
  const cachePut = cache.put(request, cacheResponse).catch(() => {
  });
  if (onCachePut) {
    await onCachePut(cachePut);
  } else {
    const netlifyGlobal = globalThis.Netlify;
    const requestContext = netlifyGlobal?.context;
    if (requestContext) {
      requestContext.waitUntil(cachePut);
    } else {
      await cachePut;
    }
  }
  return clientResponse;
};
var performBackgroundRevalidation = async (request, cache, cacheSettings, fetchFn) => {
  try {
    const fresh = await fetchFn(request);
    if (!fresh.body) {
      return;
    }
    const cacheResponse = new Response(fresh.body, fresh);
    applyHeaders(cacheResponse.headers, cacheHeaders(cacheSettings));
    await cache.put(request, cacheResponse);
  } catch (error) {
    console.warn("`fetchWithCache` has failed to revalidate a stale response:", error);
  }
};

// src/constants.ts
var MINUTE = 60;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var WEEK = 7 * DAY;
var YEAR = 365 * DAY;
export {
  DAY,
  HOUR,
  MINUTE,
  WEEK,
  YEAR,
  cacheHeaders,
  caches,
  fetchWithCache,
  getCacheStatus,
  needsRevalidation,
  setCacheHeaders
};
