import type { AuthProvider, AuthTokens, AuthSession as AppAuthSession, AuthError, OAuthProvider } from '../../types/auth';

// Conditional import for Facebook SDK
let FacebookSDK: any = null;
try {
  FacebookSDK = require('react-native-fbsdk-next');
} catch (error) {
  console.warn('react-native-fbsdk-next not available');
}

const { LoginManager, AccessToken, GraphRequest, GraphRequestManager } = FacebookSDK || {};

export interface FacebookProfile {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
  first_name?: string;
  last_name?: string;
  verified?: boolean;
}

export class FacebookOAuthProvider {
  private static instance: FacebookOAuthProvider;

  private readonly config: OAuthProvider = {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    isEnabled: FacebookSDK !== null && LoginManager !== undefined,
    config: {
      clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '',
      redirectUri: '',
      scopes: ['public_profile', 'email'],
      responseType: 'token',
    },
  };

  public static getInstance(): FacebookOAuthProvider {
    if (!FacebookOAuthProvider.instance) {
      FacebookOAuthProvider.instance = new FacebookOAuthProvider();
    }
    return FacebookOAuthProvider.instance;
  }

  private constructor() {
    // Facebook SDK is initialized in the app root
  }

  public async signIn(): Promise<AppAuthSession> {
    try {
      // Check if Facebook SDK is available
      if (!LoginManager) {
        throw this.createAuthError('NOT_AVAILABLE', 'Facebook SDK is not available');
      }

      // Start Facebook login
      const result = await LoginManager.logInWithPermissions(this.config.config.scopes);

      if (result.isCancelled) {
        throw this.createAuthError('USER_CANCELLED', 'User cancelled Facebook login');
      }

      if (result.declinedPermissions && result.declinedPermissions.includes('email')) {
        console.warn('User declined email permission');
      }

      // Get access token
      const tokenData = await AccessToken.getCurrentAccessToken();
      if (!tokenData) {
        throw this.createAuthError('NO_ACCESS_TOKEN', 'No access token received from Facebook');
      }

      // Create tokens object
      const tokens: AuthTokens = {
        accessToken: tokenData.accessToken,
        refreshToken: '', // Facebook doesn't provide refresh tokens in the same way
        expiresAt: tokenData.expirationTime ? tokenData.expirationTime.getTime() : Date.now() + (3600 * 1000),
        idToken: tokenData.accessToken, // Use access token as ID token
      };

      // Get user profile
      const userProfile = await this.getUserProfile(tokenData.accessToken);

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
    } catch (error: any) {
      console.error('Facebook sign-in error:', error);

      if (error.code) {
        throw error;
      }

      throw this.createAuthError('SIGN_IN_FAILED', 'Failed to sign in with Facebook');
    }
  }

  public async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Facebook access tokens are long-lived, check current token validity
      const currentToken = await AccessToken.getCurrentAccessToken();

      if (!currentToken || currentToken.accessToken !== refreshToken) {
        throw this.createAuthError('TOKEN_INVALID', 'Facebook token is no longer valid');
      }

      // Check if token is still valid by making a test API call
      const isValid = await this.validateToken(currentToken.accessToken);

      if (!isValid) {
        throw this.createAuthError('TOKEN_EXPIRED', 'Facebook token has expired');
      }

      return {
        accessToken: currentToken.accessToken,
        refreshToken: currentToken.accessToken,
        expiresAt: currentToken.expirationTime ? currentToken.expirationTime.getTime() : Date.now() + (3600 * 1000),
        idToken: currentToken.accessToken,
      };
    } catch (error) {
      console.error('Facebook token refresh error:', error);
      throw this.createAuthError('TOKEN_REFRESH_FAILED', 'Failed to refresh Facebook tokens');
    }
  }

  public async signOut(tokens: AuthTokens): Promise<void> {
    try {
      await LoginManager.logOut();
      console.log('Facebook sign out completed');
    } catch (error) {
      console.error('Facebook sign-out error:', error);
      // Don't throw error for sign-out, just log it
    }
  }

  private async getUserProfile(accessToken: string): Promise<FacebookProfile> {
    return new Promise((resolve, reject) => {
      const infoRequest = new GraphRequest(
        '/me',
        {
          accessToken,
          parameters: {
            fields: {
              string: 'id,name,email,picture.width(200).height(200),first_name,last_name,verified'
            }
          }
        },
        (error, result) => {
          if (error) {
            console.error('Facebook profile request error:', error);
            reject(this.createAuthError('PROFILE_REQUEST_FAILED', 'Failed to get Facebook profile'));
          } else {
            resolve(result as FacebookProfile);
          }
        }
      );

      new GraphRequestManager().addRequest(infoRequest).start();
    });
  }

  private async validateToken(accessToken: string): Promise<boolean> {
    return new Promise((resolve) => {
      const request = new GraphRequest(
        '/me',
        {
          accessToken,
          parameters: {
            fields: {
              string: 'id'
            }
          }
        },
        (error, result) => {
          if (error) {
            resolve(false);
          } else {
            resolve(!!result?.id);
          }
        }
      );

      new GraphRequestManager().addRequest(request).start();
    });
  }

  private createUserFromProfile(profile: FacebookProfile, tokens: AuthTokens): any {
    const avatarUrl = profile.picture?.data?.url || null;

    return {
      id: profile.id,
      email: profile.email || `${profile.id}@facebook.com`,
      name: profile.name,
      avatar: avatarUrl,
      joinDate: new Date().toISOString(),
      provider: 'facebook' as AuthProvider,
      isEmailVerified: profile.verified || false,
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
      facebookUserId: profile.id,
    };
  }

  private async getDeviceId(): Promise<string> {
    // Generate a unique device identifier
    return `facebook_device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  public static async isConfigured(): Promise<boolean> {
    try {
      const instance = FacebookOAuthProvider.getInstance();
      return instance.isEnabled && FacebookSDK !== null;
    } catch {
      return false;
    }
  }

  public async getCurrentUser(): Promise<FacebookProfile | null> {
    try {
      const tokenData = await AccessToken.getCurrentAccessToken();
      if (!tokenData) {
        return null;
      }

      return await this.getUserProfile(tokenData.accessToken);
    } catch (error) {
      console.error('Failed to get current Facebook user:', error);
      return null;
    }
  }

  public async hasPermission(permission: string): Promise<boolean> {
    try {
      const tokenData = await AccessToken.getCurrentAccessToken();
      if (!tokenData) {
        return false;
      }

      return tokenData.permissions?.includes(permission) || false;
    } catch {
      return false;
    }
  }

  public async requestAdditionalPermissions(permissions: string[]): Promise<void> {
    try {
      const result = await LoginManager.logInWithPermissions(permissions);

      if (result.isCancelled) {
        throw this.createAuthError('USER_CANCELLED', 'User cancelled permission request');
      }

      if (result.declinedPermissions && result.declinedPermissions.length > 0) {
        console.warn('User declined some permissions:', result.declinedPermissions);
      }
    } catch (error) {
      console.error('Failed to request additional permissions:', error);
      throw error;
    }
  }
}