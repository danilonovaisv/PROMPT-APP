export type AuditLevel = 'pass' | 'warn' | 'error' | 'unsupported';

export interface AuditLogger {
  debug?: (message: string, context?: Record<string, unknown>) => void;
  warn?: (message: string, context?: Record<string, unknown>) => void;
  error?: (message: string, context?: Record<string, unknown>) => void;
}

export interface AuditResult {
  level: AuditLevel;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface MainResourceLike {
  id?: string | null;
  [key: string]: unknown;
}

export interface GetResourceContentAuditDeps {
  getMainResource?: (() => Promise<unknown>) | null;
  getResourceContent?: ((resourceId: string) => Promise<unknown>) | null;
  logger?: AuditLogger;
}

const log = (
  logger: AuditLogger | undefined,
  level: 'debug' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>
) => {
  logger?.[level]?.(message, context);
};

const asError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown audit runtime error');

export const isApiUnsupportedError = (error: unknown): boolean => {
  const message = asError(error).message.toLowerCase();
  return (
    message.includes('not supported') ||
    message.includes('unsupported') ||
    message.includes('not implemented') ||
    message.includes('unavailable in this execution context')
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasValidResourceId = (resource: Record<string, unknown>): resource is MainResourceLike & { id: string } =>
  typeof resource.id === 'string' && resource.id.trim().length > 0;

async function getMainResourceSafely(
  deps: GetResourceContentAuditDeps
): Promise<{ result?: MainResourceLike; failure?: AuditResult }> {
  if (typeof deps.getMainResource !== 'function') {
    return {
      failure: {
        level: 'unsupported',
        code: 'resource-api-unsupported',
        message: 'Main resource API is not supported in this execution context.',
      },
    };
  }

  try {
    const mainResource = await deps.getMainResource();

    if (mainResource == null) {
      return {
        failure: {
          level: 'unsupported',
          code: 'main-resource-unavailable',
          message: 'Main resource is unavailable in this execution context.',
        },
      };
    }

    if (!isRecord(mainResource)) {
      return {
        failure: {
          level: 'error',
          code: 'main-resource-invalid-shape',
          message: 'Main resource was resolved with an invalid payload shape.',
          details: { receivedType: typeof mainResource },
        },
      };
    }

    return { result: mainResource };
  } catch (error) {
    if (isApiUnsupportedError(error)) {
      return {
        failure: {
          level: 'unsupported',
          code: 'resource-api-unsupported',
          message: 'Main resource API is not supported in this execution context.',
          details: { cause: asError(error).message },
        },
      };
    }

    return {
      failure: {
        level: 'error',
        code: 'main-resource-resolution-failed',
        message: 'Main resource lookup failed before resource content could be inspected.',
        details: { cause: asError(error).message },
      },
    };
  }
}

export async function runGetResourceContentAudit(deps: GetResourceContentAuditDeps): Promise<AuditResult> {
  const logger = deps.logger;
  const safeResolution = await getMainResourceSafely(deps);

  if (safeResolution.failure) {
    const failure = safeResolution.failure;
    const logLevel = failure.level === 'error' ? 'error' : 'warn';
    log(logger, logLevel, failure.message, failure.details);
    return failure;
  }

  const mainResource = safeResolution.result;

  if (!mainResource) {
    const result: AuditResult = {
      level: 'unsupported',
      code: 'main-resource-unavailable',
      message: 'Main resource is unavailable in this execution context.',
    };
    log(logger, 'warn', result.message);
    return result;
  }

  if (!hasValidResourceId(mainResource)) {
    const result: AuditResult = {
      level: 'error',
      code: 'main-resource-missing-id',
      message: 'Main resource was resolved without a valid id.',
      details: { availableKeys: Object.keys(mainResource) },
    };
    log(logger, 'error', result.message, result.details);
    return result;
  }

  if (typeof deps.getResourceContent !== 'function') {
    const result: AuditResult = {
      level: 'unsupported',
      code: 'resource-content-api-unsupported',
      message: 'Resource content API is not supported in this execution context.',
      details: { resourceId: mainResource.id },
    };
    log(logger, 'warn', result.message, result.details);
    return result;
  }

  try {
    const content = await deps.getResourceContent(mainResource.id);

    if (content == null || (typeof content === 'string' && content.trim().length === 0)) {
      const result: AuditResult = {
        level: 'warn',
        code: 'resource-content-unavailable',
        message: 'Main resource content could not be retrieved.',
        details: { resourceId: mainResource.id },
      };
      log(logger, 'warn', result.message, result.details);
      return result;
    }

    const result: AuditResult = {
      level: 'pass',
      code: 'resource-content-retrieved',
      message: 'Main resource content retrieved successfully.',
      details: { resourceId: mainResource.id },
    };
    log(logger, 'debug', result.message, result.details);
    return result;
  } catch (error) {
    const normalizedError = asError(error);

    if (isApiUnsupportedError(normalizedError)) {
      const result: AuditResult = {
        level: 'unsupported',
        code: 'resource-content-api-unsupported',
        message: 'Resource content API is not supported in this execution context.',
        details: { resourceId: mainResource.id, cause: normalizedError.message },
      };
      log(logger, 'warn', result.message, result.details);
      return result;
    }

    const result: AuditResult = {
      level: 'error',
      code: 'resource-content-read-failed',
      message: 'Resource content retrieval failed with an unexpected runtime error.',
      details: { resourceId: mainResource.id, cause: normalizedError.message },
    };
    log(logger, 'error', result.message, result.details);
    return result;
  }
}
