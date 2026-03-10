import { describe, expect, it, jest } from '@jest/globals';

import {
  isApiUnsupportedError,
  runGetResourceContentAudit,
  type AuditLogger,
} from '../src/services/auditResourceContent';

const createLogger = (): AuditLogger => ({
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

describe('isApiUnsupportedError', () => {
  it('detects unsupported API signatures', () => {
    expect(isApiUnsupportedError(new Error('API not supported in this context'))).toBe(true);
    expect(isApiUnsupportedError(new Error('Method not implemented'))).toBe(true);
    expect(isApiUnsupportedError(new Error('Unexpected network failure'))).toBe(false);
  });
});

describe('runGetResourceContentAudit', () => {
  it('returns unsupported when mainResource is undefined', async () => {
    const logger = createLogger();

    const result = await runGetResourceContentAudit({
      getMainResource: async () => undefined,
      getResourceContent: async () => 'should not be called',
      logger,
    });

    expect(result.level).toBe('unsupported');
    expect(result.code).toBe('main-resource-unavailable');
    expect(result.message).toContain('Main resource is unavailable');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('returns error when mainResource is resolved without id', async () => {
    const logger = createLogger();

    const result = await runGetResourceContentAudit({
      getMainResource: async () => ({ type: 'document' }),
      getResourceContent: async () => 'should not be called',
      logger,
    });

    expect(result.level).toBe('error');
    expect(result.code).toBe('main-resource-missing-id');
    expect(result.message).toContain('without a valid id');
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns pass when mainResource.id is valid and content is retrieved', async () => {
    const logger = createLogger();

    const result = await runGetResourceContentAudit({
      getMainResource: async () => ({ id: 'resource-1' }),
      getResourceContent: async (resourceId) => `content:${resourceId}`,
      logger,
    });

    expect(result.level).toBe('pass');
    expect(result.code).toBe('resource-content-retrieved');
    expect(result.message).toContain('retrieved successfully');
    expect(result.details?.resourceId).toBe('resource-1');
    expect(logger.debug).toHaveBeenCalled();
  });

  it('returns warn when content cannot be retrieved for a valid id', async () => {
    const logger = createLogger();

    const result = await runGetResourceContentAudit({
      getMainResource: async () => ({ id: 'resource-2' }),
      getResourceContent: async () => undefined,
      logger,
    });

    expect(result.level).toBe('warn');
    expect(result.code).toBe('resource-content-unavailable');
    expect(result.message).toContain('could not be retrieved');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('returns unsupported when the resource API is not supported in the current context', async () => {
    const logger = createLogger();

    const result = await runGetResourceContentAudit({
      getMainResource: async () => {
        throw new Error('getMainResource is not supported in this execution context');
      },
      getResourceContent: async () => 'unused',
      logger,
    });

    expect(result.level).toBe('unsupported');
    expect(result.code).toBe('resource-api-unsupported');
    expect(result.message).toContain('not supported');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('returns error instead of throwing when getResourceContent fails unexpectedly', async () => {
    const logger = createLogger();

    await expect(
      runGetResourceContentAudit({
        getMainResource: async () => ({ id: 'resource-3' }),
        getResourceContent: async () => {
          throw new Error('socket hang up');
        },
        logger,
      })
    ).resolves.toMatchObject({
      level: 'error',
      code: 'resource-content-read-failed',
    });

    expect(logger.error).toHaveBeenCalled();
  });
});
