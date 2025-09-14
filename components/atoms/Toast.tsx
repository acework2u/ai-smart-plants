import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react-native';
import { colors, typography, radius, shadows, spacing } from '../../core/theme';
import { useHaptic } from '../../core/haptics';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
}

interface ToastProps extends ToastConfig {
  visible: boolean;
  onHide: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_HEIGHT = 80;
const ANIMATION_DURATION = 300;

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  action,
  visible,
  onHide,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const [animatedValue] = useState(new Animated.Value(0));

  // Toast configuration based on type
  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.success,
          icon: CheckCircle,
          hapticType: 'success' as const,
        };
      case 'error':
        return {
          backgroundColor: colors.error,
          icon: AlertCircle,
          hapticType: 'error' as const,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          icon: AlertTriangle,
          hapticType: 'warning' as const,
        };
      case 'info':
        return {
          backgroundColor: colors.info,
          icon: Info,
          hapticType: 'light' as const,
        };
      default:
        return {
          backgroundColor: colors.gray[700],
          icon: Info,
          hapticType: 'light' as const,
        };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback when showing
      haptic.trigger(config.hapticType);

      // Animate in
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        handleHide();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Animate out
      Animated.spring(animatedValue, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible, duration]);

  const handleHide = () => {
    haptic.trigger('light');
    onHide();
    onDismiss?.();
  };

  const handleActionPress = () => {
    if (action) {
      haptic.buttonPress('secondary');
      action.onPress();
      handleHide();
    }
  };

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0),
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.toast, { backgroundColor: config.backgroundColor }]}>
        <View style={styles.iconContainer}>
          <Icon size={24} color={colors.white} strokeWidth={2} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {message && (
            <Text style={styles.message} numberOfLines={2}>
              {message}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          {action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleActionPress}
              activeOpacity={0.7}
            >
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleHide}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={colors.white} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// Toast Manager Component
interface ToastManagerProps {
  toasts: ToastConfig[];
  onRemove: (id: string) => void;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts, onRemove }) => {
  return (
    <>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          {...toast}
          visible={true}
          onHide={() => onRemove(toast.id)}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    zIndex: 1000,
    elevation: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    minHeight: TOAST_HEIGHT,
    ...shadows.lg,
  },
  iconContainer: {
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
    marginRight: spacing[2],
  },
  title: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    fontFamily: typography.fontFamily.medium,
    lineHeight: typography.fontSize.base * 1.2,
  },
  message: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal as any,
    fontFamily: typography.fontFamily.regular,
    lineHeight: typography.fontSize.sm * 1.3,
    marginTop: spacing[1] / 2,
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginRight: spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.md,
  },
  actionText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    fontFamily: typography.fontFamily.medium,
  },
  closeButton: {
    padding: spacing[2],
  },
});

export default Toast;