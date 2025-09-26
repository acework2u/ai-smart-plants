import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthError } from '../../types/auth';

export interface BiometricCapabilities {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  securityLevel: LocalAuthentication.SecurityLevel;
  hasHardware: boolean;
}

export interface BiometricAuthOptions {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
  requireConfirmation?: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  authenticationType?: LocalAuthentication.AuthenticationType;
  warning?: string;
  error?: string;
}

export interface StoredBiometricData {
  userId: string;
  email: string;
  hashedCredentials: string;
  enrolledAt: string;
  lastUsed: string;
  deviceId: string;
}

export class BiometricAuthProvider {
  private static instance: BiometricAuthProvider;

  private readonly STORAGE_KEYS = {
    BIOMETRIC_ENABLED: '@smart_plant_biometric_enabled',
    BIOMETRIC_DATA: '@smart_plant_biometric_data',
    BIOMETRIC_SETTINGS: '@smart_plant_biometric_settings',
  };

  private readonly DEFAULT_OPTIONS: BiometricAuthOptions = {
    promptMessage: 'ใช้ลายนิ้วมือหรือ Face ID เพื่อเข้าสู่ระบบ',
    cancelLabel: 'ยกเลิก',
    fallbackLabel: 'ใช้รหัสผ่าน',
    disableDeviceFallback: false,
    requireConfirmation: true,
  };

  public static getInstance(): BiometricAuthProvider {
    if (!BiometricAuthProvider.instance) {
      BiometricAuthProvider.instance = new BiometricAuthProvider();
    }
    return BiometricAuthProvider.instance;
  }

  private constructor() {
    // Initialize biometric provider
  }

  public async getBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
      const supportedTypes = hasHardware ? await LocalAuthentication.supportedAuthenticationTypesAsync() : [];
      const securityLevel = hasHardware ? await LocalAuthentication.getEnrolledLevelAsync() : LocalAuthentication.SecurityLevel.NONE;

