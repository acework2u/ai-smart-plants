import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthSession, AuthTokens, AuthError } from '../../types/auth';

export interface SessionConfig {
  sessionTimeout: number; // in milliseconds
  refreshThreshold: number; // refresh when tokens expire within this time
  maxConcurrentSessions: number;
  enableBiometricAuth: boolean;
  persistSession: boolean;
}

export interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  lastActivity: string;
  sessionDuration: number;
  deviceCount: number;
}

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: AuthSession | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  private readonly config: SessionConfig = {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    refreshThreshold: 5 * 60 * 1000, // 5 minutes
    maxConcurrentSessions: 3,
    enableBiometricAuth: false,
    persistSession: true,
  };

  private readonly STORAGE_KEYS = {
    SESSION: '@smart_plant_session',
    TOKENS: '@smart_plant_tokens',
    REFRESH_TOKEN: '@smart_plant_refresh_token',
    SESSION_METADATA: '@smart_plant_session_metadata',
    BIOMETRIC_ENABLED: '@smart_plant_biometric_enabled',
  };

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private constructor() {
    this.initializeSession();
  }

  private async initializeSession(): Promise<void> {
    try {
      if (this.config.persistSession) {
        await this.restoreSession();
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  public async createSession(session: AuthSession): Promise<void> {
    try {
      // Validate session
      this.validateSession(session);

      // Store current session
      this.currentSession = {
        ...session,
        lastActivity: new Date().toISOString(),
        isActive: true,
      };

      // Persist session if enabled
      if (this.config.persistSession) {
        await this.persistSession(this.currentSession);
      }

      // Setup session timers
      this.setupSessionTimers();

      // Update session metrics
      await this.updateSessionMetrics();

      console.log('Session created successfully');
    } catch (error) {
      console.error('Failed to create session:', error);
      throw this.createSessionError('SESSION_CREATION_FAILED', 'Failed to create session');
    }
  }

  public async restoreSession(): Promise<AuthSession | null> {
    try {
      // Try to get session from secure storage first, then fallback to AsyncStorage
      const sessionData = await this.getStoredSession();

      if (!sessionData) {
        return null;
      }

      // Validate stored session
      if (!this.isSessionValid(sessionData)) {
        await this.clearStoredSession();
        return null;
      }

      // Check if tokens need refresh
      if (this.shouldRefreshTokens(sessionData.tokens)) {
        try {
          const refreshedTokens = await this.refreshSessionTokens(sessionData);
          sessionData.tokens = refreshedTokens;
        } catch (error) {
          console.error('Failed to refresh tokens during session restore:', error);
          await this.clearStoredSession();
          return null;
        }
      }

      // Update last activity
      sessionData.lastActivity = new Date().toISOString();
      this.currentSession = sessionData;

      // Setup timers
      this.setupSessionTimers();

      console.log('Session restored successfully');
      return sessionData;
    } catch (error) {
      console.error('Failed to restore session:', error);
      await this.clearStoredSession();
      return null;
    }
  }

  public async refreshSession(): Promise<void> {
    try {
      if (!this.currentSession) {
        throw this.createSessionError('NO_ACTIVE_SESSION', 'No active session to refresh');
      }

      // Refresh tokens
      const refreshedTokens = await this.refreshSessionTokens(this.currentSession);

      // Update current session
      this.currentSession.tokens = refreshedTokens;
      this.currentSession.lastActivity = new Date().toISOString();

      // Persist updated session
      if (this.config.persistSession) {
        await this.persistSession(this.currentSession);
      }

      // Reset timers
      this.setupSessionTimers();

      console.log('Session refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh session:', error);
      await this.endSession();
      throw this.createSessionError('SESSION_REFRESH_FAILED', 'Failed to refresh session');
    }
  }

  public async endSession(): Promise<void> {
    try {
      if (this.currentSession) {
        // Mark session as inactive
        this.currentSession.isActive = false;

        // Clear timers
        this.clearTimers();

        // Clear stored session
        await this.clearStoredSession();

        // Update metrics
        await this.updateSessionMetrics();

        this.currentSession = null;

        console.log('Session ended successfully');
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  public async updateActivity(): Promise<void> {
    if (this.currentSession && this.currentSession.isActive) {
      this.currentSession.lastActivity = new Date().toISOString();

      // Reset session timer
      this.setupSessionTimer();

      // Persist updated activity
      if (this.config.persistSession) {
        await this.persistSession(this.currentSession);
      }
    }
  }

  public getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  public isSessionActive(): boolean {
    return this.currentSession?.isActive || false;
  }

  public getSessionDuration(): number {
    if (!this.currentSession) return 0;

    const startTime = new Date(this.currentSession.user.joinDate).getTime();
    const currentTime = Date.now();
    return currentTime - startTime;
  }

  public async getSessionMetrics(): Promise<SessionMetrics> {
    try {
      const metadata = await AsyncStorage.getItem(this.STORAGE_KEYS.SESSION_METADATA);
      const parsed = metadata ? JSON.parse(metadata) : {};

      return {
        totalSessions: parsed.totalSessions || 0,
        activeSessions: this.isSessionActive() ? 1 : 0,
        lastActivity: this.currentSession?.lastActivity || '',
        sessionDuration: this.getSessionDuration(),
        deviceCount: parsed.deviceCount || 1,
      };
    } catch (error) {
      console.error('Failed to get session metrics:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        lastActivity: '',
        sessionDuration: 0,
        deviceCount: 0,
      };
    }
  }

  private validateSession(session: AuthSession): void {
    if (!session.user || !session.tokens) {
      throw this.createSessionError('INVALID_SESSION', 'Session missing required data');
    }

    if (!session.tokens.accessToken) {
      throw this.createSessionError('INVALID_TOKENS', 'Session missing access token');
    }
  }

  private isSessionValid(session: AuthSession): boolean {
    if (!session || !session.user || !session.tokens) {
      return false;
    }

    // Check if session has expired
    const lastActivity = new Date(session.lastActivity).getTime();
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;

    if (timeSinceActivity > this.config.sessionTimeout) {
      return false;
    }

    // Check if tokens have expired
    if (session.tokens.expiresAt && session.tokens.expiresAt < now) {
      // Allow expired tokens if we have a refresh token
      return !!session.tokens.refreshToken;
    }

    return true;
  }

  private shouldRefreshTokens(tokens: AuthTokens): boolean {
    if (!tokens.expiresAt) return false;

    const now = Date.now();
    const timeUntilExpiry = tokens.expiresAt - now;

    return timeUntilExpiry < this.config.refreshThreshold;
  }

  private async refreshSessionTokens(session: AuthSession): Promise<AuthTokens> {
    // This would typically call the appropriate OAuth provider's refresh method
    // For now, we'll return the existing tokens (implement provider-specific refresh)
    console.log('Token refresh needed - implement provider-specific logic');
    return session.tokens;
  }

  private async persistSession(session: AuthSession): Promise<void> {
    try {
      // Store session data
      await AsyncStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify({
        user: session.user,
        lastActivity: session.lastActivity,
        isActive: session.isActive,
        deviceInfo: session.deviceInfo,
      }));

      // Store tokens securely
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await SecureStore.setItemAsync(this.STORAGE_KEYS.TOKENS, JSON.stringify(session.tokens));

        if (session.tokens.refreshToken) {
          await SecureStore.setItemAsync(this.STORAGE_KEYS.REFRESH_TOKEN, session.tokens.refreshToken);
        }
      } else {
        // Fallback to AsyncStorage for web
        await AsyncStorage.setItem(this.STORAGE_KEYS.TOKENS, JSON.stringify(session.tokens));
      }
    } catch (error) {
      console.error('Failed to persist session:', error);
      throw this.createSessionError('PERSISTENCE_FAILED', 'Failed to save session');
    }
  }

  private async getStoredSession(): Promise<AuthSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.STORAGE_KEYS.SESSION);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);

      // Get tokens from secure storage
      let tokens;
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const tokensData = await SecureStore.getItemAsync(this.STORAGE_KEYS.TOKENS);
        tokens = tokensData ? JSON.parse(tokensData) : null;
      } else {
        const tokensData = await AsyncStorage.getItem(this.STORAGE_KEYS.TOKENS);
        tokens = tokensData ? JSON.parse(tokensData) : null;
      }

      if (!tokens) return null;

      return {
        ...session,
        tokens,
      };
    } catch (error) {
      console.error('Failed to get stored session:', error);
      return null;
    }
  }

  private async clearStoredSession(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.SESSION),
        AsyncStorage.removeItem(this.STORAGE_KEYS.TOKENS),
        Platform.OS === 'ios' || Platform.OS === 'android'
          ? SecureStore.deleteItemAsync(this.STORAGE_KEYS.TOKENS).catch(() => {})
          : Promise.resolve(),
        Platform.OS === 'ios' || Platform.OS === 'android'
          ? SecureStore.deleteItemAsync(this.STORAGE_KEYS.REFRESH_TOKEN).catch(() => {})
          : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Failed to clear stored session:', error);
    }
  }

  private async updateSessionMetrics(): Promise<void> {
    try {
      const current = await this.getSessionMetrics();
      const updated = {
        totalSessions: current.totalSessions + 1,
        deviceCount: current.deviceCount,
        lastUpdate: new Date().toISOString(),
      };

      await AsyncStorage.setItem(this.STORAGE_KEYS.SESSION_METADATA, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update session metrics:', error);
    }
  }

  private setupSessionTimers(): void {
    this.clearTimers();
    this.setupSessionTimer();
    this.setupRefreshTimer();
  }

  private setupSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(async () => {
      console.log('Session timeout reached');
      await this.endSession();
    }, this.config.sessionTimeout);
  }

  private setupRefreshTimer(): void {
    if (!this.currentSession?.tokens.expiresAt) return;

    const now = Date.now();
    const timeUntilRefresh = this.currentSession.tokens.expiresAt - now - this.config.refreshThreshold;

    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          await this.refreshSession();
        } catch (error) {
          console.error('Automatic token refresh failed:', error);
        }
      }, timeUntilRefresh);
    }
  }

  private clearTimers(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private createSessionError(code: string, message: string, details?: any): AuthError {
    return {
      code,
      message,
      details,
    };
  }

  // Cleanup on app termination
  public async cleanup(): Promise<void> {
    this.clearTimers();
    if (this.currentSession) {
      await this.updateActivity();
    }
  }
}