import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { AlertTriangle, RefreshCw, Mail, Bug } from 'lucide-react-native';
import { colors, typography, getSpacing, radius } from '../core/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'app' | 'screen' | 'component';
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    this.logError(error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Auto-reset after some time for component-level errors
    if (this.props.level === 'component') {
      this.resetTimeoutId = setTimeout(() => {
        this.handleReset();
      }, 5000) as unknown as number;
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys, children } = this.props;
    const { hasError } = this.state;

    const hasResetKeys = resetKeys && resetKeys.length > 0;
    const hasResetKeysChanged =
      hasResetKeys &&
      prevProps.resetKeys &&
      resetKeys.some((key, index) => key !== prevProps.resetKeys![index]);

    if (
      hasError &&
      (resetOnPropsChange || hasResetKeysChanged) &&
      (prevProps.children !== children || hasResetKeysChanged)
    ) {
      this.handleReset();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      platform: Platform.OS,
      version: Platform.Version,
      level: this.props.level || 'component',
      errorId: this.state.errorId,
    };

    // Log to console in development
    if (__DEV__) {
      console.error('🚨 Error Boundary Caught Error:', errorReport);
    }

    // In production, you would send this to your crash reporting service
    // Examples: Crashlytics, Sentry, Bugsnag, etc.
    this.reportToAnalytics(errorReport);
  };

  private reportToAnalytics = (errorReport: any) => {
    try {
      // This is where you would integrate with your analytics/crash reporting service
      // For now, we'll just log it
      if (!__DEV__) {
        // Example: Crashlytics.recordError(errorReport);
        // Example: Sentry.captureException(errorReport);
        console.log('📊 Error reported to analytics:', errorReport.errorId);
      }
    } catch (reportingError) {
      console.error('Failed to report error to analytics:', reportingError);
    }
  };

  private handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleSendReport = () => {
    const { error, errorInfo, errorId } = this.state;

    if (!error) return;

    const reportText = `
Error Report (ID: ${errorId})
Time: ${new Date().toLocaleString()}
Platform: ${Platform.OS} ${Platform.Version}

Error: ${error.name}
Message: ${error.message}

Stack Trace:
${error.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}
    `.trim();

    // Show options for reporting
    Alert.alert(
      'Send Error Report',
      'Would you like to send this error report to help us fix the issue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy Report',
          onPress: () => {
            // In a real app, you'd copy to clipboard
            Alert.alert('Report Copied', 'Error report copied to clipboard');
          },
        },
        {
          text: 'Send Email',
          onPress: () => {
            // In a real app, you'd open email client
            Alert.alert('Email Client', 'Opening email client...');
          },
        },
      ]
    );
  };

  private getErrorMessage = (): string => {
    const { error } = this.state;
    const { level } = this.props;

    if (!error) return 'An unknown error occurred';

    switch (level) {
      case 'app':
        return 'The app has encountered a critical error and needs to restart.';
      case 'screen':
        return 'This screen has encountered an error. Please try refreshing.';
      case 'component':
        return 'A component has failed to load properly.';
      default:
        return error.message || 'Something went wrong.';
    }
  };

  private renderErrorUI = () => {
    const { level } = this.props;
    const { error, errorId } = this.state;
    const errorMessage = this.getErrorMessage();

    const isAppLevel = level === 'app';
    const isScreenLevel = level === 'screen';
    const isComponentLevel = level === 'component';

    return (
      <View style={[
        styles.container,
        isComponentLevel && styles.componentContainer,
        isScreenLevel && styles.screenContainer,
        isAppLevel && styles.appContainer,
      ]}>
        <View style={styles.content}>
          {/* Error Icon */}
          <View style={styles.iconContainer}>
            <AlertTriangle
              size={isComponentLevel ? 32 : isScreenLevel ? 48 : 64}
              color={colors.error}
            />
          </View>

          {/* Error Message */}
          <Text style={[
            styles.title,
            isComponentLevel && styles.componentTitle,
            isScreenLevel && styles.screenTitle,
            isAppLevel && styles.appTitle,
          ]}>
            Oops! Something went wrong
          </Text>

          <Text style={[
            styles.message,
            isComponentLevel && styles.componentMessage,
          ]}>
            {errorMessage}
          </Text>

          {/* Error Details (Development Only) */}
          {__DEV__ && error && (
            <ScrollView style={styles.errorDetails} showsVerticalScrollIndicator={false}>
              <Text style={styles.errorDetailsTitle}>Error Details (Dev Mode):</Text>
              <Text style={styles.errorDetailsText}>
                {error.name}: {error.message}
              </Text>
              {error.stack && (
                <Text style={styles.errorDetailsText}>
                  {error.stack}
                </Text>
              )}
            </ScrollView>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <RefreshCw size={18} color={colors.white} />
              <Text style={styles.primaryButtonText}>
                {isAppLevel ? 'Restart App' : 'Try Again'}
              </Text>
            </TouchableOpacity>

            {!isComponentLevel && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleSendReport}
                activeOpacity={0.8}
              >
                <Bug size={18} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>
                  Report Issue
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Error ID */}
          {errorId && (
            <Text style={styles.errorId}>
              Error ID: {errorId}
            </Text>
          )}
        </View>
      </View>
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(4),
  },
  componentContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    margin: getSpacing(2),
    minHeight: 120,
  },
  screenContainer: {
    backgroundColor: colors.background.primary,
  },
  appContainer: {
    backgroundColor: colors.error + '10',
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: getSpacing(4),
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: getSpacing(3),
  },
  componentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  appTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
  },
  message: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: getSpacing(6),
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
  componentMessage: {
    fontSize: typography.fontSize.sm,
    marginBottom: getSpacing(4),
  },
  errorDetails: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.md,
    padding: getSpacing(3),
    marginBottom: getSpacing(4),
    maxHeight: 200,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
    marginBottom: getSpacing(2),
  },
  errorDetailsText: {
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.text.secondary,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: getSpacing(3),
    marginBottom: getSpacing(4),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getSpacing(4),
    paddingVertical: getSpacing(3),
    borderRadius: radius.lg,
    gap: getSpacing(2),
    minWidth: 120,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.white,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
  errorId: {
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

// HOC for wrapping components with error boundaries
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, T>((props, ref) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for error reporting from functional components
export function useErrorHandler() {
  const reportError = React.useCallback((error: Error, errorInfo?: any) => {
    // This would integrate with your error reporting service
    console.error('🚨 Error reported from useErrorHandler:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return { reportError };
}

export default ErrorBoundary;