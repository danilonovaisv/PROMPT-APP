import { DEBUG_BUILD } from '../../debug-build.js';
import { debug } from '../../utils/debug-logger.js';

const isOtelWrapped = (fn) =>
  typeof fn.__unwrap === 'function';

// exported for tess
const warning =
  'Double-wrapped http.client detected. Either disable spans in Sentry.httpIntegration, or disable the OpenTelemetry HTTP instrumentation.';

let didDoubleWrapWarning = false;
// no-op in non-debug builds
const doubleWrapWarning = DEBUG_BUILD
  ? (http) => {
      if (!didDoubleWrapWarning) {
        if (isOtelWrapped(http.request) || isOtelWrapped(http.get)) {
          // TODO: add link to documentation
          didDoubleWrapWarning = true;
          debug.warn(warning);
        }
      }
    }
  : () => {};

export { doubleWrapWarning, warning };
//# sourceMappingURL=double-wrap-warning.js.map
