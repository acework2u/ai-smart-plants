import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { AuthProvider, AuthTokens, AuthSession as AppAuthSession, AuthError } from '../../types/auth';

export interface EmailPasswordCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
  newsletter?: boolean;
  role?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmation {
  email: string;
  resetCode: string;
  newPassword: string;
}

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationConfirmation {
  email: string;
  verificationCode: string;
}

export interface AuthConfig {
  apiBaseUrl: string;
  tokenStorageKey: string;
  refreshTokenKey: string;
  rememberMeKey: string;
  passwordMinLength: number;
  passwordRequirements: {
    lowercase: boolean;
    uppercase: boolean;
    numbers: boolean;
    symbols: boolean;
  };
}

export class EmailPasswordAuthProvider {
  private static instance: EmailPasswordAuthProvider;

  private readonly config: AuthConfig = {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000',
    tokenStorageKey: '@smart_plant_auth_token',
    refreshTokenKey: '@smart_plant_refresh_token',
    rememberMeKey: '@smart_plant_remember_me',
    passwordMinLength: 8,
    passwordRequirements: {
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: false,
    },
  };

  public static getInstance(): EmailPasswordAuthProvider {
    if (!EmailPasswordAuthProvider.instance) {
      EmailPasswordAuthProvider.instance = new EmailPasswordAuthProvider();
    }
    return EmailPasswordAuthProvider.instance;
  }

  private constructor() {
    // Initialize provider
  }

  public async signIn(credentials: EmailPasswordCredentials): Promise<AppAuthSession> {
    try {
      // Validate credentials
      this.validateCredentials(credentials);

      // Make authentication request
      const response = await fetch(`${this.config.apiBaseUrl}/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': 'v1',
        },
        body: JSON.stringify({
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await this.safeReadError(response);
        throw this.createAuthError(
          this.mapApiErrorCode(errorData?.errors?.[0]?.code || response.status.toString()),
          errorData?.errors?.[0]?.message || 'Authentication failed',
          errorData
        );
      }

      const data = await response.json();
      const payload = data?.data ?? {};

      const tokens: AuthTokens = this.createTokensFromPayload(payload);
      const user = this.createUserFromApiResponse(payload.user, tokens, payload.profile);

      // Store credentials if remember me is enabled
      if (credentials.rememberMe) {
        await this.storeRememberMeData(credentials.email);
      }

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
      console.error('Email/password sign-in error:', error);

      if (error.code) {
        throw error;
      }

      throw this.createAuthError('SIGN_IN_FAILED', 'Failed to sign in with email and password');
    }
  }

  public async register(registrationData: RegistrationData): Promise<AppAuthSession> {
    try {
      // Validate registration data
      this.validateRegistrationData(registrationData);

      // Make registration request
      const registerPayload = {
        email: registrationData.email.toLowerCase().trim(),
        password: registrationData.password,
        role: registrationData.role ?? 'owner'
      };

      const response = await fetch(`${this.config.apiBaseUrl}/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': 'v1',
        },
        body: JSON.stringify(registerPayload),
      });

      if (!response.ok) {
        const errorData = await this.safeReadError(response);
        throw this.createAuthError(
          this.mapApiErrorCode(errorData?.errors?.[0]?.code || response.status.toString()),
          errorData?.errors?.[0]?.message || 'Registration failed',
          errorData
        );
      }

      const data = await response.json();
      const payload = data?.data ?? {};

      const tokens: AuthTokens = this.createTokensFromPayload(payload);
      const user = this.createUserFromApiResponse(payload.user, tokens, payload.profile);

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
      console.error('Email/password registration error:', error);

      if (error.code) {
        throw error;
      }

