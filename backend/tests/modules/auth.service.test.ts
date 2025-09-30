import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loginUser, registerUser, hashPassword, verifyPassword } from '../../src/modules/auth/auth.service';
import type { RegisterInput, LoginInput } from '../../src/modules/auth/auth.schemas';

const mockUserCreate = vi.fn();
const mockUserFindUnique = vi.fn();

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (pwd: string) => `hashed-${pwd}`),
    compare: vi.fn(async (pwd: string, hash: string) => hash === `hashed-${pwd}`)
  },
  hash: vi.fn(async (pwd: string) => `hashed-${pwd}`),
  compare: vi.fn(async (pwd: string, hash: string) => hash === `hashed-${pwd}`)
}));

vi.mock('../../src/config/prisma', () => ({
  prisma: {
    user: {
      create: mockUserCreate,
      findUnique: mockUserFindUnique
    }
  }
}));

vi.mock('jose', async () => {
  const actual = await vi.importActual<any>('jose');
  return {
    ...actual,
    SignJWT: class MockSignJWT {
      private payload: any;
      constructor(payload: any) {
        this.payload = payload;
      }
      setProtectedHeader() { return this; }
      setIssuer() { return this; }
      setAudience() { return this; }
      setIssuedAt() { return this; }
      setExpirationTime() { return this; }
      async sign() { return `token-for-${this.payload.sub}`; }
    }
  };
});

vi.mock('../../src/config/env', () => ({
  env: {
    AUTH_TOKEN_SECRET: 'test-secret-123456789',
    AUTH_ACCESS_TOKEN_TTL: 3600,
    AUTH_ISSUER: 'https://issuer',
    AUTH_AUDIENCE: 'https://api.smartplants.app',
    AUTH_JWKS_URI: '',
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
    JWT_JWKS_URI: '',
    JWT_AUDIENCE: 'https://api.smartplants.app',
    JWT_ISSUER: 'https://issuer',
    RATE_LIMIT_GENERAL_LIMIT: 120,
    RATE_LIMIT_GENERAL_WINDOW_MS: 60000
  }
}));

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hashes and verifies password helpers', async () => {
    const hash = await hashPassword('secret123');
    const match = await verifyPassword('secret123', hash);
    expect(hash).toMatch(/^hashed-/);
    expect(match).toBe(true);
  });

  it('registers a new user and returns access token', async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
      role: 'owner',
      createdAt: new Date()
    });

    const payload: RegisterInput = { email: 'Test@example.com', password: 'secret123' };
    const result = await registerUser(payload);

    expect(mockUserCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ email: 'test@example.com', passwordHash: expect.stringContaining('hashed-') })
    }));
    expect(result.accessToken).toBe('token-for-user-1');
  });

  it('rejects duplicate email', async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: 'x' });
    await expect(registerUser({ email: 'test@example.com', password: 'secret123' })).rejects.toThrowError();
  });

  it('logs in user with correct credentials', async () => {
    const userRecord = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'owner',
      passwordHash: 'hashed-secret123'
    };
    mockUserFindUnique.mockResolvedValueOnce(userRecord);

    const payload: LoginInput = { email: 'test@example.com', password: 'secret123' };
    const result = await loginUser(payload);
    expect(result.accessToken).toBe('token-for-user-1');
  });

  it('rejects invalid password', async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
      role: 'owner',
      passwordHash: 'hashed-other'
    });

    await expect(loginUser({ email: 'test@example.com', password: 'secret123' })).rejects.toThrowError();
  });
});
