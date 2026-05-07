Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const dsn = require('../utils/dsn.js');
const envelope = require('../utils/envelope.js');
const isBrowser = require('../utils/isBrowser.js');

/**
 * Creates a metric container envelope item for a list of metrics.
 *
 * @param items - The metrics to include in the envelope.
 * @param inferUserData - If true, tells Relay to infer the end-user IP and User-Agent from the incoming request.
 *                        Only emitted as `ingest_settings` in browser environments.
 * @returns The created metric container envelope item.
 */
function createMetricContainerEnvelopeItem(
  items,
  inferUserData,
) {
  const inferSetting = inferUserData ? 'auto' : 'never';
  return [
    {
      type: 'trace_metric',
      item_count: items.length,
      content_type: 'application/vnd.sentry.items.trace-metric+json',
    } ,
    {
      version: 2,
      ...(isBrowser.isBrowser() && {
        ingest_settings: { infer_ip: inferSetting, infer_user_agent: inferSetting },
      }),
      items,
    },
  ];
}

/**
 * Creates an envelope for a list of metrics.
 *
 * Metrics from multiple traces can be included in the same envelope.
 *
 * @param metrics - The metrics to include in the envelope.
 * @param metadata - The metadata to include in the envelope.
 * @param tunnel - The tunnel to include in the envelope.
 * @param dsn - The DSN to include in the envelope.
 * @param inferUserData - If true, tells Relay to infer the end-user IP and User-Agent from the incoming request.
 * @returns The created envelope.
 */
function createMetricEnvelope(
  metrics,
  metadata,
  tunnel,
  dsn$1,
  inferUserData,
) {
  const headers = {};

  if (metadata?.sdk) {
    headers.sdk = {
      name: metadata.sdk.name,
      version: metadata.sdk.version,
    };
  }

  if (!!tunnel && !!dsn$1) {
    headers.dsn = dsn.dsnToString(dsn$1);
  }

  return envelope.createEnvelope(headers, [createMetricContainerEnvelopeItem(metrics, inferUserData)]);
}

exports.createMetricContainerEnvelopeItem = createMetricContainerEnvelopeItem;
exports.createMetricEnvelope = createMetricEnvelope;
//# sourceMappingURL=envelope.js.map
