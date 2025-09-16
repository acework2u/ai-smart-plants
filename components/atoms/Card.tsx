import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useHaptic } from '../../core/haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { radius, shadows } from '../../core/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'flat';
  style?: StyleProp<ViewStyle>;
  padding?: number;
  hapticFeedback?: boolean;
  // Enhanced animation props
  animated?: boolean;
  pressScale?: number;
  pressOpacity?: number;
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'text' | 'none';
  // Shadow customization
  shadowLevel?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  style,
  padding,
  hapticFeedback = true,
  animated = true,
  pressScale = 0.98,
  pressOpacity = 0.9,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  shadowLevel,
}) => {
  const { theme } = useTheme();
  const hapticService = useHaptic();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePress = async () => {
    if (!onPress) return;

    if (hapticFeedback) {
      await hapticService.itemSelected();
    }

    if (animated) {
      scale.value = withSpring(pressScale, { duration: 150 }, () => {
        scale.value = withSpring(1, { duration: 150 });
      });

      opacity.value = withTiming(pressOpacity, { duration: 100 }, () => {
        opacity.value = withTiming(1, { duration: 100 });
      });
    }

    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const defaultPadding = theme.spacing(4);
  const cardStyles = [
    styles.base,
    getVariantStyles(variant, theme, shadowLevel),
    { padding: padding !== undefined ? padding : defaultPadding },
    style,
  ];

  if (onPress) {
    const Component = animated ? AnimatedTouchableOpacity : TouchableOpacity;
    return (
      <Component
        style={[cardStyles, animated && animatedStyle]}
        onPress={handlePress}
        activeOpacity={animated ? 1 : 0.9}
        accessible={true}
        accessibilityRole={accessibilityRole || 'button'}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </Component>
    );
  }

  return (
    <Animated.View
      style={cardStyles}
      accessible={accessibilityRole !== 'none'}
      accessibilityRole={accessibilityRole || 'text'}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Animated.View>
  );
};

// Helper function for variant styles
const getVariantStyles = (variant: string, theme: any, shadowLevel?: string) => {
  const baseStyle = {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: radius.lg,
  };

  let variantStyle = {};
  switch (variant) {
    case 'default':
      variantStyle = {
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...getShadowStyle(shadowLevel || 'sm'),
      };
      break;
    case 'elevated':
      variantStyle = {
        borderWidth: 0,
        ...getShadowStyle(shadowLevel || 'md'),
      };
      break;
    case 'flat':
      variantStyle = {
        borderWidth: 1,
        borderColor: theme.colors.border,
      };
      break;
  }

  return { ...baseStyle, ...variantStyle };
};

const getShadowStyle = (level: string) => {
  switch (level) {
    case 'none':
      return {};
    case 'sm':
      return shadows.sm;
    case 'md':
      return shadows.md;
    case 'lg':
      return shadows.lg;
    default:
      return shadows.sm;
  }
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

export default Card;

// Enhanced Card variants for specific use cases
export const ElevatedCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="elevated" />
);

export const FlatCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="flat" />
);

export const InteractiveCard: React.FC<CardProps> = (props) => (
  <Card
    {...props}
    animated={true}
    hapticFeedback={true}
    accessibilityRole="button"
  />
);

export const StaticCard: React.FC<Omit<CardProps, 'onPress' | 'animated'>> = (props) => (
  <Card
    {...props}
    animated={false}
    accessibilityRole="text"
  />
);