      throw this.createAuthError('REGISTRATION_FAILED', 'Failed to register with email and password');
    }
  }

  public async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/v1/auth/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': 'v1',
        },
        body: JSON.stringify({
          email: request.email.toLowerCase().trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw this.createAuthError(
          this.mapApiErrorCode(errorData.errors?.[0]?.code || response.status.toString()),
          errorData.errors?.[0]?.message || 'Password reset request failed',
          errorData
        );
      }

      console.log('Password reset email sent successfully');
    } catch (error: any) {
      console.error('Password reset request error:', error);

      if (error.code) {
        throw error;
      }

      throw this.createAuthError('PASSWORD_RESET_FAILED', 'Failed to request password reset');
    }
  }

  public async confirmPasswordReset(confirmation: PasswordResetConfirmation): Promise<void> {
    try {
      // Validate new password
      this.validatePassword(confirmation.newPassword);

      const response = await fetch(`${this.config.apiBaseUrl}/v1/auth/password-reset/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': 'v1',
        },
        body: JSON.stringify({
          email: confirmation.email.toLowerCase().trim(),
          reset_code: confirmation.resetCode,
          new_password: confirmation.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw this.createAuthError(
          this.mapApiErrorCode(errorData.errors?.[0]?.code || response.status.toString()),
          errorData.errors?.[0]?.message || 'Password reset confirmation failed',
          errorData
        );
      }

      console.log('Password reset confirmed successfully');
    } catch (error: any) {
      console.error('Password reset confirmation error:', error);

      if (error.code) {
        throw error;
      }

      throw this.createAuthError('PASSWORD_RESET_CONFIRMATION_FAILED', 'Failed to confirm password reset');
    }
  }

  public async requestEmailVerification(request: EmailVerificationRequest): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/v1/auth/email-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': 'v1',
        },
        body: JSON.stringify({
          email: request.email.toLowerCase().trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw this.createAuthError(
          this.mapApiErrorCode(errorData.errors?.[0]?.code || response.status.toString()),
          errorData.errors?.[0]?.message || 'Email verification request failed',
          errorData
        );
      }

      console.log('Email verification sent successfully');
    } catch (error: any) {
      console.error('Email verification request error:', error);

      if (error.code) {
        throw error;
      }

      throw this.createAuthError('EMAIL_VERIFICATION_FAILED', 'Failed to request email verification');
    }
  }

  public async confirmEmailVerification(confirmation: EmailVerificationConfirmation): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/v1/auth/email-verification/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': 'v1',
        },
        body: JSON.stringify({
          email: confirmation.email.toLowerCase().trim(),
          verification_code: confirmation.verificationCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw this.createAuthError(
          this.mapApiErrorCode(errorData.errors?.[0]?.code || response.status.toString()),
          errorData.errors?.[0]?.message || 'Email verification confirmation failed',
          errorData
        );
      }

      console.log('Email verification confirmed successfully');
    } catch (error: any) {
      console.error('Email verification confirmation error:', error);

      if (error.code) {
        throw error;
      }

      throw this.createAuthError('EMAIL_VERIFICATION_CONFIRMATION_FAILED', 'Failed to confirm email verification');
    }
  }

  public async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': 'v1',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw this.createAuthError(
          this.mapApiErrorCode(errorData.errors?.[0]?.code || response.status.toString()),
          errorData.errors?.[0]?.message || 'Token refresh failed',
          errorData
        );
      }

      const data = await response.json();

      return {
        accessToken: data.data.access_token,
        refreshToken: data.data.refresh_token || refreshToken,
        expiresAt: Date.now() + (data.data.expires_in * 1000),
        idToken: data.data.id_token,
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      throw this.createAuthError('TOKEN_REFRESH_FAILED', 'Failed to refresh tokens');
    }
  }

  public async signOut(tokens: AuthTokens): Promise<void> {
    try {
      await fetch(`${this.config.apiBaseUrl}/v1/auth/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
          'X-API-Version': 'v1',
        },
        body: JSON.stringify({
          refresh_token: tokens.refreshToken,
        }),
      });

      // Clear remember me data
      await this.clearRememberMeData();

      console.log('Email/password sign out completed');
    } catch (error) {
      console.error('Email/password sign-out error:', error);
      // Don't throw error for sign-out, just log it
    }
  }

  private validateCredentials(credentials: EmailPasswordCredentials): void {
    if (!credentials.email || !credentials.email.trim()) {
      throw this.createAuthError('INVALID_EMAIL', 'Email is required');
    }

    if (!this.isValidEmail(credentials.email)) {
      throw this.createAuthError('INVALID_EMAIL', 'Invalid email format');
    }

    if (!credentials.password || !credentials.password.trim()) {
      throw this.createAuthError('INVALID_PASSWORD', 'Password is required');
    }
  }

  private validateRegistrationData(data: RegistrationData): void {
    // Email validation
    if (!data.email || !data.email.trim()) {
      throw this.createAuthError('INVALID_EMAIL', 'Email is required');
    }

    if (!this.isValidEmail(data.email)) {
      throw this.createAuthError('INVALID_EMAIL', 'Invalid email format');
    }

    // Password validation
    this.validatePassword(data.password);

    // Confirm password validation
    if (data.password !== data.confirmPassword) {
      throw this.createAuthError('PASSWORD_MISMATCH', 'Passwords do not match');
    }

    // Name validation
    if (!data.firstName || !data.firstName.trim()) {
      throw this.createAuthError('INVALID_FIRST_NAME', 'First name is required');
    }

    if (!data.lastName || !data.lastName.trim()) {
      throw this.createAuthError('INVALID_LAST_NAME', 'Last name is required');
    }

    // Terms validation
    if (!data.acceptTerms) {
      throw this.createAuthError('TERMS_NOT_ACCEPTED', 'You must accept the terms and conditions');
    }
  }

  private validatePassword(password: string): void {
    if (!password || password.length < this.config.passwordMinLength) {
      throw this.createAuthError(
        'WEAK_PASSWORD',
        `Password must be at least ${this.config.passwordMinLength} characters long`
      );
    }

    const requirements = this.config.passwordRequirements;

    if (requirements.lowercase && !/[a-z]/.test(password)) {
      throw this.createAuthError('WEAK_PASSWORD', 'Password must contain at least one lowercase letter');
    }

    if (requirements.uppercase && !/[A-Z]/.test(password)) {
      throw this.createAuthError('WEAK_PASSWORD', 'Password must contain at least one uppercase letter');
    }

    if (requirements.numbers && !/\d/.test(password)) {
      throw this.createAuthError('WEAK_PASSWORD', 'Password must contain at least one number');
    }

    if (requirements.symbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw this.createAuthError('WEAK_PASSWORD', 'Password must contain at least one special character');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private createUserFromApiResponse(userData: any, tokens: AuthTokens, profileData?: any): any {
    const firstName = userData?.first_name ?? userData?.firstName ?? userData?.given_name ?? '';
    const lastName = userData?.last_name ?? userData?.lastName ?? userData?.family_name ?? '';
    const composedName = [firstName, lastName].filter(Boolean).join(' ');
    const fallbackName = userData?.name ?? userData?.email?.split('@')[0] ?? 'Smart Plant Member';

    const profile = profileData ?? userData?.profile ?? {};
    const preferences = userData?.preferences ?? {};

    return {
      id: userData?.id ?? `temp-${tokens.accessToken.slice(0, 8)}`,
      email: userData?.email ?? 'unknown@smartplant.app',
      name: composedName || fallbackName,
      avatar: userData?.avatar_url ?? userData?.avatar ?? null,
      joinDate: userData?.createdAt ?? userData?.created_at ?? new Date().toISOString(),
      provider: 'email' as AuthProvider,
      isEmailVerified: userData?.email_verified ?? userData?.isEmailVerified ?? false,
      isPhoneVerified: userData?.phone_verified ?? userData?.isPhoneVerified ?? false,
      profile: {
        displayName: profile.displayName ?? (composedName || fallbackName),
        gardenCount: profile.gardenCount ?? profile.garden_count ?? 0,
        totalPlants: profile.totalPlants ?? profile.total_plants ?? 0,
        experienceLevel: profile.experienceLevel ?? profile.experience_level ?? 'beginner',
        favoriteCategories: profile.favoriteCategories ?? profile.favorite_categories ?? [],
      },
      preferences: {
        language: preferences.language ?? 'th',
        theme: preferences.theme ?? 'system',
        notifications: preferences.notifications ?? true,
        haptics: preferences.haptics ?? true,
        biometricAuth: preferences.biometric_auth ?? preferences.biometricAuth ?? false,
        units: preferences.units ?? {
          volume: 'ml',
          weight: 'g',
          temperature: 'celsius',
        },
        privacy: preferences.privacy ?? {
          personalizedTips: true,
          analytics: true,
          crashReporting: true,
        },
      },
    };
  }

  private mapApiErrorCode(apiCode: string): string {
    const errorCodeMap: Record<string, string> = {
      'auth/invalid-credentials': 'INVALID_CREDENTIALS',
      'auth/user-not-found': 'USER_NOT_FOUND',
      'auth/wrong-password': 'INVALID_CREDENTIALS',
      'auth/email-already-exists': 'EMAIL_ALREADY_EXISTS',
      'auth/email-exists': 'EMAIL_ALREADY_EXISTS',
      'auth/weak-password': 'WEAK_PASSWORD',
      'auth/invalid-email': 'INVALID_EMAIL',
      'auth/invalid-payload': 'INVALID_REQUEST',
      'auth/user-disabled': 'USER_DISABLED',
      'auth/too-many-requests': 'TOO_MANY_REQUESTS',
      'auth/network-error': 'NETWORK_ERROR',
      '400': 'INVALID_REQUEST',
      '401': 'UNAUTHORIZED',
      '403': 'FORBIDDEN',
      '404': 'NOT_FOUND',
      '429': 'TOO_MANY_REQUESTS',
      '500': 'SERVER_ERROR',
    };

    return errorCodeMap[apiCode] || 'UNKNOWN_ERROR';
  }

  private createTokensFromPayload(payload: any): AuthTokens {
    const accessToken = payload?.accessToken ?? payload?.access_token;

    if (!accessToken) {
      throw this.createAuthError('TOKEN_MISSING', 'Access token not provided by API');
    }

    const fallbackExpires = 3600;
    const expiresIn = payload?.expiresIn ?? payload?.expires_in ?? fallbackExpires;

    return {
      accessToken,
      refreshToken: payload?.refreshToken ?? payload?.refresh_token ?? accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
      idToken: payload?.idToken ?? payload?.id_token ?? undefined,
    };
  }

  private async safeReadError(response: Response): Promise<any | null> {
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  private async storeRememberMeData(email: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.config.rememberMeKey, JSON.stringify({
        email,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Failed to store remember me data:', error);
    }
  }

  private async clearRememberMeData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.config.rememberMeKey);
    } catch (error) {
      console.warn('Failed to clear remember me data:', error);
    }
  }

  public async getRememberedEmail(): Promise<string | null> {
    try {
      const stored = await AsyncStorage.getItem(this.config.rememberMeKey);
      if (!stored) return null;

      const data = JSON.parse(stored);

      // Check if remember me data is still valid (e.g., not older than 30 days)
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp > thirtyDaysMs) {
        await this.clearRememberMeData();
        return null;
      }

      return data.email;
    } catch (error) {
      console.warn('Failed to get remembered email:', error);
      return null;
    }
  }

  private async getDeviceId(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return `email_device_${Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')}`;
  }

  private createAuthError(code: string, message: string, details?: any): AuthError {
    return {
      code,
      message,
      details,
    };
  }

  public get isEnabled(): boolean {
    return !!this.config.apiBaseUrl;
  }

  public getPasswordRequirements(): typeof this.config.passwordRequirements {
    return { ...this.config.passwordRequirements };
  }

  public getPasswordMinLength(): number {
    return this.config.passwordMinLength;
  }
}
