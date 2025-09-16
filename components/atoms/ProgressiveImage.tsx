import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  ViewStyle,
  ImageStyle,
  StyleSheet,
  ImageResizeMode,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { Skeleton } from './Skeleton';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressiveImageProps {
  source: { uri: string } | number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: { uri: string } | number;
  blurRadius?: number;
  contentFit?: ImageResizeMode;
  cacheKey?: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
  priority?: 'low' | 'normal' | 'high';
  transition?: 'fade' | 'blur' | 'scale' | 'slide';
  transitionDuration?: number;
  showSkeleton?: boolean;
  accessibilityLabel?: string;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  source,
  style,
  containerStyle,
  placeholder,
  blurRadius = 10,
  contentFit = 'cover',
  cacheKey,
  onLoad,
  onError,
  priority = 'normal',
  transition = 'blur',
  transitionDuration = 800,
  showSkeleton = true,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaceholderLoaded, setIsPlaceholderLoaded] = useState(false);

  const imageOpacity = useSharedValue(0);
  const placeholderOpacity = useSharedValue(1);
  const blurValue = useSharedValue(blurRadius);
  const scaleValue = useSharedValue(transition === 'scale' ? 1.1 : 1);
  const slideValue = useSharedValue(transition === 'slide' ? 30 : 0);
  const skeletonOpacity = useSharedValue(showSkeleton ? 1 : 0);

  const hasLoaded = useRef(false);

  const handleImageLoad = useCallback(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    // Hide skeleton first
    skeletonOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });

    // Start main image animations
    const animationConfig = {
      duration: transitionDuration,
      easing: Easing.out(Easing.cubic),
    };

    switch (transition) {
      case 'blur':
        imageOpacity.value = withTiming(1, animationConfig);
        blurValue.value = withTiming(0, animationConfig);
        placeholderOpacity.value = withTiming(0, {
          ...animationConfig,
          duration: transitionDuration + 200,
        });
        break;

      case 'fade':
        imageOpacity.value = withTiming(1, animationConfig);
        placeholderOpacity.value = withTiming(0, animationConfig);
        break;

      case 'scale':
        imageOpacity.value = withTiming(1, animationConfig);
        scaleValue.value = withTiming(1, {
          ...animationConfig,
          easing: Easing.out(Easing.back(1.2)),
        });
        placeholderOpacity.value = withTiming(0, animationConfig);
        break;

      case 'slide':
        imageOpacity.value = withTiming(1, animationConfig);
        slideValue.value = withTiming(0, {
          ...animationConfig,
          easing: Easing.out(Easing.back(1.1)),
        });
        placeholderOpacity.value = withTiming(0, animationConfig);
        break;
    }

    setIsLoading(false);
    onLoad?.();
  }, [
    imageOpacity,
    blurValue,
    placeholderOpacity,
    scaleValue,
    slideValue,
    skeletonOpacity,
    transition,
    transitionDuration,
    onLoad,
  ]);

  const handleImageError = useCallback((error: any) => {
    setHasError(true);
    setIsLoading(false);
    skeletonOpacity.value = withTiming(0, { duration: 200 });
    onError?.(error);
  }, [onError, skeletonOpacity]);

  const handlePlaceholderLoad = useCallback(() => {
    setIsPlaceholderLoaded(true);
  }, []);

  // Animated styles
  const skeletonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: skeletonOpacity.value,
  }));

  const placeholderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: placeholderOpacity.value,
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const baseStyle = {
      opacity: imageOpacity.value,
    };

    switch (transition) {
      case 'blur':
        return {
          ...baseStyle,
          transform: [{ scale: 1 }],
        };
      case 'scale':
        return {
          ...baseStyle,
          transform: [{ scale: scaleValue.value }],
        };
      case 'slide':
        return {
          ...baseStyle,
          transform: [{ translateY: slideValue.value }],
        };
      default:
        return baseStyle;
    }
  });

  const blurAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(blurValue.value, [0, blurRadius], [0, 1]),
  }));

  // Error fallback
  if (hasError) {
    return (
      <View style={[styles.container, containerStyle]}>
        <View style={[styles.errorContainer, style]}>
          <View style={[styles.errorIcon, { backgroundColor: theme.colors.error + '20' }]}>
            <View style={[styles.errorIconInner, { backgroundColor: theme.colors.error }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Skeleton Loading */}
      {showSkeleton && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            skeletonAnimatedStyle,
          ]}
        >
          <Skeleton
            width="100%"
            height="100%"
            borderRadius={StyleSheet.flatten(style)?.borderRadius || 0}
            animated={true}
          />
        </Animated.View>
      )}

      {/* Placeholder Image (Blurred/Low Quality) */}
      {placeholder && (
        <AnimatedImage
          source={placeholder}
          style={[
            StyleSheet.absoluteFillObject,
            style,
            placeholderAnimatedStyle,
          ]}
          contentFit={contentFit}
          onLoad={handlePlaceholderLoad}
          priority={priority}
          cachePolicy="memory-disk"
          accessibilityLabel={accessibilityLabel}
        />
      )}

      {/* Blur Overlay for Placeholder */}
      {transition === 'blur' && placeholder && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            blurAnimatedStyle,
          ]}
        >
          <LinearGradient
            colors={[
              theme.colors.background.primary + '40',
              theme.colors.background.primary + '20',
              'transparent',
            ]}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}

      {/* Main High-Quality Image */}
      <AnimatedImage
        source={source}
        style={[
          StyleSheet.absoluteFillObject,
          style,
          imageAnimatedStyle,
        ]}
        contentFit={contentFit}
        onLoad={handleImageLoad}
        onError={handleImageError}
        priority={priority}
        cachePolicy="memory-disk"
        placeholder={placeholder}
        placeholderContentFit={contentFit}
        transition={0} // Disable built-in transition, we handle it manually
        accessibilityLabel={accessibilityLabel}
        cacheKey={cacheKey}
      />
    </View>
  );
};

// Specialized Progressive Images for different use cases

export const ProgressivePlantImage: React.FC<
  Omit<ProgressiveImageProps, 'transition' | 'contentFit'>
> = (props) => (
  <ProgressiveImage
    {...props}
    transition="blur"
    contentFit="cover"
    priority="high"
    transitionDuration={600}
  />
);

export const ProgressiveAvatarImage: React.FC<
  Omit<ProgressiveImageProps, 'transition' | 'contentFit'>
> = (props) => (
  <ProgressiveImage
    {...props}
    transition="fade"
    contentFit="cover"
    priority="normal"
    transitionDuration={400}
  />
);

export const ProgressiveBackgroundImage: React.FC<
  Omit<ProgressiveImageProps, 'transition' | 'contentFit' | 'priority'>
> = (props) => (
  <ProgressiveImage
    {...props}
    transition="scale"
    contentFit="cover"
    priority="low"
    transitionDuration={1000}
  />
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  errorContainer: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

export default ProgressiveImage;
