import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { Alert } from 'react-native';

export interface ErrorReport {
  id: string;
  timestamp: string;
  type: ErrorType;
  code: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  userId?: string;
  deviceInfo: DeviceInfo;
  severity: ErrorSeverity;
  tags: Record<string, string>;
  handled: boolean;
}

export interface ErrorContext {
  screen?: string;
  action?: string;
  feature?: string;
  userAgent?: string;
  networkStatus?: string;
  additionalData?: Record<string, any>;
}

export interface DeviceInfo {
  platform: string;
  version: string;
  buildNumber?: string;
  manufacturer?: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
}

export type ErrorType =
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'api'
  | 'ui'
  | 'storage'
  | 'camera'
  | 'location'
  | 'payment'
  | 'crash'
  | 'unknown';

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export interface ErrorRecoveryStrategy {
  canRecover: boolean;
  recoveryActions: RecoveryAction[];
  userMessage: string;
  requiresUserAction: boolean;
}

export interface RecoveryAction {
  type: 'retry' | 'reload' | 'navigate' | 'logout' | 'refresh' | 'cache_clear' | 'restart';
  label: string;
  action: () => Promise<void>;
  isDestructive: boolean;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 100;
  private isOnline = true;

  private readonly STORAGE_KEYS = {
    ERROR_REPORTS: '@smart_plant_error_reports',
    ERROR_SETTINGS: '@smart_plant_error_settings',
    CRASH_REPORTS: '@smart_plant_crash_reports',
  };

  private readonly ERROR_MESSAGES = {
    th: {
      network: {
        offline: 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้ กรุณาตรวจสอบการเชื่อมต่อของคุณ',
        timeout: 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง',
        server_error: 'เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ในภายหลัง',
      },
      authentication: {
        invalid_credentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        session_expired: 'การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่',
        unauthorized: 'คุณไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้',
      },
      camera: {
        permission_denied: 'กรุณาอนุญาตการใช้กล้องในการตั้งค่า',
        camera_unavailable: 'ไม่สามารถเข้าถึงกล้องได้',
      },
      storage: {
        quota_exceeded: 'พื้นที่จัดเก็บเต็ม กรุณาลบข้อมูลเก่าออก',
        access_denied: 'ไม่สามารถเข้าถึงที่จัดเก็บข้อมูลได้',
      },
      general: {
        unknown_error: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
        try_again: 'กรุณาลองใหม่อีกครั้ง',
        contact_support: 'หากปัญหาคงอยู่ กรุณาติดต่อฝ่ายสนับสนุน',
      },
    },
    en: {
      network: {
        offline: 'No internet connection. Please check your connection.',
        timeout: 'Connection timeout. Please try again.',
        server_error: 'Server error. Please try again later.',
      },
      authentication: {
        invalid_credentials: 'Invalid email or password.',
        session_expired: 'Your session has expired. Please sign in again.',
        unauthorized: 'You do not have permission to access this feature.',
      },
      camera: {
        permission_denied: 'Please allow camera access in settings.',
        camera_unavailable: 'Camera is not available.',
      },
      storage: {
        quota_exceeded: 'Storage quota exceeded. Please free up space.',
        access_denied: 'Cannot access storage.',
      },
      general: {
        unknown_error: 'An unknown error occurred.',
        try_again: 'Please try again.',
        contact_support: 'If the problem persists, please contact support.',
      },
    },
  };

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  private constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Load persisted errors
    await this.loadPersistedErrors();

