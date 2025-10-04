import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  User,
  AuthSession,
  AuthState,
  AuthActions,
  SignInRequest,
  SignUpRequest,
  AuthTokens,
  AuthError,
  UserProfile,
  UserPreferences,
} from '../types/auth';
import { TokenManager } from '../services/auth/TokenManager';
import { GoogleOAuthProvider } from '../services/auth/GoogleOAuthProvider';
import { EmailPasswordAuthProvider } from '../services/auth/EmailPasswordAuthProvider';
import { SessionManager } from '../services/auth/SessionManager';

interface AuthStore extends AuthState, AuthActions {
  // Additional state
  isInitialized: boolean;
  lastAuthAction: string | null;

  // Additional actions
  initialize: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  refreshSession: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  exportAuthData: () => Promise<string | null>;
}

const tokenManager = TokenManager.getInstance();
const googleProvider = GoogleOAuthProvider.getInstance();
const emailProvider = EmailPasswordAuthProvider.getInstance();
const sessionManager = SessionManager.getInstance();

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      isInitialized: false,
      lastAuthAction: null,

      // Initialize store
      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          // Check if we have valid tokens
          const isValid = await tokenManager.isTokenValid();

          if (isValid) {
            const tokens = await tokenManager.getTokens();
            if (tokens && get().session) {
              // Update session with current tokens
              const currentSession = get().session;
              if (currentSession) {
                set({
                  session: { ...currentSession, tokens },
                  isAuthenticated: true,
                });
              }
            }
          } else {
            // Clear invalid session
            await get().signOut();
          }

          set({ isInitialized: true });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({
            error: createAuthError('INIT_FAILED', 'Failed to initialize authentication'),
            isInitialized: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // Sign in
      signIn: async (request: SignInRequest): Promise<AuthSession> => {
        try {
          set({ isLoading: true, error: null, lastAuthAction: 'signin' });

          let session: AuthSession;

          switch (request.provider) {
            case 'google':
              session = await googleProvider.signIn();
              break;
            case 'apple':
              throw createAuthError('NOT_IMPLEMENTED', 'Apple Sign-In not yet implemented');
            case 'facebook':
              throw createAuthError('NOT_IMPLEMENTED', 'Facebook Sign-In not yet implemented');
            case 'email':
              session = await handleEmailSignIn(request);
              break;
            case 'phone':
              session = await handlePhoneSignIn(request);
              break;
            default:
              throw createAuthError('INVALID_PROVIDER', 'Invalid authentication provider');
          }

          // Store tokens securely
          await tokenManager.storeTokens(session.tokens);

          // Update store state
          set({
            user: session.user,
            session,
            isAuthenticated: true,
            isLoading: false,
          });

          return session;
        } catch (error) {
          console.error('Sign-in error:', error);
          const authError = (error as AuthError)?.code
            ? (error as AuthError)
            : createAuthError('SIGN_IN_FAILED', 'Failed to sign in');

          set({ error: authError, isLoading: false });
          throw authError;
        }
      },

      // Sign up
      signUp: async (request: SignUpRequest): Promise<AuthSession> => {
        try {
          set({ isLoading: true, error: null, lastAuthAction: 'signup' });

          let session: AuthSession;

          switch (request.provider) {
            case 'google':
              session = await googleProvider.signIn(); // Google signup is same as signin
              break;
            case 'apple':
              throw createAuthError('NOT_IMPLEMENTED', 'Apple Sign-Up not yet implemented');
            case 'facebook':
              throw createAuthError('NOT_IMPLEMENTED', 'Facebook Sign-Up not yet implemented');
            case 'email':
              session = await handleEmailSignUp(request);
              break;
            case 'phone':
              session = await handlePhoneSignUp(request);
              break;
            default:
              throw createAuthError('INVALID_PROVIDER', 'Invalid authentication provider');
          }

          // Store tokens securely
          await tokenManager.storeTokens(session.tokens);

          // Update store state
          set({
            user: session.user,
            session,
            isAuthenticated: true,
            isLoading: false,
          });

          return session;
        } catch (error) {
          console.error('Sign-up error:', error);
          const authError = (error as AuthError)?.code
            ? (error as AuthError)
            : createAuthError('SIGN_UP_FAILED', 'Failed to sign up');

          set({ error: authError, isLoading: false });
          throw authError;
        }
      },

      // Sign out
      signOut: async (): Promise<void> => {
        try {
          set({ isLoading: true, error: null, lastAuthAction: 'signout' });

          const currentSession = get().session;

          if (currentSession?.tokens) {
            // Revoke tokens with provider
            switch (currentSession.user.provider) {
              case 'google':
                await googleProvider.signOut(currentSession.tokens);
                break;
              // Add other providers as needed
            }
          }

          // Clear local storage
          await tokenManager.clearTokens();

          // Clear store state
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Sign-out error:', error);
          // Don't throw error for sign-out, just clear local state
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Refresh token
      refreshToken: async (): Promise<AuthTokens> => {
        try {
          const currentSession = get().session;
          if (!currentSession?.tokens.refreshToken) {
            throw createAuthError('NO_REFRESH_TOKEN', 'No refresh token available');
          }

          let newTokens: AuthTokens;

          switch (currentSession.user.provider) {
            case 'google':
              newTokens = await googleProvider.refreshTokens(currentSession.tokens.refreshToken);
              break;
            default:
              throw createAuthError('PROVIDER_NOT_SUPPORTED', 'Token refresh not supported for this provider');
          }

          // Store new tokens
          await tokenManager.storeTokens(newTokens);

          // Update session
          const updatedSession = { ...currentSession, tokens: newTokens };
          set({ session: updatedSession });

          return newTokens;
        } catch (error) {
          console.error('Token refresh error:', error);
          const authError = error instanceof Error && (error as any).code
            ? error as AuthError
            : createAuthError('TOKEN_REFRESH_FAILED', 'Failed to refresh token');

          set({ error: authError });
          throw authError;
        }
      },

      // Update profile
      updateProfile: async (profile: Partial<UserProfile>): Promise<User> => {
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw createAuthError('NOT_AUTHENTICATED', 'User not authenticated');
          }

          // TODO: Implement API call to update profile
          const updatedUser = {
            ...currentUser,
            profile: { ...currentUser.profile, ...profile },
          };

          // Update store state
          const currentSession = get().session;
          if (currentSession) {
            set({
              user: updatedUser,
              session: { ...currentSession, user: updatedUser },
            });
          }

          return updatedUser;
        } catch (error) {
          console.error('Profile update error:', error);
          const authError = error instanceof Error && (error as any).code
            ? error as AuthError
            : createAuthError('PROFILE_UPDATE_FAILED', 'Failed to update profile');

          set({ error: authError });
          throw authError;
        }
      },

      // Update preferences
      updatePreferences: async (preferences: Partial<UserPreferences>): Promise<User> => {
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw createAuthError('NOT_AUTHENTICATED', 'User not authenticated');
          }

          const updatedUser = {
            ...currentUser,
            preferences: { ...currentUser.preferences, ...preferences },
          };

          // Update store state
          const currentSession = get().session;
          if (currentSession) {
            set({
              user: updatedUser,
              session: { ...currentSession, user: updatedUser },
            });
          }

          return updatedUser;
        } catch (error) {
          console.error('Preferences update error:', error);
          const authError = error instanceof Error && (error as any).code
            ? error as AuthError
            : createAuthError('PREFERENCES_UPDATE_FAILED', 'Failed to update preferences');

          set({ error: authError });
          throw authError;
        }
      },

      // Verify email
      verifyEmail: async (code: string): Promise<boolean> => {
        try {
          // TODO: Implement email verification
          console.log('Verify email with code:', code);
          return true;
        } catch (error) {
          console.error('Email verification error:', error);
          throw createAuthError('EMAIL_VERIFICATION_FAILED', 'Failed to verify email');
        }
      },

      // Verify phone
      verifyPhone: async (code: string): Promise<boolean> => {
        try {
          // TODO: Implement phone verification
          console.log('Verify phone with code:', code);
          return true;
        } catch (error) {
          console.error('Phone verification error:', error);
          throw createAuthError('PHONE_VERIFICATION_FAILED', 'Failed to verify phone');
        }
      },

      // Reset password
      resetPassword: async (email: string): Promise<boolean> => {
        try {
          // TODO: Implement password reset
          console.log('Reset password for email:', email);
          return true;
        } catch (error) {
          console.error('Password reset error:', error);
          throw createAuthError('PASSWORD_RESET_FAILED', 'Failed to reset password');
        }
      },

      // Delete account
      deleteAccount: async (): Promise<void> => {
        try {
          // TODO: Implement account deletion
          await get().signOut();
        } catch (error) {
          console.error('Account deletion error:', error);
          throw createAuthError('ACCOUNT_DELETION_FAILED', 'Failed to delete account');
        }
      },

      // Additional methods
      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      refreshSession: async (): Promise<void> => {
        try {
          const shouldRefresh = await tokenManager.shouldRefreshToken();
          if (shouldRefresh) {
            await get().refreshToken();
          }
        } catch (error) {
          console.error('Session refresh error:', error);
          // If refresh fails, sign out
          await get().signOut();
        }
      },

      validateSession: async (): Promise<boolean> => {
        try {
          const isValid = await tokenManager.isTokenValid();
          if (!isValid) {
            await get().signOut();
            return false;
          }
          return true;
        } catch (error) {
          console.error('Session validation error:', error);
          await get().signOut();
          return false;
        }
      },

      exportAuthData: async (): Promise<string | null> => {
        try {
          const state = get();
          const tokenMetadata = await tokenManager.getTokenMetadata();

          return JSON.stringify({
            isAuthenticated: state.isAuthenticated,
            isInitialized: state.isInitialized,
            hasUser: !!state.user,
            hasSession: !!state.session,
            userProvider: state.user?.provider,
            lastAuthAction: state.lastAuthAction,
            tokenMetadata,
          }, null, 2);
        } catch (error) {
          console.error('Export auth data error:', error);
          return null;
        }
      },
    }),
    {
      name: 'smart-plant-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        lastAuthAction: state.lastAuthAction,
      }),
    }
  )
);

