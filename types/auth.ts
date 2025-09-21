export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phoneNumber?: string;
  joinDate: string;
  provider: AuthProvider;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profile: UserProfile;
  preferences: UserPreferences;
}

export interface UserProfile {
  displayName: string;
  bio?: string;
  location?: string;
  gardenCount: number;
  totalPlants: number;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  favoriteCategories: string[];
}

export interface UserPreferences {
  language: 'th' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  haptics: boolean;
  biometricAuth: boolean;
  units: {
    volume: 'ml' | 'ล.';
    weight: 'g' | 'kg';
    temperature: 'celsius' | 'fahrenheit';
  };
  privacy: {
    personalizedTips: boolean;
    analytics: boolean;
    crashReporting: boolean;
  };
}

export type AuthProvider = 'google' | 'apple' | 'facebook' | 'email' | 'phone';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  idToken?: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
  isActive: boolean;
  lastActivity: string;
  deviceInfo: {
    deviceId: string;
    platform: string;
    version: string;
    model?: string;
  };
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface SignInRequest {
  provider: AuthProvider;
  email?: string;
  password?: string;
  phoneNumber?: string;
  verificationCode?: string;
  rememberMe?: boolean;
}

export interface SignUpRequest {
  provider: AuthProvider;
  email?: string;
  password?: string;
  phoneNumber?: string;
  name: string;
  acceptTerms: boolean;
  profile?: Partial<UserProfile>;
}

export interface OAuthProvider {
  id: AuthProvider;
  name: string;
  icon: string;
  isEnabled: boolean;
  config: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
    responseType: 'code' | 'token';
  };
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}

export interface AuthActions {
  signIn: (request: SignInRequest) => Promise<AuthSession>;
  signUp: (request: SignUpRequest) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<AuthTokens>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<User>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<User>;
  verifyEmail: (code: string) => Promise<boolean>;
  verifyPhone: (code: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  deleteAccount: () => Promise<void>;
}

export interface BiometricConfig {
  enabled: boolean;
  promptTitle: string;
  promptSubtitle: string;
  promptDescription: string;
  fallbackTitle: string;
  negativeText: string;
}