import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Camera } from 'lucide-react-native';
import { colors, radius, getSpacing, typography, animation } from '../../core/theme';
import { useHaptic } from '../../core/haptics';

interface CameraButtonProps {
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'capture';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CameraButton({
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  title,
  subtitle,
  icon,
}: CameraButtonProps) {
  const haptic = useHaptic();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const sizes = {
    sm: { width: 48, height: 48, iconSize: 20 },
    md: { width: 64, height: 64, iconSize: 24 },
    lg: { width: 80, height: 80, iconSize: 28 },
    xl: { width: 120, height: 120, iconSize: 32 },
  };

  const currentSize = sizes[size];

  const handlePressIn = () => {
    if (disabled || loading) return;

    scale.value = withSpring(0.95, {
      stiffness: 400,
      damping: 15,
    });

    // Trigger haptic feedback (JS context)
    haptic.photoCapture();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    scale.value = withSpring(1, {
      stiffness: 400,
      damping: 15,
    });
  };

  const handlePress = () => {
    if (disabled || loading) return;

    // Success animation
    scale.value = withSpring(1.05, {
      stiffness: 400,
      damping: 15,
    }, (finished) => {
      if (finished) {
        scale.value = withSpring(1);
      }
    });

    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.5 : opacity.value,
    };
  });

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      width: currentSize.width,
      height: currentSize.height,
      borderRadius: variant === 'capture' ? radius.full : radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.white,
          borderWidth: 2,
          borderColor: colors.border.light,
        };
      case 'capture':
        return {
          ...baseStyle,
          backgroundColor: colors.white,
          borderWidth: 4,
          borderColor: colors.primary,
        };
      default:
        return baseStyle;
    }
  };

  const getIconColor = () => {
    if (variant === 'primary') return colors.white;
    if (variant === 'capture') return colors.primary;
    return colors.primary;
  };

  const renderIcon = () => {
    if (icon) return icon;
    return (
      <Camera
        size={currentSize.iconSize}
        color={getIconColor()}
      />
    );
  };

  const renderCaptureBorder = () => {
    if (variant !== 'capture') return null;

    return (
      <View style={styles.captureBorder} />
    );
  };

  const renderContent = () => {
    if (title || subtitle) {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            {renderIcon()}
          </View>
          {title && (
            <Text style={[styles.title, { color: getIconColor() }]}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: getIconColor() }]}>
              {subtitle}
            </Text>
          )}
        </View>
      );
    }

    return renderIcon();
  };

  return (
    <AnimatedPressable
      style={[getButtonStyle(), animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title || "Camera button"}
      accessibilityHint="Take a photo to analyze plant health"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {renderCaptureBorder()}
      {renderContent()}

      {loading && (
        <View style={styles.loadingOverlay}>
          <Animated.View style={[styles.loadingSpinner, { opacity: opacity.value }]} />
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: getSpacing(1),
  },
  title: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium as any,
    textAlign: 'center',
    marginBottom: getSpacing(0.5),
  },
  subtitle: {
    fontSize: typography.fontSize.xs - 2,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    opacity: 0.8,
  },
  captureBorder: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: radius.xl,
  },
  loadingSpinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white + '40',
    borderTopColor: colors.white,
  },
});
