import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { haptic } from '../../core/haptics';
import { colors, getSpacing, spacing, radius, typography, sizes } from '../../core/theme';

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
}) => {
  const handlePress = async () => {
    if (disabled || loading) return;

    // Trigger haptic feedback
    const hapticVariant = hapticType || variant;
    await haptic(hapticVariant === 'primary' ? 'medium' : 'light');

    onPress();
  };

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
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

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.white : colors.primary}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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

  // Text styles
  text: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
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