import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../src/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 4000,
    LOG_LEVEL: 'info',
    APP_NAME: 'smart-backend',
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: 5432,
    POSTGRES_DB: 'db',
    POSTGRES_USER: 'user',
    POSTGRES_PASSWORD: 'pass',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    ANALYSIS_API_BASE_URL: 'http://analysis-api:5000',
    JWT_JWKS_URI: 'https://issuer/.well-known/jwks.json',
    JWT_AUDIENCE: 'https://api.smartplants.app',
    JWT_ISSUER: 'https://issuer',
    AUTH_JWKS_URI: 'https://issuer/.well-known/jwks.json',
    AUTH_AUDIENCE: 'https://api.smartplants.app',
    AUTH_ISSUER: 'https://issuer',
    AUTH_TOKEN_SECRET: 'test-secret-long-enough',
    AUTH_ACCESS_TOKEN_TTL: 3600,
    RATE_LIMIT_GENERAL_LIMIT: 3,
    RATE_LIMIT_GENERAL_WINDOW_MS: 1000
  }
}));

import { generalRateLimit, resetRateLimits, __internal } from '../../src/middleware/rateLimiter';

const buildResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn()
  } as unknown as Response;

  return res;
};

const buildRequest = (overrides: Partial<Request> = {}) => {
  const req = {
    ip: '127.0.0.1',
    traceId: 'trace-123',
    apiVersion: 'v1',
    headers: {},
    ...overrides
  } as unknown as Request & { traceId?: string; apiVersion?: string };

  return req;
};

describe('generalRateLimit middleware', () => {
  const dateSpy = vi.spyOn(Date, 'now');

  beforeEach(() => {
    resetRateLimits();
    vi.clearAllMocks();
    dateSpy.mockReturnValue(0);
  });

  it('allows requests within the configured limit', () => {
    const req = buildRequest();

    for (let i = 0; i < 3; i += 1) {
      const res = buildResponse();
      const next = vi.fn();
      dateSpy.mockReturnValue(i * 100);
      generalRateLimit(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it('blocks requests above the limit and sets retry metadata', () => {
    const req = buildRequest();
    const next = vi.fn();

    // Exhaust limit
    for (let i = 0; i < 3; i += 1) {
      const res = buildResponse();
      const passThrough = vi.fn();
      dateSpy.mockReturnValue(100 * i);
      generalRateLimit(req, res, passThrough);
      expect(passThrough).toHaveBeenCalledTimes(1);
    }

    dateSpy.mockReturnValue(450);
    const res = buildResponse();
    generalRateLimit(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({
          retryAfter: expect.any(Number),
          traceId: 'trace-123',
          api_version: 'v1'
        })
      })
    );
  });

  it('resets counters after the window expires and prunes old buckets', () => {
    const userReq = buildRequest({ user: { id: 'user-1' } as any });
    const anonReq = buildRequest({ ip: '192.168.0.9' }); // ensures separate bucket

    generalRateLimit(userReq, buildResponse(), vi.fn());
    generalRateLimit(anonReq, buildResponse(), vi.fn());
    expect(__internal.getBucketSize()).toBe(2);

    // Advance time beyond cleanup interval (window is 1000, cleanup interval is max(window, 60000))
    dateSpy.mockReturnValue(61_000);
    const freshReq = buildRequest({ ip: '10.0.0.5' });

    const res = buildResponse();
    const next = vi.fn();
    generalRateLimit(freshReq, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(__internal.getBucketSize()).toBe(1);
  });
});
