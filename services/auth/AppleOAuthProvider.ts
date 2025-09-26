import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import type { AuthProvider, AuthTokens, AuthSession as AppAuthSession, AuthError, OAuthProvider } from '../../types/auth';

// Conditional import for iOS-only Apple Authentication
let AppleAuthentication: any = null;
if (Platform.OS === 'ios') {
  try {
    AppleAuthentication = require('expo-apple-authentication');
  } catch (error) {
    console.warn('expo-apple-authentication not available');
  }
}

export class AppleOAuthProvider {
  private static instance: AppleOAuthProvider;

  private readonly config: OAuthProvider = {
    id: 'apple',
    name: 'Apple',
    icon: 'apple',
    isEnabled: Platform.OS === 'ios' && AppleAuthentication !== null,
    config: {
      clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || 'com.smartplantapp.service',
      redirectUri: '',
      scopes: AppleAuthentication ? [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL] : [],
      responseType: 'code',
    },
  };

  public static getInstance(): AppleOAuthProvider {
    if (!AppleOAuthProvider.instance) {
      AppleOAuthProvider.instance = new AppleOAuthProvider();
    }
    return AppleOAuthProvider.instance;
  }

  private constructor() {
    // Apple Authentication doesn't require initialization like OAuth2
  }

  public async signIn(): Promise<AppAuthSession> {
    try {
      // Check if Apple Authentication is available
      if (!AppleAuthentication) {
        throw this.createAuthError('NOT_AVAILABLE', 'Apple Authentication is not available on this platform');
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw this.createAuthError('NOT_AVAILABLE', 'Apple Authentication is not available on this device');
      }

      // Start Apple Sign In
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!appleCredential.identityToken) {
        throw this.createAuthError('NO_IDENTITY_TOKEN', 'No identity token received from Apple');
      }

      // Create tokens object
      const tokens: AuthTokens = {
        accessToken: appleCredential.identityToken,
        refreshToken: appleCredential.authorizationCode || '',
        expiresAt: Date.now() + (3600 * 1000), // 1 hour default
        idToken: appleCredential.identityToken,
      };

      // Create user from Apple credential
      const user = this.createUserFromAppleCredential(appleCredential, tokens);

      // Create session
      const session: AppAuthSession = {
        user,
        tokens,
        isActive: true,
        lastActivity: new Date().toISOString(),
        deviceInfo: {
          deviceId: await this.getDeviceId(),
          platform: 'ios',
          version: '1.0.0',
        },
      };

      return session;
    } catch (error: any) {
      console.error('Apple sign-in error:', error);

      if (error.code === 'ERR_CANCELED') {
        throw this.createAuthError('USER_CANCELLED', 'User cancelled Apple Sign In');
      }

      if (error.code === 'ERR_INVALID_RESPONSE') {
        throw this.createAuthError('INVALID_RESPONSE', 'Invalid response from Apple');
      }

      if (error.code === 'ERR_NOT_HANDLED') {
        throw this.createAuthError('NOT_HANDLED', 'Apple Sign In not handled properly');
      }

      if (error.code === 'ERR_UNKNOWN') {
        throw this.createAuthError('UNKNOWN_ERROR', 'Unknown Apple Sign In error');
      }

      if (error.code) {
        throw error;
      }

      throw this.createAuthError('SIGN_IN_FAILED', 'Failed to sign in with Apple');
    }
  }

  public async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Apple doesn't provide a refresh token mechanism in the same way
      // We need to implement server-side token validation
      // For now, we'll check credential state
      const credentialState = await AppleAuthentication.getCredentialStateAsync(refreshToken);

      if (credentialState !== AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED) {
        throw this.createAuthError('TOKEN_INVALID', 'Apple credential is no longer valid');
      }

      // In a real implementation, you would validate the token with your backend
      // and potentially refresh it through Apple's servers
      return {
        accessToken: refreshToken, // Reuse for now
        refreshToken: refreshToken,
        expiresAt: Date.now() + (3600 * 1000), // 1 hour
        idToken: refreshToken,
      };
    } catch (error) {
      console.error('Apple token refresh error:', error);
      throw this.createAuthError('TOKEN_REFRESH_FAILED', 'Failed to refresh Apple tokens');
    }
  }

  public async signOut(tokens: AuthTokens): Promise<void> {
    try {
      // Apple doesn't require explicit sign out call
      // The credential state will be managed by the system
      console.log('Apple sign out completed');
    } catch (error) {
      console.error('Apple sign-out error:', error);
      // Don't throw error for sign-out, just log it
    }
  }

  public async getCredentialState(userIdentifier: string): Promise<AppleAuthentication.AppleAuthenticationCredentialState> {
    try {
      return await AppleAuthentication.getCredentialStateAsync(userIdentifier);
    } catch (error) {
      console.error('Failed to get Apple credential state:', error);
      throw this.createAuthError('CREDENTIAL_CHECK_FAILED', 'Failed to check Apple credential state');
    }
  }

  private createUserFromAppleCredential(credential: AppleAuthentication.AppleAuthenticationCredential, tokens: AuthTokens): any {
    // Apple provides limited user info, especially on subsequent logins
    const fullName = credential.fullName;
    const displayName = fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : '';

    return {
      id: credential.user,
      email: credential.email || `${credential.user}@privaterelay.appleid.com`,
      name: displayName || 'Apple User',
      avatar: null, // Apple doesn't provide profile pictures
      joinDate: new Date().toISOString(),
      provider: 'apple' as AuthProvider,
      isEmailVerified: credential.email ? true : false, // Apple emails are always verified
      isPhoneVerified: false,
      profile: {
        displayName: displayName || 'Apple User',
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
        biometricAuth: true, // Apple users likely prefer biometric auth
        units: {
          volume: 'ml',
          weight: 'g',
          temperature: 'celsius',
        },
        privacy: {
          personalizedTips: false, // Apple users tend to be more privacy-focused
          analytics: false,
          crashReporting: true,
        },
      },
      appleUserIdentifier: credential.user, // Store for credential state checking
    };
  }

  private async getDeviceId(): Promise<string> {
    // Generate a unique device identifier
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return `apple_device_${Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')}`;
  }

  private createAuthError(code: string, message: string, details?: any): AuthError {
    return {
      code,
      message,
      details,
    };
  }

  public get isEnabled(): boolean {
    return this.config.isEnabled && Platform.OS === 'ios';
  }

  public get providerConfig(): OAuthProvider {
    return this.config;
  }

  public static async isAvailable(): Promise<boolean> {
    try {
      return Platform.OS === 'ios' && AppleAuthentication !== null && await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  }
}