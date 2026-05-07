import { dsnToString } from '../utils/dsn.js';
import { createEnvelope } from '../utils/envelope.js';
import { isBrowser } from '../utils/isBrowser.js';

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
      ...(isBrowser() && {
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
  dsn,
  inferUserData,
) {
  const headers = {};

  if (metadata?.sdk) {
    headers.sdk = {
      name: metadata.sdk.name,
      version: metadata.sdk.version,
    };
  }

  if (!!tunnel && !!dsn) {
    headers.dsn = dsnToString(dsn);
  }

  return createEnvelope(headers, [createLogContainerEnvelopeItem(logs, inferUserData)]);
}

export { createLogContainerEnvelopeItem, createLogEnvelope };
//# sourceMappingURL=envelope.js.map
