import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { useHaptic } from '../../core/haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { radius, typography, sizes } from '../../core/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticType?: 'primary' | 'secondary' | 'ghost';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  animated?: boolean;
  fullWidth?: boolean;
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link';
  // Enhanced animation props
  pressAnimationType?: 'scale' | 'opacity' | 'both';
  rippleEffect?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  hapticType,
  leftIcon,
  rightIcon,
  animated = true,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  pressAnimationType = 'both',
  rippleEffect = true,
}) => {
  const { theme } = useTheme();
  const hapticService = useHaptic();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  const triggerRipple = () => {
    if (rippleEffect && animated) {
      rippleScale.value = 0;
      rippleOpacity.value = 0.3;

      rippleScale.value = withTiming(1, { duration: 400 });
      rippleOpacity.value = withTiming(0, { duration: 400 });
    }
  };

  const handlePress = async () => {
    if (disabled || loading) return;

    // Trigger haptic feedback
    const hapticVariant = hapticType || (variant === 'danger' ? 'primary' : variant);
    await hapticService.buttonPress(hapticVariant as 'primary' | 'secondary' | 'ghost');

    // Enhanced animations
    if (animated) {
      // Trigger ripple directly in JS (no need for runOnJS)
      triggerRipple();

      if (pressAnimationType === 'scale' || pressAnimationType === 'both') {
        scale.value = withSpring(0.95, { duration: 150, dampingRatio: 0.6 }, () => {
          scale.value = withSpring(1, { duration: 150, dampingRatio: 0.6 });
        });
      }

      if (pressAnimationType === 'opacity' || pressAnimationType === 'both') {
        opacity.value = withTiming(0.8, { duration: 100 }, () => {
          opacity.value = withTiming(1, { duration: 100 });
        });
      }
    }

    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const rippleAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      rippleScale.value,
      [0, 1],
      [0, 2],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity: rippleOpacity.value,
    };
  });

  const buttonStyles = [
    styles.base,
    getVariantStyles(variant, theme),
    getSizeStyles(size, theme),
    fullWidth && styles.fullWidth,
    disabled && getDisabledStyles(theme),
    style,
  ];

  const textStyles = [
    styles.text,
    getVariantTextStyles(variant, theme),
    getSizeTextStyles(size, theme),
    disabled && getDisabledTextStyles(theme),
    textStyle,
  ];

  const ButtonComponent = animated ? AnimatedTouchableOpacity : TouchableOpacity;

  return (
    <ButtonComponent
      style={[buttonStyles, animated && animatedStyle]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={animated ? 1 : 0.8}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {/* Ripple Effect */}
      {rippleEffect && animated && (
        <Animated.View
          style={[
            styles.ripple,
            {
              backgroundColor: getRippleColor(variant, theme),
            },
            rippleAnimatedStyle,
          ]}
          pointerEvents="none"
        />
      )}

      {loading ? (
        <ActivityIndicator
          size={size === 'lg' ? 'large' : 'small'}
          color={getLoadingColor(variant, theme)}
          accessibilityLabel="Loading"
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text style={textStyles}>{title}</Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </ButtonComponent>
  );
};

// Helper functions for theme-aware styling
const getVariantStyles = (variant: string, theme: any) => {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      };
    case 'secondary':
      return {
        backgroundColor: theme.colors.surface.primary,
        borderColor: theme.colors.border,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      };
    case 'danger':
      return {
        backgroundColor: theme.colors.error,
        borderColor: theme.colors.error,
      };
    default:
      return {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      };
  }
};

const getSizeStyles = (size: string, theme: any) => {
  const spacing = theme.spacing;
  switch (size) {
    case 'sm':
      return {
        ...sizes.button.sm,
        paddingVertical: spacing(2),
        minHeight: 36,
      };
    case 'md':
      return {
        ...sizes.button.md,
        paddingVertical: spacing(3),
        minHeight: 44,
      };
    case 'lg':
      return {
        ...sizes.button.lg,
        paddingVertical: spacing(4),
        minHeight: 52,
      };
    default:
      return {
        ...sizes.button.md,
        paddingVertical: spacing(3),
        minHeight: 44,
      };
  }
};

const getVariantTextStyles = (variant: string, theme: any) => {
  switch (variant) {
    case 'primary':
    case 'danger':
      return { color: theme.colors.white };
    case 'secondary':
      return { color: theme.colors.text.primary };
    case 'ghost':
      return { color: theme.colors.primary };
    default:
      return { color: theme.colors.white };
  }
};

const getSizeTextStyles = (size: string, theme: any) => {
  switch (size) {
    case 'sm':
      return { fontSize: typography.fontSize.sm };
    case 'md':
      return { fontSize: typography.fontSize.base };
    case 'lg':
      return { fontSize: typography.fontSize.lg };
    default:
      return { fontSize: typography.fontSize.base };
  }
};

const getDisabledStyles = (theme: any) => ({
  opacity: 0.6,
  backgroundColor: theme.colors.surface.disabled,
  borderColor: theme.colors.surface.disabled,
});

const getDisabledTextStyles = (theme: any) => ({
  color: theme.colors.text.disabled,
});

const getRippleColor = (variant: string, theme: any) => {
  switch (variant) {
    case 'primary':
    case 'danger':
      return theme.colors.white;
    case 'secondary':
    case 'ghost':
      return theme.colors.primary;
    default:
      return theme.colors.white;
  }
};

const getLoadingColor = (variant: string, theme: any) => {
  switch (variant) {
    case 'primary':
    case 'danger':
      return theme.colors.white;
    case 'secondary':
    case 'ghost':
      return theme.colors.primary;
    default:
      return theme.colors.white;
  }
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium as any,
    textAlign: 'center',
    includeFontPadding: false,
  },
  ripple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: -10,
    marginLeft: -10,
  },
});

export default Button;

// Enhanced Button variants for specific use cases
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="primary" />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="secondary" />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="ghost" />
);

export const DangerButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="danger" />
);