// Helper functions
async function handleEmailSignIn(request: SignInRequest): Promise<AuthSession> {
  if (!request.email || !request.password) {
    throw createAuthError('INVALID_CREDENTIALS', 'กรุณากรอกอีเมลและรหัสผ่าน');
  }

  try {
    const session = await emailProvider.signIn({
      email: request.email,
      password: request.password,
      rememberMe: request.rememberMe,
    });

    await sessionManager.createSession(session);

    return session;
  } catch (error: any) {
    if (error?.code) {
      throw error;
    }

    throw createAuthError('SIGN_IN_FAILED', 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  }
}

async function handlePhoneSignIn(request: SignInRequest): Promise<AuthSession> {
  // TODO: Implement phone sign-in
  throw createAuthError('NOT_IMPLEMENTED', 'Phone sign-in not yet implemented');
}

async function handleEmailSignUp(request: SignUpRequest): Promise<AuthSession> {
  if (!request.email || !request.password) {
    throw createAuthError('INVALID_REQUEST', 'กรุณากรอกอีเมลและรหัสผ่าน');
  }

  if (!request.name?.trim()) {
    throw createAuthError('INVALID_REQUEST', 'กรุณากรอกชื่อสำหรับโปรไฟล์ของคุณ');
  }

  if (!request.acceptTerms) {
    throw createAuthError('TERMS_NOT_ACCEPTED', 'กรุณายอมรับข้อตกลงการใช้งาน');
  }

  const normalizedName = request.name.trim();
  const [firstName, ...rest] = normalizedName.split(/\s+/);
  const lastName = rest.join(' ') || firstName;
  const experienceLevel = request.profile?.experienceLevel ?? 'beginner';

  try {
    const session = await emailProvider.register({
      email: request.email,
      password: request.password,
      confirmPassword: request.password,
      firstName,
      lastName,
      acceptTerms: request.acceptTerms,
      newsletter: false,
    });

    session.user.name = normalizedName;
    session.user.profile.displayName = normalizedName;
    session.user.profile.experienceLevel = experienceLevel;

    await sessionManager.createSession(session);

    return session;
  } catch (error: any) {
    if (error?.code) {
      throw error;
    }

    throw createAuthError('SIGN_UP_FAILED', 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  }
}

async function handlePhoneSignUp(request: SignUpRequest): Promise<AuthSession> {
  // TODO: Implement phone sign-up
  throw createAuthError('NOT_IMPLEMENTED', 'Phone sign-up not yet implemented');
}

function createAuthError(code: string, message: string, details?: any): AuthError {
  return { code, message, details };
}

// Initialize auth store on app start
export const initializeAuth = async () => {
  try {
    await useAuthStore.getState().initialize();
  } catch (error) {
    console.error('Failed to initialize auth store:', error);
  }
};

export const __authTest = {
  handleEmailSignIn,
  handleEmailSignUp,
};
