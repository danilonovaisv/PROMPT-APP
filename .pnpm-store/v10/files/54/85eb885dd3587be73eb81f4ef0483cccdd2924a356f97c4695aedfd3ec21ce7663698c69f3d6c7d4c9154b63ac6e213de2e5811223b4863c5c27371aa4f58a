Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

/** Convert an outgoing request to request options. */
function getRequestOptions(request) {
  // request.host may be 'hostname:port' when the caller passed
  // { host: 'hostname:port' } to http.request(). Split it so that
  // `hostname` is always port-free (matching the http.RequestOptions contract)
  // and the port is not lost when request.port is undefined.
  const hostWithPort = request.host || '';
  const portInHost = /^(.*):(\d+)$/.exec(hostWithPort);
  const hostname = portInHost ? portInHost[1] : hostWithPort;
  const port = request.port ?? (portInHost ? Number(portInHost[2]) : undefined);

  return {
    method: request.method,
    port,
    protocol: request.protocol,
    host: request.host,
    hostname,
    path: request.path,
    headers: request.getHeaders(),
  };
}

function getRequestUrl(requestOptions) {
  return String(getRequestUrlObject(requestOptions));
}

function getRequestUrlObject(requestOptions) {
  const protocol = requestOptions.protocol || 'http:';
  const hostHeader = requestOptions.headers?.host && String(requestOptions.headers?.host);
  const hostname = hostHeader || requestOptions.hostname || requestOptions.host || '';
  // Don't log standard :80 (http) and :443 (https) ports to reduce the noise
  // Also don't add port if the hostname already includes a port
  const port =
    !requestOptions.port || requestOptions.port === 80 || requestOptions.port === 443 || /^(.*):(\d+)$/.test(hostname)
      ? ''
      : `:${requestOptions.port}`;
  const path = requestOptions.path ? requestOptions.path : '/';
  return new URL(path, `${protocol}//${hostname}${port}`);
}

/**
 * Build the full URL string from a Node.js ClientRequest.
 */
function getRequestUrlFromClientRequest(request) {
  return String(getRequestUrl(getRequestOptions(request)));
}

exports.getRequestOptions = getRequestOptions;
exports.getRequestUrl = getRequestUrl;
exports.getRequestUrlFromClientRequest = getRequestUrlFromClientRequest;
exports.getRequestUrlObject = getRequestUrlObject;
//# sourceMappingURL=get-request-url.js.map