    // Upload pending errors if online
    if (this.isOnline) {
      this.uploadPendingErrors();
    }
  }

  private setupGlobalErrorHandlers(): void {
    // React Native global error handler
    const originalHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
      this.reportError(error, {
        type: 'crash',
        severity: isFatal ? 'fatal' : 'error',
        handled: false,
        context: {
          feature: 'global_error_handler',
        },
      });

      // Call original handler
      originalHandler(error, isFatal);
    });

    // Promise rejection handler
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      this.reportError(new Error(event.reason), {
        type: 'unknown',
        severity: 'error',
        handled: false,
        context: {
          feature: 'unhandled_promise_rejection',
        },
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', onUnhandledRejection);
    }
  }

  public reportError(
    error: Error,
    options: {
      type?: ErrorType;
      severity?: ErrorSeverity;
      context?: ErrorContext;
      tags?: Record<string, string>;
      handled?: boolean;
      userId?: string;
    } = {}
  ): string {
    const errorId = this.generateErrorId();

    const errorReport: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      type: options.type || this.inferErrorType(error),
      code: this.extractErrorCode(error),
      message: error.message,
      stack: error.stack,
      context: options.context || {},
      userId: options.userId,
      deviceInfo: this.getDeviceInfo(),
      severity: options.severity || 'error',
      tags: options.tags || {},
      handled: options.handled ?? true,
    };

    // Add to queue
    this.errorQueue.push(errorReport);

    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Report to Sentry if configured
    this.reportToSentry(errorReport);

    // Persist error
    this.persistError(errorReport);

    // Upload if online
    if (this.isOnline) {
      this.uploadError(errorReport);
    }

    console.error(`[ErrorHandling] ${errorReport.type}:${errorReport.code}`, error);

    return errorId;
  }

  public async handleError(
    error: Error,
    options: {
      showUserMessage?: boolean;
      context?: ErrorContext;
      language?: 'th' | 'en';
      autoRecover?: boolean;
    } = {}
  ): Promise<ErrorRecoveryStrategy> {
    const {
      showUserMessage = true,
      context = {},
      language = 'th',
      autoRecover = true,
    } = options;

    // Report the error
    const errorId = this.reportError(error, {
      context,
      severity: 'error',
      handled: true,
    });

    // Determine recovery strategy
    const recoveryStrategy = this.getRecoveryStrategy(error, context);

    // Show user message if requested
    if (showUserMessage) {
      const userMessage = this.getUserMessage(error, language);
      this.showErrorToUser(userMessage, recoveryStrategy, language);
    }

    // Attempt auto-recovery if enabled
    if (autoRecover && recoveryStrategy.canRecover && !recoveryStrategy.requiresUserAction) {
      try {
        await this.executeRecovery(recoveryStrategy);
      } catch (recoveryError) {
        console.error('Auto-recovery failed:', recoveryError);
      }
    }

    return recoveryStrategy;
  }

  private inferErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }

    if (message.includes('auth') || message.includes('unauthorized') || message.includes('login')) {
      return 'authentication';
    }

    if (message.includes('permission') || message.includes('access')) {
      return 'authorization';
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }

    if (message.includes('camera') || stack.includes('camera')) {
      return 'camera';
    }

    if (message.includes('storage') || message.includes('quota')) {
      return 'storage';
    }

    if (message.includes('api') || message.includes('endpoint')) {
      return 'api';
    }

    return 'unknown';
  }

  private extractErrorCode(error: Error): string {
    // Try to extract error code from error object
    const errorObj = error as any;

    if (errorObj.code) return errorObj.code;
    if (errorObj.status) return `HTTP_${errorObj.status}`;
    if (errorObj.name) return errorObj.name;

    // Extract from message
    const codeMatch = error.message.match(/code:\s*([A-Z_]+)/i);
    if (codeMatch) return codeMatch[1];

    return 'UNKNOWN_ERROR';
  }

  private getRecoveryStrategy(error: Error, context: ErrorContext): ErrorRecoveryStrategy {
    const errorType = this.inferErrorType(error);
    const errorCode = this.extractErrorCode(error);

    switch (errorType) {
      case 'network':
        return {
          canRecover: true,
          recoveryActions: [
            {
              type: 'retry',
              label: 'ลองใหม่',
              action: async () => {
                // Retry the failed operation
                console.log('Retrying network operation');
              },
              isDestructive: false,
            },
            {
              type: 'reload',
              label: 'รีโหลด',
              action: async () => {
                // Reload the current screen
                console.log('Reloading screen');
              },
              isDestructive: false,
            },
          ],
          userMessage: 'มีปัญหาการเชื่อมต่อ กรุณาลองใหม่',
          requiresUserAction: true,
        };

      case 'authentication':
        return {
          canRecover: true,
          recoveryActions: [
            {
              type: 'logout',
              label: 'เข้าสู่ระบบใหม่',
              action: async () => {
                // Trigger logout and redirect to login
                console.log('Logging out user');
              },
              isDestructive: true,
            },
          ],
          userMessage: 'กรุณาเข้าสู่ระบบใหม่',
          requiresUserAction: true,
        };

      case 'storage':
        return {
          canRecover: true,
          recoveryActions: [
            {
              type: 'cache_clear',
              label: 'ล้างข้อมูลชั่วคราว',
              action: async () => {
                // Clear app cache
                console.log('Clearing cache');
              },
              isDestructive: false,
            },
          ],
          userMessage: 'พื้นที่จัดเก็บเต็ม กรุณาล้างข้อมูล',
          requiresUserAction: true,
        };

      default:
        return {
          canRecover: false,
          recoveryActions: [
            {
              type: 'restart',
              label: 'รีสตาร์ทแอป',
              action: async () => {
                // Restart the app
                console.log('Restarting app');
              },
              isDestructive: true,
            },
          ],
          userMessage: 'เกิดข้อผิดพลาด กรุณารีสตาร์ทแอป',
          requiresUserAction: true,
        };
    }
  }

  private getUserMessage(error: Error, language: 'th' | 'en'): string {
    const errorType = this.inferErrorType(error);
    const messages = this.ERROR_MESSAGES[language];

    switch (errorType) {
      case 'network':
        if (error.message.includes('timeout')) {
          return messages.network.timeout;
        }
        return messages.network.offline;

      case 'authentication':
        if (error.message.includes('expired')) {
          return messages.authentication.session_expired;
        }
        return messages.authentication.invalid_credentials;

      case 'camera':
        if (error.message.includes('permission')) {
          return messages.camera.permission_denied;
        }
        return messages.camera.camera_unavailable;

      case 'storage':
        if (error.message.includes('quota')) {
          return messages.storage.quota_exceeded;
        }
        return messages.storage.access_denied;

      default:
        return messages.general.unknown_error;
    }
  }

  private showErrorToUser(
    message: string,
    recovery: ErrorRecoveryStrategy,
    language: 'th' | 'en'
  ): void {
    const buttons = recovery.recoveryActions.map(action => ({
      text: action.label,
      onPress: action.action,
      style: action.isDestructive ? 'destructive' : 'default' as any,
    }));

    buttons.push({
      text: language === 'th' ? 'ปิด' : 'Close',
      style: 'cancel' as any,
      onPress: () => {},
    });

    Alert.alert(
      language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error',
      message,
      buttons
    );
  }

  private async executeRecovery(strategy: ErrorRecoveryStrategy): Promise<void> {
    for (const action of strategy.recoveryActions) {
      try {
        await action.action();
        break; // Stop after first successful recovery
      } catch (error) {
        console.error(`Recovery action ${action.type} failed:`, error);
      }
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      platform: 'mobile',
      version: '1.0.0',
      // Add more device info as needed
    };
  }

  private reportToSentry(errorReport: ErrorReport): void {
    try {
      if (Sentry.getCurrentHub().getClient()) {
        Sentry.withScope(scope => {
          scope.setTag('errorType', errorReport.type);
          scope.setLevel(errorReport.severity);
          scope.setContext('errorContext', errorReport.context);

          if (errorReport.userId) {
            scope.setUser({ id: errorReport.userId });
          }

          Object.entries(errorReport.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });

          const error = new Error(errorReport.message);
          error.stack = errorReport.stack;

          Sentry.captureException(error);
        });
      }
    } catch (error) {
      console.warn('Failed to report to Sentry:', error);
    }
  }

  private async persistError(errorReport: ErrorReport): Promise<void> {
    try {
      const key = `${this.STORAGE_KEYS.ERROR_REPORTS}_${errorReport.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(errorReport));
    } catch (error) {
      console.warn('Failed to persist error:', error);
    }
  }

  private async loadPersistedErrors(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const errorKeys = keys.filter(key => key.startsWith(this.STORAGE_KEYS.ERROR_REPORTS));

      for (const key of errorKeys) {
        try {
          const errorData = await AsyncStorage.getItem(key);
          if (errorData) {
            const errorReport = JSON.parse(errorData);
            this.errorQueue.push(errorReport);
          }
        } catch (error) {
          console.warn(`Failed to load error from ${key}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted errors:', error);
    }
  }

  private async uploadError(errorReport: ErrorReport): Promise<void> {
    // Implementation would upload to your error tracking service
    console.log('Uploading error:', errorReport.id);
  }

  private async uploadPendingErrors(): Promise<void> {
    for (const errorReport of this.errorQueue) {
      try {
        await this.uploadError(errorReport);
      } catch (error) {
        console.warn('Failed to upload error:', error);
      }
    }
  }

  public setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;

    if (isOnline) {
      this.uploadPendingErrors();
    }
  }

  public getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    recentErrors: ErrorReport[];
  } {
    const errorsByType = this.errorQueue.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<ErrorType, number>);

    return {
      totalErrors: this.errorQueue.length,
      errorsByType,
      recentErrors: this.errorQueue.slice(-10),
    };
  }

  public async clearErrorReports(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const errorKeys = keys.filter(key => key.startsWith(this.STORAGE_KEYS.ERROR_REPORTS));

      await AsyncStorage.multiRemove(errorKeys);
      this.errorQueue = [];
    } catch (error) {
      console.warn('Failed to clear error reports:', error);
    }
  }
}