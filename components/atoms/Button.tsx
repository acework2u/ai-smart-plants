import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { haptic, useHaptic } from '../../core/haptics';
import { colors, getSpacing, spacing, radius, typography, sizes } from '../../core/theme';

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
}) => {
  const hapticService = useHaptic();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePress = async () => {
    if (disabled || loading) return;

    // Trigger haptic feedback
    const hapticVariant = hapticType || (variant === 'danger' ? 'primary' : variant);
    await hapticService.buttonPress(hapticVariant as 'primary' | 'secondary' | 'ghost');

    // Animation
    if (animated) {
      scale.value = withSpring(0.95, { duration: 100 }, () => {
        scale.value = withSpring(1, { duration: 100 });
      });
    }

    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const ButtonComponent = animated ? AnimatedTouchableOpacity : TouchableOpacity;

  return (
    <ButtonComponent
      style={[buttonStyles, animated && animatedStyle]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size={size === 'lg' ? 'large' : 'small'}
          color={
            variant === 'primary' || variant === 'danger'
              ? colors.white
              : colors.primary
          }
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

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.white,
    borderColor: colors.border.light,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },

  // Sizes
  sm: {
    ...sizes.button.sm,
    paddingVertical: getSpacing(2),
  },
  md: {
    ...sizes.button.md,
    paddingVertical: getSpacing(3),
  },
  lg: {
    ...sizes.button.lg,
    paddingVertical: getSpacing(4),
  },

  // Layout
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: getSpacing(2),
  },
  rightIcon: {
    marginLeft: getSpacing(2),
  },

  // Text styles
  text: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium as any,
    textAlign: 'center',
    includeFontPadding: false,
  },
  primaryText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
  },
  secondaryText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
  },
  ghostText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
  },
  dangerText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
  },

  // Size-specific text
  smText: {
    fontSize: typography.fontSize.sm,
  },
  mdText: {
    fontSize: typography.fontSize.base,
  },
  lgText: {
    fontSize: typography.fontSize.lg,
  },

  // Disabled states
  disabled: {
    opacity: 0.6,
    backgroundColor: colors.gray[200],
    borderColor: colors.gray[200],
  },
  disabledText: {
    color: colors.text.disabled,
  },
});

export default Button;