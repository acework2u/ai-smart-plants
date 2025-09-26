import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import type { AuthProvider, AuthTokens, AuthSession as AppAuthSession, AuthError, OAuthProvider } from '../../types/auth';

WebBrowser.maybeCompleteAuthSession();

export class GoogleOAuthProvider {
  private static instance: GoogleOAuthProvider;
  private discovery: AuthSession.AuthRequest.DiscoveryDocument | null = null;

  private readonly config: OAuthProvider = {
    id: 'google',
    name: 'Google',
    icon: 'google',
    isEnabled: true,
    config: {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
      redirectUri: AuthSession.makeRedirectUri({
        scheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'smartplantapp',
        path: 'auth/callback',
      }),
      scopes: ['openid', 'profile', 'email'],
      responseType: 'code',
    },
  };

  public static getInstance(): GoogleOAuthProvider {
    if (!GoogleOAuthProvider.instance) {
      GoogleOAuthProvider.instance = new GoogleOAuthProvider();
    }
    return GoogleOAuthProvider.instance;
  }

  private constructor() {
    this.initializeProvider();
  }

  private async initializeProvider(): Promise<void> {
    try {
      // Google OAuth2 discovery document
      this.discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
        userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
      };

    } catch (error) {
      console.error('Failed to initialize Google OAuth provider:', error);
      throw this.createAuthError('INIT_FAILED', 'Failed to initialize Google OAuth provider');
    }
  }

  public async signIn(): Promise<AppAuthSession> {
    try {
      if (!this.discovery) {
        throw this.createAuthError('NOT_INITIALIZED', 'Google OAuth provider not initialized');
      }

      // Generate code verifier and challenge for PKCE
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64URL }
      );

      // Create auth request
      const request = new AuthSession.AuthRequest({
        clientId: this.config.config.clientId,
        scopes: this.config.config.scopes,
        redirectUri: this.config.config.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        additionalParameters: {
          access_type: 'offline',
          prompt: 'consent',
        },
      });

      // Start OAuth flow
      const result = await request.promptAsync(this.discovery);

      if (result.type === 'success') {
        // Exchange code for tokens
        const tokens = await this.exchangeCodeForTokens(result.params.code, codeVerifier);

        // Get user profile
        const userProfile = await this.getUserProfile(tokens.accessToken);

        // Create user object
        const user = this.createUserFromProfile(userProfile, tokens);

        // Create session
        const session: AppAuthSession = {
          user,
          tokens,
          isActive: true,
          lastActivity: new Date().toISOString(),
          deviceInfo: {
            deviceId: await this.getDeviceId(),
            platform: 'mobile',
            version: '1.0.0',
          },
        };

        return session;
      } else if (result.type === 'cancel') {
        throw this.createAuthError('USER_CANCELLED', 'User cancelled the authentication');
      } else if (result.type === 'error') {
        throw this.createAuthError('AUTH_FAILED', result.error?.message || 'Authentication failed');
      } else {
        throw this.createAuthError('UNKNOWN_ERROR', 'Unknown authentication error');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      if (error instanceof Error && (error as any).code) {
        throw error;
      }
      throw this.createAuthError('SIGN_IN_FAILED', 'Failed to sign in with Google');
    }
  }

  public async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.config.clientId,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Google might not return new refresh token
        expiresAt: Date.now() + (data.expires_in * 1000),
        idToken: data.id_token,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw this.createAuthError('TOKEN_REFRESH_FAILED', 'Failed to refresh tokens');
    }
  }

  public async signOut(tokens: AuthTokens): Promise<void> {
    try {
      // Revoke tokens
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: tokens.refreshToken || tokens.accessToken,
        }),
      });
    } catch (error) {
      console.error('Google sign-out error:', error);
      // Don't throw error for sign-out, just log it
    }
  }

  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<AuthTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.config.clientId,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.config.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      idToken: data.id_token,
    };
  }

  private async getUserProfile(accessToken: string): Promise<any> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private createUserFromProfile(profile: any, tokens: AuthTokens): any {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatar: profile.picture,
      joinDate: new Date().toISOString(),
      provider: 'google' as AuthProvider,
      isEmailVerified: profile.verified_email || false,
      isPhoneVerified: false,
      profile: {
        displayName: profile.name,
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
    };
  }

  private generateCodeVerifier(): string {
    return Crypto.randomUUID().replace(/-/g, '') + Crypto.randomUUID().replace(/-/g, '');
  }

  private async getDeviceId(): Promise<string> {
    // In a real app, you might use expo-device or expo-application
    return `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private createAuthError(code: string, message: string, details?: any): AuthError {
    return {
      code,
      message,
      details,
    };
  }

  public get isEnabled(): boolean {
    return this.config.isEnabled && !!this.config.config.clientId;
  }

  public get providerConfig(): OAuthProvider {
    return this.config;
  }
}