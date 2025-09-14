import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PlantStatus } from '../../types/garden';
import { useHaptic } from '../../core/haptics';
import { colors, getSpacing, radius, spacing, typography, themeUtils } from '../../core/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export interface ChipProps {
  text?: string;
  label?: string; // For backward compatibility
  status?: PlantStatus;
  variant?: 'status' | 'filter' | 'action' | 'outline' | 'solid';
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'sm' | 'md' | 'lg';
  color?: string;
  animated?: boolean;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  text,
  label, // For backward compatibility
  status,
  variant = 'filter',
  selected = false,
  onPress,
  style,
  textStyle,
  size = 'md',
  color,
  animated = true,
  icon,
}) => {
  const haptic = useHaptic();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Use text if provided, otherwise fall back to label
  const displayText = text || label || '';

  // Normalize size prop
  const normalizedSize = size === 'small' ? 'sm' : size;

  const handlePress = async () => {
    if (!onPress) return;

    await haptic.selection();

    // Animation
    if (animated) {
      scale.value = withSpring(0.9, { duration: 100 }, () => {
        scale.value = withSpring(1, { duration: 100 });
      });
    }

    onPress();
  };

  const getStatusColors = () => {
    if (!status) return { background: colors.gray[100], text: colors.text.primary, border: 'transparent' };

    const statusColor = themeUtils.getStatusColor(status);
    return {
      background: themeUtils.withOpacity(statusColor, 0.15),
      text: statusColor,
      border: statusColor,
    };
  };

  const getVariantStyles = () => {
    if (color) {
      switch (variant) {
        case 'outline':
          return {
            backgroundColor: 'transparent',
            borderColor: color,
            borderWidth: 1,
            color,
          };
        case 'solid':
          return {
            backgroundColor: color,
            borderColor: color,
            borderWidth: 0,
            color: colors.white,
          };
        default:
          return {
            backgroundColor: themeUtils.withOpacity(color, 0.15),
            borderColor: 'transparent',
            borderWidth: 0,
            color,
          };
      }
    }

    switch (variant) {
      case 'status':
        const statusColors = getStatusColors();
        return {
          backgroundColor: statusColors.background,
          borderColor: statusColors.border,
          borderWidth: 0,
          color: statusColors.text,
        };

      case 'filter':
        return selected
          ? {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
              borderWidth: 0,
              color: colors.white,
            }
          : {
              backgroundColor: colors.gray[100],
              borderColor: colors.border.light,
              borderWidth: 1,
              color: colors.text.secondary,
            };

      case 'action':
        return {
          backgroundColor: colors.primarySoft,
          borderColor: colors.primary,
          borderWidth: 0,
          color: colors.primary,
        };

      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border.medium,
          borderWidth: 1,
          color: colors.text.primary,
        };

      case 'solid':
        return {
          backgroundColor: colors.gray[200],
          borderColor: colors.gray[200],
          borderWidth: 0,
          color: colors.text.primary,
        };

      default:
        return {
          backgroundColor: colors.gray[100],
          borderColor: 'transparent',
          borderWidth: 0,
          color: colors.text.secondary,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const chipStyles = [
    styles.base,
    styles[normalizedSize],
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
    },
    style,
  ];

  const chipTextStyles = [
    styles.text,
    styles[`${normalizedSize}Text`],
    {
      color: variantStyles.color,
    },
    textStyle,
  ];

  const ChipComponent = onPress && animated ? AnimatedTouchableOpacity : onPress ? TouchableOpacity : View;

  return (
    <ChipComponent
      style={[chipStyles, animated && onPress && animatedStyle]}
      onPress={onPress ? handlePress : undefined}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={styles.content}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={chipTextStyles}>{displayText}</Text>
      </View>
    </ChipComponent>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },

  // Layout
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: getSpacing(1),
  },

  // Sizes
  sm: {
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1),
    minHeight: 24,
  },
  md: {
    paddingHorizontal: getSpacing(3),
    paddingVertical: getSpacing(1.5),
    minHeight: 32,
  },
  lg: {
    paddingHorizontal: getSpacing(4),
    paddingVertical: getSpacing(2),
    minHeight: 40,
  },

  // Text styles
  text: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium as any,
    textAlign: 'center',
    includeFontPadding: false,
  },
  smText: {
    fontSize: typography.fontSize.xs,
  },
  mdText: {
    fontSize: typography.fontSize.sm,
  },
  lgText: {
    fontSize: typography.fontSize.base,
  },
});

export default Chip;