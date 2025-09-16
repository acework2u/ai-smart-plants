import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import OnboardingSlide, { OnboardingSlideData } from '../atoms/OnboardingSlide';
import ProgressDots from '../atoms/ProgressDots';
import { lightColors, spacing } from '../../core/theme';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingCarouselProps {
  slides: OnboardingSlideData[];
  onSlideChange?: (index: number) => void;
  autoPlay?: boolean;
  autoPlayDelay?: number;
}

export default function OnboardingCarousel({
  slides,
  onSlideChange,
  autoPlay = false,
  autoPlayDelay = 5000,
}: OnboardingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const startX = useSharedValue(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play functionality
  React.useEffect(() => {
    if (autoPlay && slides.length > 1) {
      autoPlayRef.current = setInterval(() => {
        const nextIndex = (currentIndex + 1) % slides.length;
        goToSlide(nextIndex);
      }, autoPlayDelay);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayDelay, currentIndex, slides.length]);

  const goToSlide = (index: number) => {
    'worklet';
    const clampedIndex = Math.max(0, Math.min(slides.length - 1, index));
    scrollX.value = withSpring(clampedIndex * screenWidth, {
      damping: 20,
      stiffness: 200,
    });
    runOnJS(updateCurrentIndex)(clampedIndex);
    runOnJS(triggerHapticFeedback)();
  };

  const updateCurrentIndex = (index: number) => {
    setCurrentIndex(index);
    onSlideChange?.(index);

    // Clear auto-play timer when user interacts
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const triggerHapticFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const decideTarget = (translationX: number, velocityX: number) => {
    const threshold = screenWidth * 0.2;
    let targetIndex = currentIndex;
    if (translationX > threshold || velocityX > 500) {
      targetIndex = Math.max(0, currentIndex - 1);
    } else if (translationX < -threshold || velocityX < -500) {
      targetIndex = Math.min(slides.length - 1, currentIndex + 1);
    }
    goToSlide(targetIndex);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = scrollX.value;
    })
    .onUpdate((event) => {
      scrollX.value = startX.value - event.translationX;
    })
    .onEnd((event) => {
      runOnJS(decideTarget)(event.translationX, event.velocityX);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -scrollX.value }],
    };
  });

  // Background color animation based on current slide
  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolate(
      scrollX.value,
      slides.map((_, index) => index * screenWidth),
      slides.map((slide, index) => {
        // Create a subtle gradient effect based on slide
        const baseColors = [
          lightColors.primarySoft,
          lightColors.surface.primary,
          lightColors.background.secondary,
          lightColors.primarySoft,
        ];
        return baseColors[index % baseColors.length] || lightColors.white;
      }),
      Extrapolate.CLAMP
    );

    return {
      backgroundColor: lightColors.white, // Keep consistent white background
    };
  });

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="scrollview"
      accessibilityLabel="Onboarding carousel"
      accessibilityHint="Swipe left or right to navigate between slides"
    >
      <Animated.View style={[styles.background, backgroundAnimatedStyle]} />

      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.carouselContainer}>
          <Animated.View style={[styles.slidesContainer, animatedStyle]}>
            {slides.map((slide, index) => (
              <OnboardingSlide
                key={slide.id}
                slide={slide}
                isActive={index === currentIndex}
                slideIndex={index}
                scrollX={scrollX}
              />
            ))}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Progress Dots */}
      <View style={styles.dotsContainer}>
        <ProgressDots
          total={slides.length}
          current={currentIndex}
          activeColor={lightColors.primary}
          inactiveColor={lightColors.gray[300]}
          size={10}
          spacing={12}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.white,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  carouselContainer: {
    flex: 1,
  },
  slidesContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: spacing(16),
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing(6),
  },
});
