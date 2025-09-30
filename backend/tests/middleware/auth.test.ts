import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

const mockJwtVerify = vi.fn();
const mockCreateRemoteJWKSet = vi.fn(() => ({}));

vi.mock('jose', () => ({
  createRemoteJWKSet: mockCreateRemoteJWKSet,
  jwtVerify: mockJwtVerify
}));

vi.mock('../../src/config/env', () => ({
  env: {
    AUTH_JWKS_URI: 'https://issuer/.well-known/jwks.json',
    AUTH_AUDIENCE: 'https://api.smartplants.app',
    AUTH_ISSUER: 'https://issuer',
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
    AUTH_TOKEN_SECRET: 'test-secret-123456789',
    AUTH_ACCESS_TOKEN_TTL: 3600,
    RATE_LIMIT_GENERAL_LIMIT: 120,
    RATE_LIMIT_GENERAL_WINDOW_MS: 60000
  }
}));

import { requireAuth, optionalAuth, verifyAccessToken } from '../../src/middleware/auth';

const buildReq = (headers: Record<string, string> = {}) => ({
  headers,
  user: undefined
}) as unknown as Request;

const buildRes = () => ({}) as Response;

const next = vi.fn();

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    next.mockClear();
    mockJwtVerify.mockResolvedValue({
      payload: {
        sub: 'user-1',
        scope: 'plants.read plants.write'
      }
    });
  });

  it('verifies access token and maps scopes', async () => {
    const result = await verifyAccessToken('token');
    expect(mockJwtVerify).toHaveBeenCalled();
    expect(result.id).toBe('user-1');
    expect(result.scopes).toContain('plants.read');
  });

  it('requireAuth populates req.user on success', async () => {
    const middleware = requireAuth(['plants.read']);
    const req = buildReq({ authorization: 'Bearer abc' });
    await middleware(req, buildRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user?.id).toBe('user-1');
  });

  it('requireAuth rejects missing token', async () => {
    const middleware = requireAuth();
    const req = buildReq();
    await middleware(req, buildRes(), next);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(401);
  });

  it('optionalAuth skips when no token', async () => {
    const middleware = optionalAuth();
    const req = buildReq();
    await middleware(req, buildRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
