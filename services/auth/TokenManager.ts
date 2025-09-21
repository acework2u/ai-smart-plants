import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { AuthTokens, AuthError } from '../../types/auth';

export class TokenManager {
  private static instance: TokenManager;
  private readonly TOKENS_KEY = 'smart_plant_auth_tokens';
  private readonly REFRESH_TOKEN_KEY = 'smart_plant_refresh_token';
  private readonly TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before expiry

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  private constructor() {}

  public async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      // Store access token and expiry in AsyncStorage (less sensitive)
      const publicTokenData = {
        accessToken: tokens.accessToken,
        expiresAt: tokens.expiresAt,
        idToken: tokens.idToken,
      };

      await AsyncStorage.setItem(this.TOKENS_KEY, JSON.stringify(publicTokenData));

      // Store refresh token securely
      if (tokens.refreshToken) {
        await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw this.createTokenError('STORAGE_FAILED', 'Failed to store authentication tokens');
    }
  }

  public async getTokens(): Promise<AuthTokens | null> {
    try {
      // Get public token data
      const publicTokenData = await AsyncStorage.getItem(this.TOKENS_KEY);
      if (!publicTokenData) {
        return null;
      }

      const parsed = JSON.parse(publicTokenData);

      // Get refresh token securely
      const refreshToken = await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);

      return {
        accessToken: parsed.accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt: parsed.expiresAt,
        idToken: parsed.idToken,
      };
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      return null;
    }
  }

  public async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.TOKENS_KEY),
        SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      // Don't throw error for cleanup operations
    }
  }

  public async isTokenValid(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();
      if (!tokens || !tokens.accessToken) {
        return false;
      }

      // Check if token is expired (with buffer)
      const now = Date.now();
      const expiryWithBuffer = tokens.expiresAt - this.TOKEN_EXPIRY_BUFFER;

      return now < expiryWithBuffer;
    } catch (error) {
      console.error('Failed to validate token:', error);
      return false;
    }
  }

  public async shouldRefreshToken(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();
      if (!tokens || !tokens.refreshToken) {
        return false;
      }

      // Check if access token will expire soon
      const now = Date.now();
      const expiryWithBuffer = tokens.expiresAt - this.TOKEN_EXPIRY_BUFFER;

      return now >= expiryWithBuffer;
    } catch (error) {
      console.error('Failed to check token refresh need:', error);
      return false;
    }
  }

  public async getAccessToken(): Promise<string | null> {
    try {
      const tokens = await this.getTokens();
      return tokens?.accessToken || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  public async getRefreshToken(): Promise<string | null> {
    try {
      const tokens = await this.getTokens();
      return tokens?.refreshToken || null;
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  public async updateTokens(newTokens: Partial<AuthTokens>): Promise<void> {
    try {
      const currentTokens = await this.getTokens();
      if (!currentTokens) {
        throw this.createTokenError('NO_TOKENS', 'No existing tokens to update');
      }

      const updatedTokens: AuthTokens = {
        ...currentTokens,
        ...newTokens,
      };

      await this.storeTokens(updatedTokens);
    } catch (error) {
      console.error('Failed to update tokens:', error);
      throw this.createTokenError('UPDATE_FAILED', 'Failed to update authentication tokens');
    }
  }

  public getTokenExpiryTime(): Promise<number | null> {
    return this.getTokens().then(tokens => tokens?.expiresAt || null);
  }

  public async isRefreshTokenValid(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      return !!refreshToken;
    } catch (error) {
      console.error('Failed to validate refresh token:', error);
      return false;
    }
  }

  public async rotateTokens(newTokens: AuthTokens): Promise<void> {
    try {
      // Clear existing tokens first
      await this.clearTokens();

      // Store new tokens
      await this.storeTokens(newTokens);
    } catch (error) {
      console.error('Failed to rotate tokens:', error);
      throw this.createTokenError('ROTATION_FAILED', 'Failed to rotate authentication tokens');
    }
  }

  public async exportTokens(): Promise<string | null> {
    try {
      const tokens = await this.getTokens();
      if (!tokens) {
        return null;
      }

      // Only export non-sensitive data for debugging
      return JSON.stringify({
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        hasIdToken: !!tokens.idToken,
        expiresAt: tokens.expiresAt,
        isExpired: Date.now() >= tokens.expiresAt,
        expiresIn: Math.max(0, tokens.expiresAt - Date.now()),
      }, null, 2);
    } catch (error) {
      console.error('Failed to export tokens:', error);
      return null;
    }
  }

  public async validateTokenIntegrity(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();
      if (!tokens) {
        return false;
      }

      // Basic validation checks
      const hasRequiredFields = !!(tokens.accessToken && tokens.expiresAt);
      const isNotExpired = Date.now() < tokens.expiresAt;
      const hasValidFormat = this.isValidTokenFormat(tokens.accessToken);

      return hasRequiredFields && isNotExpired && hasValidFormat;
    } catch (error) {
      console.error('Failed to validate token integrity:', error);
      return false;
    }
  }

  private isValidTokenFormat(token: string): boolean {
    try {
      // Basic JWT format check (if using JWT tokens)
      if (token.includes('.')) {
        const parts = token.split('.');
        return parts.length === 3;
      }

      // For other token formats, check basic criteria
      return token.length > 10 && /^[A-Za-z0-9._-]+$/.test(token);
    } catch (error) {
      return false;
    }
  }

  private createTokenError(code: string, message: string, details?: any): AuthError {
    return {
      code,
      message,
      details,
    };
  }

  public async getTokenMetadata(): Promise<{
    hasTokens: boolean;
    isValid: boolean;
    expiresAt: number | null;
    expiresIn: number | null;
    needsRefresh: boolean;
  }> {
    try {
      const tokens = await this.getTokens();
      const hasTokens = !!tokens;
      const isValid = await this.isTokenValid();
      const needsRefresh = await this.shouldRefreshToken();

      return {
        hasTokens,
        isValid,
        expiresAt: tokens?.expiresAt || null,
        expiresIn: tokens ? Math.max(0, tokens.expiresAt - Date.now()) : null,
        needsRefresh,
      };
    } catch (error) {
      console.error('Failed to get token metadata:', error);
      return {
        hasTokens: false,
        isValid: false,
        expiresAt: null,
        expiresIn: null,
        needsRefresh: false,
      };
    }
  }
}