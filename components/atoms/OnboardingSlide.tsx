import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';
import { lightColors, typography, spacing, radius } from '../../core/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface OnboardingSlideData {
  id: string;
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle: string;
  description: string;
  backgroundColor?: string;
  illustration?: React.ReactNode;
}

interface OnboardingSlideProps {
  slide: OnboardingSlideData;
  isActive: boolean;
  slideIndex: number;
  scrollX: Animated.SharedValue<number>;
}

export default function OnboardingSlide({
  slide,
  isActive,
  slideIndex,
  scrollX,
}: OnboardingSlideProps) {
  const opacity = useSharedValue(isActive ? 1 : 0.7);
  const scale = useSharedValue(isActive ? 1 : 0.95);

  React.useEffect(() => {
    opacity.value = withTiming(isActive ? 1 : 0.7, { duration: 300 });
    scale.value = withSpring(isActive ? 1 : 0.95, {
      damping: 15,
      stiffness: 200,
    });
  }, [isActive, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (slideIndex - 1) * screenWidth,
      slideIndex * screenWidth,
      (slideIndex + 1) * screenWidth,
    ];

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [30, 0, -30],
      Extrapolate.CLAMP
    );

    const rotateZ = interpolate(
      scrollX.value,
      inputRange,
      [-10, 0, 10],
      Extrapolate.CLAMP
    );

    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY },
        { rotateZ: `${rotateZ}deg` },
      ],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (slideIndex - 1) * screenWidth,
      slideIndex * screenWidth,
      (slideIndex + 1) * screenWidth,
    ];

    const iconScale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolate.CLAMP
    );

    const iconRotate = interpolate(
      scrollX.value,
      inputRange,
      [-15, 0, 15],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale: iconScale },
        { rotateZ: `${iconRotate}deg` },
      ],
    };
  });

  const backgroundColor = slide.backgroundColor || lightColors.primarySoft;
  const iconColor = slide.iconColor || lightColors.primary;

  return (
    <View
      style={[styles.container, { backgroundColor: lightColors.white }]}
      accessible={true}
      // 'presentation' is not a valid RN accessibilityRole on Android; use 'none'
      accessibilityRole="none"
      accessibilityLabel={`${slide.title}: ${slide.subtitle}`}
    >
      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Icon Section */}
        <View
          style={[styles.iconContainer, { backgroundColor }]}
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel={`Icon for ${slide.title}`}
        >
          <Animated.View style={[styles.iconWrapper, iconAnimatedStyle]}>
            <slide.icon
              size={80}
              color={iconColor}
              strokeWidth={1.5}
            />
          </Animated.View>
        </View>

        {/* Custom Illustration (if provided) */}
        {slide.illustration && (
          <View style={styles.illustrationContainer}>
            {slide.illustration}
          </View>
        )}

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text
            style={styles.title}
            accessible={true}
            accessibilityRole="header"
            accessibilityLevel={1}
          >
            {slide.title}
          </Text>
          <Text
            style={styles.subtitle}
            accessible={true}
            accessibilityRole="header"
            accessibilityLevel={2}
          >
            {slide.subtitle}
          </Text>
          <Text
            style={styles.description}
            accessible={true}
            accessibilityRole="text"
          >
            {slide.description}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing(6),
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: spacing(12),
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(8),
    shadowColor: lightColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    marginVertical: spacing(6),
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing(4),
    marginTop: spacing(6),
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: '700' as const,
    color: lightColors.text.primary,
    textAlign: 'center',
    marginBottom: spacing(3),
    lineHeight: typography.fontSize['4xl'] * 1.2,
  },
  subtitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600' as const,
    color: lightColors.primary,
    textAlign: 'center',
    marginBottom: spacing(4),
    lineHeight: typography.fontSize.xl * 1.4,
  },
  description: {
    fontSize: typography.fontSize.base,
    fontWeight: '400' as const,
    color: lightColors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.6,
    maxWidth: screenWidth * 0.8,
  },
});
