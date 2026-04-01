var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);

// src/bootstrap/environment.ts
var Operation = /* @__PURE__ */ ((Operation2) => {
  Operation2["Delete"] = "delete";
  Operation2["Read"] = "read";
  Operation2["Write"] = "write";
  return Operation2;
})(Operation || {});

// src/bootstrap/cache.ts
import { base64Encode } from "@netlify/runtime-utils";

// src/bootstrap/errors.ts
var ERROR_CODES = {
  invalid_vary: "Responses must not use unsupported directives of the `Netlify-Vary` header (https://ntl.fyi/cache_api_invalid_vary).",
  no_cache: "Responses must not set cache control headers with the `private`, `no-cache` or `no-store` directives (https://ntl.fyi/cache_api_no_cache).",
  low_ttl: "Responses must have a cache control header with a `max-age` or `s-maxage` directive (https://ntl.fyi/cache_api_low_ttl).",
  no_directive: "Responses must have a cache control header with caching directives (https://ntl.fyi/cache_api_no_directive).",
  no_ttl: "Responses must have a cache control header with a `max-age` or `s-maxage` directive (https://ntl.fyi/cache_api_no_ttl).",
  no_status: "Responses must specify a status code (https://ntl.fyi/cache_api_no_status).",
  invalid_directive: "Responses must have a cache control header with caching directives (https://ntl.fyi/cache_api_invalid_directive).",
  status: "Responses must have a status code between 200 and 299 (https://ntl.fyi/cache_api_status)."
};
var GENERIC_ERROR = "The server has returned an unexpected error (https://ntl.fyi/cache_api_error).";

// src/headers.ts
var ErrorDetail = "netlify-programmable-error";
var ResourceHeaders = "netlify-programmable-headers";
var ResourceStatus = "netlify-programmable-status";
var ResourceStore = "netlify-programmable-store";
var NetlifyForwardedHost = "netlify-forwarded-host";
var UserAgent = "user-agent";

