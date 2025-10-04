import { describe, expect, it, jest, beforeEach, beforeAll } from '@jest/globals';

import type { AuthSession } from '../../types/auth';

const mockRegister = jest.fn();
const mockSignIn = jest.fn();
const mockCreateSession = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/auth/EmailPasswordAuthProvider', () => ({
  EmailPasswordAuthProvider: {
    getInstance: () => ({
      register: mockRegister,
      signIn: mockSignIn,
    }),
  },
}));

jest.mock('../../services/auth/SessionManager', () => ({
  SessionManager: {
    getInstance: () => ({
      createSession: mockCreateSession,
    }),
  },
}));

jest.mock('../../services/auth/GoogleOAuthProvider', () => ({
  GoogleOAuthProvider: {
    getInstance: () => ({ signIn: jest.fn(), signOut: jest.fn(), isEnabled: false, providerConfig: { id: 'google' } }),
  },
}));

jest.mock('../../services/auth/AppleOAuthProvider', () => ({
  AppleOAuthProvider: {
    getInstance: () => ({ signIn: jest.fn(), signOut: jest.fn(), isEnabled: false, providerConfig: { id: 'apple' } }),
    isAvailable: () => Promise.resolve(false),
  },
}));

jest.mock('../../services/auth/FacebookOAuthProvider', () => ({
  FacebookOAuthProvider: {
    getInstance: () => ({ signIn: jest.fn(), signOut: jest.fn(), isEnabled: false, providerConfig: { id: 'facebook' } }),
  },
}));

type AuthHelperExports = typeof import('../../stores/authStore')['__authTest'];
let authHelpers: AuthHelperExports;

beforeAll(() => {
  authHelpers = require('../../stores/authStore').__authTest;
});

const mockSession = (): AuthSession => ({
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    joinDate: new Date().toISOString(),
    provider: 'email',
    isEmailVerified: false,
    isPhoneVerified: false,
    profile: {
      displayName: 'Test User',
      gardenCount: 0,
      totalPlants: 0,
      experienceLevel: 'beginner',
      favoriteCategories: [],
    },
    preferences: {
      language: 'th',
      theme: 'system',
      notifications: true,
      haptics: true,
      biometricAuth: false,
      units: {
        volume: 'ml',
        weight: 'g',
        temperature: 'celsius',
      },
      privacy: {
        personalizedTips: true,
        analytics: true,
        crashReporting: true,
      },
    },
  },
  tokens: {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: Date.now() + 3600 * 1000,
  },
  isActive: true,
  lastActivity: new Date().toISOString(),
  deviceInfo: {
    deviceId: 'device-123',
    platform: 'mobile',
    version: '1.0.0',
  },
});

describe('authStore email helpers', () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockSignIn.mockReset();
    mockCreateSession.mockReset();
  });

  it('handleEmailSignUp registers user and returns enriched session', async () => {
    const session = mockSession();
    mockRegister.mockResolvedValue(session);
    mockCreateSession.mockResolvedValue(undefined);

    const result = await authHelpers.handleEmailSignUp({
      provider: 'email',
      email: 'signup@example.com',
      password: 'Password123',
      name: 'Signup User',
      acceptTerms: true,
      profile: { experienceLevel: 'expert' },
    });

    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'signup@example.com',
        password: 'Password123',
        firstName: 'Signup',
        lastName: 'User',
      }),
    );
    expect(mockCreateSession).toHaveBeenCalledWith(session);
    expect(result.user.profile.experienceLevel).toBe('expert');
    expect(result.user.name).toBe('Signup User');
  });

  it('handleEmailSignIn signs user in with email credentials', async () => {
    const session = mockSession();
    mockSignIn.mockResolvedValue(session);
    mockCreateSession.mockResolvedValue(undefined);

    const result = await authHelpers.handleEmailSignIn({
      provider: 'email',
      email: 'login@example.com',
      password: 'Password123',
      rememberMe: true,
    });

    expect(mockSignIn).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'login@example.com',
        password: 'Password123',
        rememberMe: true,
      }),
    );
    expect(mockCreateSession).toHaveBeenCalledWith(session);
    expect(result.user.email).toBe('test@example.com');
  });

  it('handleEmailSignIn throws when email missing', async () => {
    await expect(
      authHelpers.handleEmailSignIn({ provider: 'email', password: 'Password123' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });
});
