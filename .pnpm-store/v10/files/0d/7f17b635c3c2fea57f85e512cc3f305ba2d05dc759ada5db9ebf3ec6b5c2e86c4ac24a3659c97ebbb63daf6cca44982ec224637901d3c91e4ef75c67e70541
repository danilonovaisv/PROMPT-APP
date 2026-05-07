import { addOutgoingRequestBreadcrumb } from './add-outgoing-request-breadcrumb.js';
import { DEBUG_BUILD } from '../../debug-build.js';
import { debug } from '../../utils/debug-logger.js';
import { getCurrentScope, getClient } from '../../currentScopes.js';
import { getSpanStatusFromHttpCode, SPAN_STATUS_ERROR, SPAN_STATUS_UNSET } from '../../tracing/spanstatus.js';
import { hasSpansEnabled } from '../../utils/hasSpansEnabled.js';
import { SUPPRESS_TRACING_KEY, startInactiveSpan, withActiveSpan } from '../../tracing/trace.js';
import { LRUMap } from '../../utils/lru.js';
import { getOutgoingRequestSpanData, setIncomingResponseSpanData } from './get-outgoing-span-data.js';
import { getRequestUrlFromClientRequest } from './get-request-url.js';
import { injectTracePropagationHeaders } from './inject-trace-propagation-headers.js';
import { HTTP_ON_CLIENT_REQUEST, LOG_PREFIX } from './constants.js';
import { doubleWrapWarning } from './double-wrap-warning.js';

function getHttpClientSubscriptions(options) {
  const propagationDecisionMap = new LRUMap(100);
  const getConfig = () => getClient()?.getOptions();

  const onHttpClientRequestCreated = (data) => {
    // Skip all instrumentation if tracing is suppressed
    // (e.g., Sentry's own transport uses this to avoid self-instrumentation)
    if (getCurrentScope().getScopeData().sdkProcessingMetadata[SUPPRESS_TRACING_KEY] === true) {
      return;
    }

    const clientOptions = getConfig();
    const {
      errorMonitor = 'error',
      spans: createSpans = clientOptions ? hasSpansEnabled(clientOptions) : true,
      propagateTrace = false,
      breadcrumbs = true,
      http,
      https,
      suppressOtelWarning = false,
    } = options;

    const { request } = data ;

    // check if request is ignored. if so, we do nothing at all.
    if (options.ignoreOutgoingRequests?.(getRequestUrlFromClientRequest(request), request)) {
      return;
    }

    // guard against adding breadcrumbs multiple times, or when not enabled
    let addedBreadcrumbs = false;
    function addBreadcrumbs(request, response) {
      if (!addedBreadcrumbs) {
        addedBreadcrumbs = true;
        addOutgoingRequestBreadcrumb(request, response);
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
        injectTracePropagationHeaders(request, propagationDecisionMap);
      }
      return;
    }

    // guard against OTel wrapping the same module and emitting double-spans
    // this doesn't prevent it, just prints a debug warning for the user.
    if (!suppressOtelWarning) {
      if (http) doubleWrapWarning(http);
      if (https) doubleWrapWarning(https);
    }

    // spans are enabled
    const span = startInactiveSpan(getOutgoingRequestSpanData(request));
    options.outgoingRequestHook?.(span, request);

    // Inject trace headers after span creation so sentry-trace contains the
    // outgoing span's ID (not the parent's), enabling downstream services to
    // link to this span.
    if (propagateTrace) {
      if (span.isRecording()) {
        withActiveSpan(span, () => {
          injectTracePropagationHeaders(request, propagationDecisionMap);
        });
      } else {
        injectTracePropagationHeaders(request, propagationDecisionMap);
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
    const requestOnClose = () => endSpan({ code: SPAN_STATUS_UNSET });
    request.on('close', requestOnClose);

    request.on(errorMonitor, error => {
      DEBUG_BUILD && debug.log(LOG_PREFIX, 'outgoingRequest on request error()', error);
      if (breadcrumbs) {
        addBreadcrumbs(request, undefined);
      }
      endSpan({ code: SPAN_STATUS_ERROR });
    });

    request.prependListener('response', response => {
      // no longer need this, listen on response now.
      // do not end the span until the response finishes
      request.removeListener('close', requestOnClose);
      if (request.listenerCount('response') <= 1) {
        response.resume();
      }
      setIncomingResponseSpanData(response, span);
      options.outgoingResponseHook?.(span, response);

      let finished = false;
      function finishWithResponse(error) {
        if (!finished) {
          finished = true;
          if (error) {
            DEBUG_BUILD && debug.log(LOG_PREFIX, 'outgoingRequest on response error()', error);
          }
          if (breadcrumbs) {
            addBreadcrumbs(request, response);
          }
          const aborted = response.aborted && !response.complete;
          const status =
            error || typeof response.statusCode !== 'number' || aborted
              ? { code: SPAN_STATUS_ERROR }
              : getSpanStatusFromHttpCode(response.statusCode);
          options.applyCustomAttributesOnSpan?.(span, request, response);
          endSpan(status);
        }
      }

      response.on('end', () => finishWithResponse());
      response.on(errorMonitor, finishWithResponse);
    });
  };

  return {
    [HTTP_ON_CLIENT_REQUEST]: onHttpClientRequestCreated,
  };
}

export { getHttpClientSubscriptions };
//# sourceMappingURL=client-subscriptions.js.map