// src/bootstrap/cache.ts
var allowedProtocols = /* @__PURE__ */ new Set(["http:", "https:"]);
var discardedHeaders = /* @__PURE__ */ new Set(["cookie", "content-encoding", "content-length"]);
var forbiddenHeaderPrefixes = ["netlify-programmable-", "x-nf-"];
var getInternalHeaders = /* @__PURE__ */ Symbol("getInternalHeaders");
var serializeRequestHeaders = /* @__PURE__ */ Symbol("serializeRequestHeaders");
var serializeResponseHeaders = /* @__PURE__ */ Symbol("serializeResponseHeaders");
var _getContext, _name, _userAgent;
var NetlifyCache = class {
  constructor({ getContext, name, userAgent }) {
    __privateAdd(this, _getContext);
    __privateAdd(this, _name);
    __privateAdd(this, _userAgent);
    __privateSet(this, _getContext, getContext);
    __privateSet(this, _name, name);
    __privateSet(this, _userAgent, userAgent);
  }
  [getInternalHeaders](requestContext) {
    const { host, token } = requestContext;
    const headers = {
      Authorization: `Bearer ${token}`,
      [ResourceStore]: __privateGet(this, _name)
    };
    if (host) {
      headers[NetlifyForwardedHost] = host;
    }
    if (__privateGet(this, _userAgent)) {
      headers[UserAgent] = __privateGet(this, _userAgent);
    }
    return headers;
  }
  [serializeRequestHeaders](headers) {
    const headersMap = {};
    headers.forEach((value, key) => {
      const normalizedKey = key.toLowerCase();
      for (const prefix of forbiddenHeaderPrefixes) {
        if (normalizedKey.startsWith(prefix)) {
          return;
        }
      }
      headersMap[normalizedKey] = value;
    });
    return headersMap;
  }
  [serializeResponseHeaders](headers) {
    const headersMap = {};
    headers.forEach((value, key) => {
      if (discardedHeaders.has(key)) {
        return;
      }
      if (key === "set-cookie") {
        headersMap[key] = headersMap[key] || [];
        headersMap[key].push(value);
      } else {
        headersMap[key] = value.split(",");
      }
    });
    return base64Encode(JSON.stringify(headersMap));
  }
  async add(request) {
    await this.put(new Request(request), await fetch(request));
  }
  async addAll(requests) {
    await Promise.allSettled(requests.map((request) => this.add(request)));
  }
  async delete(request) {
    const context = __privateGet(this, _getContext).call(this, { operation: "delete" /* Delete */ });
    if (context) {
      const resourceURL = extractAndValidateURL(request);
      await fetch(`${context.url}/${toCacheKey(resourceURL)}`, {
        headers: this[getInternalHeaders](context),
        method: "DELETE"
      });
    }
    return true;
  }
  async keys(_request) {
    return [];
  }
  async match(request) {
    try {
      const context = __privateGet(this, _getContext).call(this, { operation: "read" /* Read */ });
      if (!context) {
        return;
      }
      const resourceURL = extractAndValidateURL(request);
      const cacheURL = `${context.url}/${toCacheKey(resourceURL)}`;
      const response = await fetch(cacheURL, {
        headers: {
          ...request instanceof Request ? this[serializeRequestHeaders](request.headers) : {},
          ...this[getInternalHeaders](context)
        },
        method: "GET"
      });
      if (!response.ok) {
        return;
      }
      return response;
    } catch {
    }
  }
  async matchAll(request, _options) {
    if (!request) {
      return [];
    }
    const res = await this.match(request);
    return res ? [res] : [];
  }
  async put(request, response) {
    if (!response.ok) {
      throw new TypeError(`Cannot cache response with status ${response.status}.`);
    }
    if (request instanceof Request && request.method !== "GET") {
      throw new TypeError(`Cannot cache response to ${request.method} request.`);
    }
    if (response.status === 206) {
      throw new TypeError("Cannot cache response to a range request (206 Partial Content).");
    }
    if (response.headers.get("vary")?.includes("*")) {
      throw new TypeError("Cannot cache response with 'Vary: *' header.");
    }
    const context = __privateGet(this, _getContext).call(this, { operation: "write" /* Write */ });
    if (!context) {
      return;
    }
    const resourceURL = extractAndValidateURL(request);
    const cacheResponse = await fetch(`${context.url}/${toCacheKey(resourceURL)}`, {
      body: response.body,
      headers: {
        ...this[getInternalHeaders](context),
        [ResourceHeaders]: this[serializeResponseHeaders](response.headers),
        [ResourceStatus]: response.status.toString()
      },
      // @ts-expect-error https://github.com/whatwg/fetch/pull/1457
      duplex: "half",
      method: "POST"
    });
    if (!cacheResponse.ok) {
      const errorDetail = cacheResponse.headers?.get(ErrorDetail) ?? "";
      const errorMessage = ERROR_CODES[errorDetail] || GENERIC_ERROR;
      context.logger?.(`Failed to write to the cache: ${errorMessage}`);
    }
  }
};
_getContext = new WeakMap();
_name = new WeakMap();
_userAgent = new WeakMap();
var extractAndValidateURL = (input) => {
  let url;
  if (input instanceof Request) {
    url = new URL(input.url);
  } else {
    try {
      url = new URL(String(input));
    } catch {
      throw new TypeError(`${input} is not a valid URL.`);
    }
  }
  if (!allowedProtocols.has(url.protocol)) {
    throw new TypeError(
      `Cannot cache response for URL with unsupported protocol (${url.protocol}). Supported protocols are ${[
        ...allowedProtocols
      ].join(", ")}.`
    );
  }
  return url;
};
var toCacheKey = (url) => encodeURIComponent(url.toString());

// src/bootstrap/cachestorage.ts
var _environmentOptions, _stores;
var NetlifyCacheStorage = class {
  constructor(environmentOptions) {
    __privateAdd(this, _environmentOptions);
    __privateAdd(this, _stores);
    __privateSet(this, _environmentOptions, environmentOptions);
    __privateSet(this, _stores, /* @__PURE__ */ new Map());
  }
  open(name) {
    let store = __privateGet(this, _stores).get(name);
    if (!store) {
      store = new NetlifyCache({
        ...__privateGet(this, _environmentOptions),
        name
      });
      __privateGet(this, _stores).set(name, store);
    }
    return Promise.resolve(store);
  }
  has(name) {
    return Promise.resolve(__privateGet(this, _stores).has(name));
  }
  delete(name) {
    return Promise.resolve(__privateGet(this, _stores).delete(name));
  }
  keys() {
    return Promise.resolve([...__privateGet(this, _stores).keys()]);
  }
  async match(request, options) {
    if (options?.cacheName) {
      return __privateGet(this, _stores).get(options.cacheName)?.match(request);
    }
    for (const store of __privateGet(this, _stores).values()) {
      const response = await store.match(request);
      if (response === void 0) {
        return;
      }
    }
  }
};
_environmentOptions = new WeakMap();
_stores = new WeakMap();
export {
  NetlifyCache,
  NetlifyCacheStorage,
  Operation
};
