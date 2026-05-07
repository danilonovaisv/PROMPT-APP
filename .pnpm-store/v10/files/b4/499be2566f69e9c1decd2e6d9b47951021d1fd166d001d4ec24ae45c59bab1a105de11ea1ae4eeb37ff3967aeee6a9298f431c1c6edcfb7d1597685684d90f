Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const currentScopes = require('../currentScopes.js');
const integration = require('../integration.js');
const semanticAttributes = require('../semanticAttributes.js');
const cookie = require('../utils/cookie.js');
const request = require('../utils/request.js');
const getIpAddress = require('../vendor/getIpAddress.js');
const captureSpan = require('../tracing/spans/captureSpan.js');

// TODO(v11): Change defaults based on `sendDefaultPii`
const DEFAULT_INCLUDE = {
  cookies: true,
  data: true,
  headers: true,
  query_string: true,
  url: true,
};

const INTEGRATION_NAME = 'RequestData';

const _requestDataIntegration = ((options = {}) => {
  const include = {
    ...DEFAULT_INCLUDE,
    ...options.include,
  };

  return {
    name: INTEGRATION_NAME,
    processEvent(event, _hint, client) {
      const { sdkProcessingMetadata = {} } = event;
      const { normalizedRequest, ipAddress } = sdkProcessingMetadata;

      const includeWithDefaultPiiApplied = {
        ...include,
        ip: include.ip ?? client.getOptions().sendDefaultPii,
      };

      if (normalizedRequest) {
        addNormalizedRequestDataToEvent(event, normalizedRequest, { ipAddress }, includeWithDefaultPiiApplied);
      }

      return event;
    },
    processSegmentSpan(span, client) {
      const { sdkProcessingMetadata = {} } = currentScopes.getIsolationScope().getScopeData();
      const { normalizedRequest, ipAddress } = sdkProcessingMetadata;

      if (!normalizedRequest) {
        return;
      }

      const { sendDefaultPii } = client.getOptions();
      const includeWithDefaultPiiApplied = {
        ...include,
        ip: include.ip ?? sendDefaultPii,
      };

      addNormalizedRequestDataToSpan(span, normalizedRequest, ipAddress, includeWithDefaultPiiApplied, sendDefaultPii);
    },
  };
}) ;

/**
 * Add data about a request to an event. Primarily for use in Node-based SDKs, but included in `@sentry/core`
 * so it can be used in cross-platform SDKs like `@sentry/nextjs`.
 */
const requestDataIntegration = integration.defineIntegration(_requestDataIntegration);

/**
 * Add already normalized request data to an event.
 * This mutates the passed in event.
 */
function addNormalizedRequestDataToEvent(
  event,
  req,
  // Data that should not go into `event.request` but is somehow related to requests
  additionalData,
  include,
) {
  event.request = {
    ...event.request,
    ...extractNormalizedRequestData(req, include),
  };

  if (include.ip) {
    const ip = (req.headers && getIpAddress.getClientIPAddress(req.headers)) || additionalData.ipAddress;
    if (ip) {
      event.user = {
        ...event.user,
        ip_address: ip,
      };
    }
  }
}

function addNormalizedRequestDataToSpan(
  span,
  normalizedRequest,
  ipAddress,
  include,
  sendDefaultPii,
) {
  const requestData = extractNormalizedRequestData(normalizedRequest, include);
  const attributes = {};

  if (requestData.url) {
    attributes['url.full'] = requestData.url;
  }

  if (requestData.method) {
    attributes['http.request.method'] = requestData.method;
  }

  if (requestData.query_string) {
    attributes['url.query'] = normalizeQueryString(requestData.query_string);
  }

  captureSpan.safeSetSpanJSONAttributes(span, attributes);

  // Process cookies before headers so normalizedRequest.cookies takes precedence
  // over the raw cookie header (matching the processEvent path).
  if (requestData.cookies && Object.keys(requestData.cookies).length > 0) {
    const cookieString = Object.entries(requestData.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    const cookieAttributes = request.httpHeadersToSpanAttributes({ cookie: cookieString }, sendDefaultPii ?? false, 'request');
    captureSpan.safeSetSpanJSONAttributes(span, cookieAttributes);
  }

  if (requestData.headers) {
    const headerAttributes = request.httpHeadersToSpanAttributes(requestData.headers, sendDefaultPii ?? false, 'request');
    captureSpan.safeSetSpanJSONAttributes(span, headerAttributes);
  }

  if (requestData.data != null) {
    const serialized = typeof requestData.data === 'string' ? requestData.data : JSON.stringify(requestData.data);
    if (serialized) {
      captureSpan.safeSetSpanJSONAttributes(span, { 'http.request.body.data': serialized });
    }
  }

  if (include.ip) {
    const ip = (normalizedRequest.headers && getIpAddress.getClientIPAddress(normalizedRequest.headers)) || ipAddress || undefined;
    if (ip) {
      captureSpan.safeSetSpanJSONAttributes(span, { [semanticAttributes.SEMANTIC_ATTRIBUTE_USER_IP_ADDRESS]: ip });
    }
  }
}

function extractNormalizedRequestData(
  normalizedRequest,
  include,
) {
  const requestData = {};
  const headers = { ...normalizedRequest.headers };

  if (include.headers) {
    requestData.headers = headers;

    if (!include.cookies) {
      delete (headers ).cookie;
    }

    if (!include.ip) {
      const ipHeaderNamesLower = new Set(getIpAddress.ipHeaderNames.map(name => name.toLowerCase()));
      for (const key of Object.keys(headers)) {
        if (ipHeaderNamesLower.has(key.toLowerCase())) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete (headers )[key];
        }
      }
    }
  }

  requestData.method = normalizedRequest.method;

  if (include.url) {
    requestData.url = normalizedRequest.url;
  }

  if (include.cookies) {
    const cookies = normalizedRequest.cookies || (headers?.cookie ? cookie.parseCookie(headers.cookie) : undefined);
    requestData.cookies = cookies || {};
  }

  if (include.query_string) {
    requestData.query_string = normalizedRequest.query_string;
  }

  if (include.data) {
    requestData.data = normalizedRequest.data;
  }

  return requestData;
}

function normalizeQueryString(queryString) {
  if (typeof queryString === 'string') {
    return queryString || undefined;
  }

  const pairs = Array.isArray(queryString) ? queryString : Object.entries(queryString);
  const result = pairs.map(([key, value]) => `${key}=${value}`).join('&');

  return result || undefined;
}

exports.requestDataIntegration = requestDataIntegration;
//# sourceMappingURL=requestdata.js.map
