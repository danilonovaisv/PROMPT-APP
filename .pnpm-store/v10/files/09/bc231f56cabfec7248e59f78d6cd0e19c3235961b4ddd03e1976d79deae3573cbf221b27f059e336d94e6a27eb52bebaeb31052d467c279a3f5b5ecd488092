Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const addOutgoingRequestBreadcrumb = require('./add-outgoing-request-breadcrumb.js');
const debugBuild = require('../../debug-build.js');
const debugLogger = require('../../utils/debug-logger.js');
const currentScopes = require('../../currentScopes.js');
const spanstatus = require('../../tracing/spanstatus.js');
const hasSpansEnabled = require('../../utils/hasSpansEnabled.js');
const trace = require('../../tracing/trace.js');
const lru = require('../../utils/lru.js');
const getOutgoingSpanData = require('./get-outgoing-span-data.js');
const getRequestUrl = require('./get-request-url.js');
const injectTracePropagationHeaders = require('./inject-trace-propagation-headers.js');
const constants = require('./constants.js');
const doubleWrapWarning = require('./double-wrap-warning.js');

function getHttpClientSubscriptions(options) {
  const propagationDecisionMap = new lru.LRUMap(100);
  const getConfig = () => currentScopes.getClient()?.getOptions();

  const onHttpClientRequestCreated = (data) => {
    // Skip all instrumentation if tracing is suppressed
    // (e.g., Sentry's own transport uses this to avoid self-instrumentation)
    if (currentScopes.getCurrentScope().getScopeData().sdkProcessingMetadata[trace.SUPPRESS_TRACING_KEY] === true) {
      return;
    }

    const clientOptions = getConfig();
    const {
      errorMonitor = 'error',
      spans: createSpans = clientOptions ? hasSpansEnabled.hasSpansEnabled(clientOptions) : true,
      propagateTrace = false,
      breadcrumbs = true,
      http,
      https,
      suppressOtelWarning = false,
    } = options;

    const { request } = data ;

    // check if request is ignored. if so, we do nothing at all.
    if (options.ignoreOutgoingRequests?.(getRequestUrl.getRequestUrlFromClientRequest(request), request)) {
      return;
    }

    // guard against adding breadcrumbs multiple times, or when not enabled
    let addedBreadcrumbs = false;
    function addBreadcrumbs(request, response) {
      if (!addedBreadcrumbs) {
        addedBreadcrumbs = true;
        addOutgoingRequestBreadcrumb.addOutgoingRequestBreadcrumb(request, response);
      }
    }

    // called if spans and/or trace propagation are disabled
    function breadcrumbsOnly(request) {
      request.on(errorMonitor, () => addBreadcrumbs(request, undefined));
      request.prependListener('response', response => {
        if (request.listenerCount('response') <= 1) {
          response.resume();
        }
        response.on('end', () => addBreadcrumbs(request, response));
        response.on(errorMonitor, () => addBreadcrumbs(request, response));
      });
    }

    if (!createSpans) {
      // no spans, but maybe tracing and/or breadcrumbs
      if (breadcrumbs) {
        breadcrumbsOnly(request);
      }
      if (propagateTrace) {
        injectTracePropagationHeaders.injectTracePropagationHeaders(request, propagationDecisionMap);
      }
      return;
    }

    // guard against OTel wrapping the same module and emitting double-spans
    // this doesn't prevent it, just prints a debug warning for the user.
    if (!suppressOtelWarning) {
      if (http) doubleWrapWarning.doubleWrapWarning(http);
      if (https) doubleWrapWarning.doubleWrapWarning(https);
    }

    // spans are enabled
    const span = trace.startInactiveSpan(getOutgoingSpanData.getOutgoingRequestSpanData(request));
    options.outgoingRequestHook?.(span, request);

    // Inject trace headers after span creation so sentry-trace contains the
    // outgoing span's ID (not the parent's), enabling downstream services to
    // link to this span.
    if (propagateTrace) {
      if (span.isRecording()) {
        trace.withActiveSpan(span, () => {
          injectTracePropagationHeaders.injectTracePropagationHeaders(request, propagationDecisionMap);
        });
      } else {
        injectTracePropagationHeaders.injectTracePropagationHeaders(request, propagationDecisionMap);
      }
    }

    let spanEnded = false;
    function endSpan(status) {
      if (!spanEnded) {
        spanEnded = true;
        span.setStatus(status);
        span.end();
      }
    }

    // Fallback: end span if the connection closes before any response.
    // This is removed if we do get a response, because in that case
    // we want to only end the span when the response is finished.
    const requestOnClose = () => endSpan({ code: spanstatus.SPAN_STATUS_UNSET });
    request.on('close', requestOnClose);

    request.on(errorMonitor, error => {
      debugBuild.DEBUG_BUILD && debugLogger.debug.log(constants.LOG_PREFIX, 'outgoingRequest on request error()', error);
      if (breadcrumbs) {
        addBreadcrumbs(request, undefined);
      }
      endSpan({ code: spanstatus.SPAN_STATUS_ERROR });
    });

    request.prependListener('response', response => {
      // no longer need this, listen on response now.
      // do not end the span until the response finishes
      request.removeListener('close', requestOnClose);
      if (request.listenerCount('response') <= 1) {
        response.resume();
      }
      getOutgoingSpanData.setIncomingResponseSpanData(response, span);
      options.outgoingResponseHook?.(span, response);

      let finished = false;
      function finishWithResponse(error) {
        if (!finished) {
          finished = true;
          if (error) {
            debugBuild.DEBUG_BUILD && debugLogger.debug.log(constants.LOG_PREFIX, 'outgoingRequest on response error()', error);
          }
          if (breadcrumbs) {
            addBreadcrumbs(request, response);
          }
          const aborted = response.aborted && !response.complete;
          const status =
            error || typeof response.statusCode !== 'number' || aborted
              ? { code: spanstatus.SPAN_STATUS_ERROR }
              : spanstatus.getSpanStatusFromHttpCode(response.statusCode);
          options.applyCustomAttributesOnSpan?.(span, request, response);
          endSpan(status);
        }
      }

      response.on('end', () => finishWithResponse());
      response.on(errorMonitor, finishWithResponse);
    });
  };

  return {
    [constants.HTTP_ON_CLIENT_REQUEST]: onHttpClientRequestCreated,
  };
}

exports.getHttpClientSubscriptions = getHttpClientSubscriptions;
//# sourceMappingURL=client-subscriptions.js.map
