Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const dsn = require('../utils/dsn.js');
const envelope = require('../utils/envelope.js');
const isBrowser = require('../utils/isBrowser.js');

/**
 * Creates a log container envelope item for a list of logs.
 *
 * @param items - The logs to include in the envelope.
 * @param inferUserData - If true, tells Relay to infer the end-user IP and User-Agent from the incoming request.
 *                        Only emitted as `ingest_settings` in browser environments.
 * @returns The created log container envelope item.
 */
function createLogContainerEnvelopeItem(items, inferUserData) {
  const inferSetting = inferUserData ? 'auto' : 'never';
  return [
    {
      type: 'log',
      item_count: items.length,
      content_type: 'application/vnd.sentry.items.log+json',
    },
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
 * Creates an envelope for a list of logs.
 *
 * Logs from multiple traces can be included in the same envelope.
 *
 * @param logs - The logs to include in the envelope.
 * @param metadata - The metadata to include in the envelope.
 * @param tunnel - The tunnel to include in the envelope.
 * @param dsn - The DSN to include in the envelope.
 * @param inferUserData - If true, tells Relay to infer the end-user IP and User-Agent from the incoming request.
 * @returns The created envelope.
 */
function createLogEnvelope(
  logs,
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

  return envelope.createEnvelope(headers, [createLogContainerEnvelopeItem(logs, inferUserData)]);
}

exports.createLogContainerEnvelopeItem = createLogContainerEnvelopeItem;
exports.createLogEnvelope = createLogEnvelope;
//# sourceMappingURL=envelope.js.map