      return {
        isAvailable: hasHardware && isEnrolled,
        isEnrolled,
        supportedTypes,
        securityLevel,
        hasHardware,
      };
    } catch (error) {
      console.error('Failed to get biometric capabilities:', error);
      return {
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
        securityLevel: LocalAuthentication.SecurityLevel.NONE,
        hasHardware: false,
      };
    }
  }

  public async authenticateWithBiometrics(options?: BiometricAuthOptions): Promise<BiometricAuthResult> {
    try {
      const capabilities = await this.getBiometricCapabilities();

      if (!capabilities.isAvailable) {
        throw this.createAuthError(
          'BIOMETRIC_NOT_AVAILABLE',
          'Biometric authentication is not available on this device'
        );
      }

      const authOptions = { ...this.DEFAULT_OPTIONS, ...options };

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: authOptions.promptMessage,
        cancelLabel: authOptions.cancelLabel,
        fallbackLabel: authOptions.fallbackLabel,
        disableDeviceFallback: authOptions.disableDeviceFallback,
        requireConfirmation: authOptions.requireConfirmation,
      });

      if (result.success) {
        // Update last used timestamp
        await this.updateLastUsedTimestamp();

        return {
          success: true,
          authenticationType: result.authenticationType,
        };
      } else {
        let errorCode = 'BIOMETRIC_FAILED';
        let errorMessage = 'Biometric authentication failed';

        if (result.error === 'user_cancel') {
          errorCode = 'USER_CANCELLED';
          errorMessage = 'User cancelled biometric authentication';
        } else if (result.error === 'user_fallback') {
          errorCode = 'USER_FALLBACK';
          errorMessage = 'User chose to use fallback authentication';
        } else if (result.error === 'system_cancel') {
          errorCode = 'SYSTEM_CANCELLED';
          errorMessage = 'System cancelled biometric authentication';
        } else if (result.error === 'too_many_attempts') {
          errorCode = 'TOO_MANY_ATTEMPTS';
          errorMessage = 'Too many failed biometric attempts';
        } else if (result.error === 'not_enrolled') {
          errorCode = 'NOT_ENROLLED';
          errorMessage = 'No biometrics enrolled on device';
        } else if (result.error === 'passcode_not_set') {
          errorCode = 'PASSCODE_NOT_SET';
          errorMessage = 'Device passcode not set';
        }

        throw this.createAuthError(errorCode, errorMessage, { originalError: result.error });
      }
    } catch (error: any) {
      console.error('Biometric authentication error:', error);

      if (error.code) {
        throw error;
      }

      throw this.createAuthError(
        'BIOMETRIC_ERROR',
        'An error occurred during biometric authentication'
      );
    }
  }

  public async enableBiometricAuth(userId: string, email: string, hashedCredentials: string): Promise<void> {
    try {
      const capabilities = await this.getBiometricCapabilities();

      if (!capabilities.isAvailable) {
        throw this.createAuthError(
          'BIOMETRIC_NOT_AVAILABLE',
          'Cannot enable biometric authentication - not available on this device'
        );
      }

      // Test biometric authentication first
      const authResult = await this.authenticateWithBiometrics({
        promptMessage: 'ยืนยันการตั้งค่าการเข้าสู่ระบบด้วยลายนิ้วมือ',
      });

      if (!authResult.success) {
        throw this.createAuthError(
          'BIOMETRIC_SETUP_FAILED',
          'Failed to set up biometric authentication'
        );
      }

      // Store biometric data securely
      const biometricData: StoredBiometricData = {
        userId,
        email,
        hashedCredentials,
        enrolledAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        deviceId: await this.getDeviceId(),
      };

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await SecureStore.setItemAsync(
          this.STORAGE_KEYS.BIOMETRIC_DATA,
          JSON.stringify(biometricData),
          {
            requireAuthentication: true,
            authenticationPrompt: 'ยืนยันตัวตนเพื่อจัดเก็บข้อมูลการเข้าสู่ระบบ',
          }
        );
      }

      // Mark biometric auth as enabled
      await this.setBiometricEnabled(true);

      console.log('Biometric authentication enabled successfully');
    } catch (error: any) {
      console.error('Failed to enable biometric auth:', error);

      if (error.code) {
        throw error;
      }

      throw this.createAuthError('BIOMETRIC_ENABLE_FAILED', 'Failed to enable biometric authentication');
    }
  }

  public async disableBiometricAuth(): Promise<void> {
    try {
      // Remove stored biometric data
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await SecureStore.deleteItemAsync(this.STORAGE_KEYS.BIOMETRIC_DATA);
      }

      // Mark biometric auth as disabled
      await this.setBiometricEnabled(false);

      console.log('Biometric authentication disabled successfully');
    } catch (error) {
      console.error('Failed to disable biometric auth:', error);
      throw this.createAuthError('BIOMETRIC_DISABLE_FAILED', 'Failed to disable biometric authentication');
    }
  }

  public async isBiometricEnabled(): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        return false;
      }

      const enabled = await SecureStore.getItemAsync(this.STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } catch (error) {
      console.warn('Failed to check biometric enabled status:', error);
      return false;
    }
  }

  public async getStoredBiometricData(): Promise<StoredBiometricData | null> {
    try {
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        return null;
      }

      const stored = await SecureStore.getItemAsync(this.STORAGE_KEYS.BIOMETRIC_DATA, {
        requireAuthentication: true,
        authenticationPrompt: 'ยืนยันตัวตนเพื่อเข้าถึงข้อมูลการเข้าสู่ระบบ',
      });

      if (!stored) {
        return null;
      }

      return JSON.parse(stored);
    } catch (error: any) {
      console.error('Failed to get stored biometric data:', error);

      // If user cancelled authentication, return null instead of throwing
      if (error.message?.includes('UserCancel') || error.message?.includes('Authentication was canceled')) {
        return null;
      }

      throw this.createAuthError('BIOMETRIC_DATA_ACCESS_FAILED', 'Failed to access stored biometric data');
    }
  }

  public async authenticateAndGetStoredData(options?: BiometricAuthOptions): Promise<StoredBiometricData | null> {
    try {
      // First check if biometric auth is enabled
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return null;
      }

      // Authenticate with biometrics
      const authResult = await this.authenticateWithBiometrics(options);
      if (!authResult.success) {
        return null;
      }

      // Get stored data
      return await this.getStoredBiometricData();
    } catch (error: any) {
      console.error('Failed to authenticate and get stored data:', error);

      // Don't throw for user cancellation
      if (error.code === 'USER_CANCELLED' || error.code === 'USER_FALLBACK') {
        return null;
      }

      throw error;
    }
  }

  public getBiometricTypeDisplayName(type: LocalAuthentication.AuthenticationType): string {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'ลายนิ้วมือ';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'Face ID';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Iris';
      default:
        return 'การยืนยันตัวตน';
    }
  }

  public getSecurityLevelDisplayName(level: LocalAuthentication.SecurityLevel): string {
    switch (level) {
      case LocalAuthentication.SecurityLevel.NONE:
        return 'ไม่มี';
      case LocalAuthentication.SecurityLevel.SECRET:
        return 'ปลอดภัย';
      case LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK:
        return 'ระดับพื้นฐาน';
      case LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG:
        return 'ระดับสูง';
      default:
        return 'ไม่ทราบ';
    }
  }

  public async checkBiometricChanges(): Promise<{
    hasChanged: boolean;
    shouldReEnroll: boolean;
    reason?: string;
  }> {
    try {
      const capabilities = await this.getBiometricCapabilities();
      const storedData = await this.getStoredBiometricData();

      if (!storedData) {
        return { hasChanged: false, shouldReEnroll: false };
      }

      // Check if biometrics are still available
      if (!capabilities.isAvailable) {
        return {
          hasChanged: true,
          shouldReEnroll: true,
          reason: 'Biometric authentication is no longer available on this device',
        };
      }

      // Check if device ID has changed (new device or reset)
      const currentDeviceId = await this.getDeviceId();
      if (storedData.deviceId !== currentDeviceId) {
        return {
          hasChanged: true,
          shouldReEnroll: true,
          reason: 'Device configuration has changed',
        };
      }

      // Check if biometric data is too old (e.g., older than 30 days)
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const enrolledTime = new Date(storedData.enrolledAt).getTime();
      if (Date.now() - enrolledTime > thirtyDaysMs) {
        return {
          hasChanged: true,
          shouldReEnroll: false,
          reason: 'Biometric data is old and should be refreshed',
        };
      }

      return { hasChanged: false, shouldReEnroll: false };
    } catch (error) {
      console.error('Failed to check biometric changes:', error);
      return {
        hasChanged: true,
        shouldReEnroll: true,
        reason: 'Unable to verify biometric configuration',
      };
    }
  }

  private async setBiometricEnabled(enabled: boolean): Promise<void> {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await SecureStore.setItemAsync(this.STORAGE_KEYS.BIOMETRIC_ENABLED, enabled.toString());
    }
  }

  private async updateLastUsedTimestamp(): Promise<void> {
    try {
      const storedData = await this.getStoredBiometricData();
      if (storedData) {
        storedData.lastUsed = new Date().toISOString();

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          await SecureStore.setItemAsync(
            this.STORAGE_KEYS.BIOMETRIC_DATA,
            JSON.stringify(storedData),
            {
              requireAuthentication: true,
              authenticationPrompt: 'อัพเดทข้อมูลการใช้งาน',
            }
          );
        }
      }
    } catch (error) {
      console.warn('Failed to update last used timestamp:', error);
    }
  }

  private async getDeviceId(): Promise<string> {
    // Generate a simple device identifier
    // In production, you might want to use expo-device or expo-application
    return `device_${Platform.OS}_${Date.now().toString(36)}`;
  }

  private createAuthError(code: string, message: string, details?: any): AuthError {
    return {
      code,
      message,
      details,
    };
  }

  public async canUseBiometrics(): Promise<{
    canUse: boolean;
    reason?: string;
    capabilities: BiometricCapabilities;
  }> {
    const capabilities = await this.getBiometricCapabilities();

    if (!capabilities.hasHardware) {
      return {
        canUse: false,
        reason: 'Device does not support biometric authentication',
        capabilities,
      };
    }

    if (!capabilities.isEnrolled) {
      return {
        canUse: false,
        reason: 'No biometrics enrolled on device',
        capabilities,
      };
    }

    if (capabilities.securityLevel === LocalAuthentication.SecurityLevel.NONE) {
      return {
        canUse: false,
        reason: 'Device does not meet security requirements',
        capabilities,
      };
    }

    return {
      canUse: true,
      capabilities,
    };
  }

  public async getBiometricSettings(): Promise<{
    enabled: boolean;
    lastUsed?: string;
    enrolledAt?: string;
    supportedTypes: string[];
    securityLevel: string;
  }> {
    const capabilities = await this.getBiometricCapabilities();
    const isEnabled = await this.isBiometricEnabled();
    const storedData = isEnabled ? await this.getStoredBiometricData() : null;

    return {
      enabled: isEnabled,
      lastUsed: storedData?.lastUsed,
      enrolledAt: storedData?.enrolledAt,
      supportedTypes: capabilities.supportedTypes.map(type => this.getBiometricTypeDisplayName(type)),
      securityLevel: this.getSecurityLevelDisplayName(capabilities.securityLevel),
    };
  }
}