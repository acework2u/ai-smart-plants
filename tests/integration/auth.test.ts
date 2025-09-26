import { GoogleOAuthProvider } from '../../services/auth/GoogleOAuthProvider';
import { AppleOAuthProvider } from '../../services/auth/AppleOAuthProvider';
import { FacebookOAuthProvider } from '../../services/auth/FacebookOAuthProvider';
import { EmailPasswordAuthProvider } from '../../services/auth/EmailPasswordAuthProvider';
import { BiometricAuthProvider } from '../../services/auth/BiometricAuthProvider';
import { SessionManager } from '../../services/auth/SessionManager';

describe('Authentication Integration Tests', () => {
  let sessionManager: SessionManager;
  let googleProvider: GoogleOAuthProvider;
  let appleProvider: AppleOAuthProvider;
  let facebookProvider: FacebookOAuthProvider;
  let emailPasswordProvider: EmailPasswordAuthProvider;
  let biometricProvider: BiometricAuthProvider;

  beforeAll(() => {
    sessionManager = SessionManager.getInstance();
    googleProvider = GoogleOAuthProvider.getInstance();
    appleProvider = AppleOAuthProvider.getInstance();
    facebookProvider = FacebookOAuthProvider.getInstance();
    emailPasswordProvider = EmailPasswordAuthProvider.getInstance();
    biometricProvider = BiometricAuthProvider.getInstance();
  });

  beforeEach(async () => {
    // Clean up any existing sessions before each test
    await sessionManager.endSession();
  });

  describe('OAuth Providers', () => {
    test('Google OAuth provider should be properly configured', () => {
      expect(googleProvider).toBeDefined();
      expect(googleProvider.isEnabled).toBe(true);
      expect(googleProvider.providerConfig.id).toBe('google');
    });

    test('Apple OAuth provider should be available on iOS', () => {
      expect(appleProvider).toBeDefined();
      expect(appleProvider.providerConfig.id).toBe('apple');
      // Note: isEnabled will be false on non-iOS platforms
    });

    test('Facebook OAuth provider should be properly configured', () => {
      expect(facebookProvider).toBeDefined();
      expect(facebookProvider.isEnabled).toBe(true);
      expect(facebookProvider.providerConfig.id).toBe('facebook');
    });

    test('Email/Password provider should be properly configured', () => {
      expect(emailPasswordProvider).toBeDefined();
      expect(emailPasswordProvider.isEnabled).toBe(true);
    });
  });

  describe('Session Management', () => {
    test('should create and manage session correctly', async () => {
      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          avatar: null,
          joinDate: new Date().toISOString(),
          provider: 'email' as const,
          isEmailVerified: true,
          isPhoneVerified: false,
          profile: {
            displayName: 'Test User',
            gardenCount: 0,
            totalPlants: 0,
            experienceLevel: 'beginner' as const,
            favoriteCategories: [],
          },
          preferences: {
            language: 'th' as const,
            theme: 'system' as const,
            notifications: true,
            haptics: true,
            biometricAuth: false,
            units: {
              volume: 'ml' as const,
              weight: 'g' as const,
              temperature: 'celsius' as const,
            },
            privacy: {
              personalizedTips: true,
              analytics: true,
              crashReporting: true,
            },
          },
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: Date.now() + 3600000, // 1 hour
          idToken: 'mock-id-token',
        },
        isActive: true,
        lastActivity: new Date().toISOString(),
        deviceInfo: {
          deviceId: 'test-device-id',
          platform: 'mobile' as const,
          version: '1.0.0',
        },
      };

      await sessionManager.createSession(mockSession);

      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession).toBeDefined();
      expect(currentSession?.user.id).toBe('test-user-id');
      expect(currentSession?.isActive).toBe(true);
    });

    test('should handle session restoration', async () => {
      // First create a session
      const mockSession = {
        user: {
          id: 'test-restore-user',
          email: 'restore@example.com',
          name: 'Restore User',
          avatar: null,
          joinDate: new Date().toISOString(),
          provider: 'email' as const,
          isEmailVerified: true,
          isPhoneVerified: false,
          profile: {
            displayName: 'Restore User',
            gardenCount: 0,
            totalPlants: 0,
            experienceLevel: 'beginner' as const,
            favoriteCategories: [],
          },
          preferences: {
            language: 'th' as const,
            theme: 'system' as const,
            notifications: true,
            haptics: true,
            biometricAuth: false,
            units: {
              volume: 'ml' as const,
              weight: 'g' as const,
              temperature: 'celsius' as const,
            },
            privacy: {
              personalizedTips: true,
              analytics: true,
              crashReporting: true,
            },
          },
        },
        tokens: {
          accessToken: 'restore-access-token',
          refreshToken: 'restore-refresh-token',
          expiresAt: Date.now() + 3600000,
          idToken: 'restore-id-token',
        },
        isActive: true,
        lastActivity: new Date().toISOString(),
        deviceInfo: {
          deviceId: 'restore-device-id',
          platform: 'mobile' as const,
          version: '1.0.0',
        },
      };

      await sessionManager.createSession(mockSession);

      // Try to restore session
      const restoredSession = await sessionManager.restoreSession();
      expect(restoredSession).toBeDefined();
      expect(restoredSession?.user.id).toBe('test-restore-user');
    });

    test('should handle session timeout', async () => {
      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession?.isActive).toBe(true);

      // Simulate session activity update
      await sessionManager.updateActivity();

      const updatedSession = sessionManager.getCurrentSession();
      expect(updatedSession?.lastActivity).toBeDefined();
    });
  });

  describe('Email/Password Authentication', () => {
    test('should validate email format correctly', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
      ];

      for (const email of invalidEmails) {
        await expect(
          emailPasswordProvider.signIn({
            email,
            password: 'validpassword123',
          })
        ).rejects.toThrow('Invalid email format');
      }
    });

    test('should validate password requirements', () => {
      const requirements = emailPasswordProvider.getPasswordRequirements();
      const minLength = emailPasswordProvider.getPasswordMinLength();

      expect(requirements).toBeDefined();
      expect(minLength).toBeGreaterThan(0);
    });

    test('should handle registration data validation', async () => {
      const invalidRegistrationData = {
        email: 'test@example.com',
        password: 'weak', // Too short
        confirmPassword: 'different', // Doesn't match
        firstName: '',
        lastName: 'User',
        acceptTerms: false,
      };

      await expect(
        emailPasswordProvider.register(invalidRegistrationData)
      ).rejects.toThrow();
    });
  });

  describe('Biometric Authentication', () => {
    test('should check biometric capabilities', async () => {
      const capabilities = await biometricProvider.getBiometricCapabilities();

      expect(capabilities).toBeDefined();
      expect(capabilities).toHaveProperty('isAvailable');
      expect(capabilities).toHaveProperty('isEnrolled');
      expect(capabilities).toHaveProperty('supportedTypes');
      expect(capabilities).toHaveProperty('securityLevel');
      expect(capabilities).toHaveProperty('hasHardware');
    });

    test('should determine if biometrics can be used', async () => {
      const result = await biometricProvider.canUseBiometrics();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('canUse');
      expect(result).toHaveProperty('capabilities');

      if (!result.canUse) {
        expect(result).toHaveProperty('reason');
      }
    });

    test('should get biometric settings', async () => {
      const settings = await biometricProvider.getBiometricSettings();

      expect(settings).toBeDefined();
      expect(settings).toHaveProperty('enabled');
      expect(settings).toHaveProperty('supportedTypes');
      expect(settings).toHaveProperty('securityLevel');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network failure
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        emailPasswordProvider.signIn({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow();

      // Restore original fetch
      global.fetch = originalFetch;
    });

    test('should handle invalid credentials', async () => {
      // Mock API response for invalid credentials
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          errors: [
            {
              code: 'auth/invalid-credentials',
              message: 'Invalid email or password',
            },
          ],
        }),
      });

      await expect(
        emailPasswordProvider.signIn({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });

  describe('Integration Flow', () => {
    test('should complete full authentication flow', async () => {
      // Mock successful API response
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            id_token: 'mock-id-token',
            user: {
              id: 'integration-test-user',
              email: 'integration@example.com',
              first_name: 'Integration',
              last_name: 'Test',
              email_verified: true,
              created_at: new Date().toISOString(),
            },
          },
        }),
      });

      try {
        // Step 1: Sign in with email/password
        const session = await emailPasswordProvider.signIn({
          email: 'integration@example.com',
          password: 'testpassword123',
        });

        expect(session).toBeDefined();
        expect(session.user.email).toBe('integration@example.com');
        expect(session.tokens.accessToken).toBe('mock-access-token');

        // Step 2: Create session
        await sessionManager.createSession(session);

        const currentSession = sessionManager.getCurrentSession();
        expect(currentSession).toBeDefined();
        expect(currentSession?.user.id).toBe('integration-test-user');

        // Step 3: Update activity
        await sessionManager.updateActivity();

        // Step 4: End session
        await sessionManager.endSession();

        const endedSession = sessionManager.getCurrentSession();
        expect(endedSession).toBeNull();

      } finally {
        // Restore original fetch
        global.fetch = originalFetch;
      }
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle multiple session operations', async () => {
      const mockSession = {
        user: {
          id: 'concurrent-user',
          email: 'concurrent@example.com',
          name: 'Concurrent User',
          avatar: null,
          joinDate: new Date().toISOString(),
          provider: 'email' as const,
          isEmailVerified: true,
          isPhoneVerified: false,
          profile: {
            displayName: 'Concurrent User',
            gardenCount: 0,
            totalPlants: 0,
            experienceLevel: 'beginner' as const,
            favoriteCategories: [],
          },
          preferences: {
            language: 'th' as const,
            theme: 'system' as const,
            notifications: true,
            haptics: true,
            biometricAuth: false,
            units: {
              volume: 'ml' as const,
              weight: 'g' as const,
              temperature: 'celsius' as const,
            },
            privacy: {
              personalizedTips: true,
              analytics: true,
              crashReporting: true,
            },
          },
        },
        tokens: {
          accessToken: 'concurrent-access-token',
          refreshToken: 'concurrent-refresh-token',
          expiresAt: Date.now() + 3600000,
          idToken: 'concurrent-id-token',
        },
        isActive: true,
        lastActivity: new Date().toISOString(),
        deviceInfo: {
          deviceId: 'concurrent-device-id',
          platform: 'mobile' as const,
          version: '1.0.0',
        },
      };

      // Create session
      await sessionManager.createSession(mockSession);

      // Perform multiple concurrent operations
      const operations = [
        sessionManager.updateActivity(),
        sessionManager.updateActivity(),
        sessionManager.updateActivity(),
      ];

      await Promise.all(operations);

      const session = sessionManager.getCurrentSession();
      expect(session).toBeDefined();
      expect(session?.isActive).toBe(true);
    });
  });

  afterEach(async () => {
    // Cleanup after each test
    await sessionManager.endSession();
  });

  afterAll(async () => {
    // Final cleanup
    await sessionManager.cleanup();
  });
});