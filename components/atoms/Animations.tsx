import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, PanGestureHandler, State, Dimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import ReAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  withSequence,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Stagger Animation Container
interface StaggerContainerProps {
  children: React.ReactNode[];
  delay?: number;
  duration?: number;
  staggerDelay?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  delay = 0,
  duration = 300,
  staggerDelay = 100
}) => {
  const animatedValues = useRef(
    children.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = animatedValues.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        delay: delay + index * staggerDelay,
        useNativeDriver: true,
      })
    );

    Animated.parallel(animations).start();
  }, [animatedValues, delay, duration, staggerDelay]);

  return (
    <>
      {children.map((child, index) => (
        <Animated.View
          key={index}
          style={{
            opacity: animatedValues[index],
            transform: [
              {
                translateY: animatedValues[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          }}
        >
          {child}
        </Animated.View>
      ))}
    </>
  );
};

// Parallax Scroll View
interface ParallaxScrollViewProps {
  children: React.ReactNode;
  headerHeight: number;
  backgroundImage?: React.ReactNode;
  parallaxMultiplier?: number;
}

export const ParallaxScrollView: React.FC<ParallaxScrollViewProps> = ({
  children,
  headerHeight,
  backgroundImage,
  parallaxMultiplier = 0.5
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight * parallaxMultiplier],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, headerHeight * 0.5, headerHeight],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Parallax Header */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: headerHeight,
          transform: [{ translateY: headerTranslate }],
          opacity: headerOpacity,
          zIndex: 1,
        }}
      >
        {backgroundImage}
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: headerHeight }} />
        {children}
      </Animated.ScrollView>
    </View>
  );
};

// Card Flip Animation
interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  duration?: number;
}

export const FlipCard: React.FC<FlipCardProps> = ({
  front,
  back,
  isFlipped = false,
  onFlip,
  duration = 600
}) => {
  const [showBack, setShowBack] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();

    // Show back side halfway through animation
    const timeout = setTimeout(() => {
      setShowBack(isFlipped);
    }, duration / 2);

    return () => clearTimeout(timeout);
  }, [isFlipped, flipAnimation, duration]);

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const handlePress = () => {
    onFlip?.(!isFlipped);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Front Side */}
      <Animated.View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: [{ rotateY: frontInterpolate }],
          opacity: frontOpacity,
        }}
      >
        <View style={{ flex: 1 }} onTouchEnd={handlePress}>
          {front}
        </View>
      </Animated.View>

      {/* Back Side */}
      <Animated.View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: [{ rotateY: backInterpolate }],
          opacity: backOpacity,
        }}
      >
        <View style={{ flex: 1 }} onTouchEnd={handlePress}>
          {back}
        </View>
      </Animated.View>
    </View>
  );
};

// Swipe to Delete Container
interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete?: () => void;
  deleteThreshold?: number;
  deleteColor?: string;
}

export const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({
  children,
  onDelete,
  deleteThreshold = 150,
  deleteColor
}) => {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const [isDeleting, setIsDeleting] = useState(false);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.setValue(event.translationX);
      }
    })
    .onEnd((event) => {
      if (event.translationX < -deleteThreshold) {
        // Trigger delete
        setIsDeleting(true);
        Animated.timing(translateX, {
          toValue: -500,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onDelete?.();
        });
      } else {
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    });

  const deleteOpacity = translateX.interpolate({
    inputRange: [-deleteThreshold, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const deleteScale = translateX.interpolate({
    inputRange: [-deleteThreshold, 0],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <GestureHandlerRootView>
      <View style={{ position: 'relative' }}>
        {/* Delete Background */}
        <Animated.View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: deleteThreshold,
            backgroundColor: deleteColor || theme.colors.error,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: deleteOpacity,
            transform: [{ scale: deleteScale }],
          }}
        >
          <Animated.Text
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: 16,
            }}
          >
            Delete
          </Animated.Text>
        </Animated.View>

        {/* Swipeable Content */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={{
              transform: [{ translateX }],
            }}
          >
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
};

// Bounce on Press Animation
interface BounceButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  scale?: number;
  duration?: number;
}

export const BounceButton: React.FC<BounceButtonProps> = ({
  children,
  onPress,
  scale = 0.95,
  duration = 100
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleValue, {
      toValue: scale,
      duration,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleValue }],
      }}
    >
      <View
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        onTouchCancel={handlePressOut}
        onPress={onPress}
      >
        {children}
      </View>
    </Animated.View>
  );
};

// Fade In Animation Hook
export const useFadeIn = (duration = 300, delay = 0) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, duration, delay]);

  return fadeAnim;
};

// Scale In Animation Hook
export const useScaleIn = (duration = 300, delay = 0) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      delay,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, delay]);

  return scaleAnim;
};

// Enhanced Page Transition Container using react-native-reanimated
interface PageTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  transition?: 'slide' | 'fade' | 'scale' | 'push' | 'modal';
  duration?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  onTransitionComplete?: () => void;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  isVisible,
  transition = 'slide',
  duration = 300,
  direction = 'right',
  onTransitionComplete,
}) => {
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const translateX = useSharedValue(isVisible ? 0 : SCREEN_WIDTH);
  const translateY = useSharedValue(isVisible ? 0 : SCREEN_HEIGHT);
  const scale = useSharedValue(isVisible ? 1 : 0.9);

  useEffect(() => {
    const config = {
      duration,
      easing: Easing.out(Easing.cubic),
    };

    switch (transition) {
      case 'fade':
        opacity.value = withTiming(isVisible ? 1 : 0, config, (finished) => {
          if (finished) runOnJS(() => onTransitionComplete?.())();
        });
        break;

      case 'slide':
        const slideValue = direction === 'left' ? -SCREEN_WIDTH :
                          direction === 'right' ? SCREEN_WIDTH : 0;
        translateX.value = withTiming(isVisible ? 0 : slideValue, config, (finished) => {
          if (finished) runOnJS(() => onTransitionComplete?.())();
        });
        opacity.value = withTiming(isVisible ? 1 : 0, config);
        break;

      case 'push':
        const pushValue = direction === 'up' ? -SCREEN_HEIGHT : SCREEN_HEIGHT;
        translateY.value = withTiming(isVisible ? 0 : pushValue, config, (finished) => {
          if (finished) runOnJS(() => onTransitionComplete?.())();
        });
        opacity.value = withTiming(isVisible ? 1 : 0, config);
        break;

      case 'scale':
        scale.value = withSpring(isVisible ? 1 : 0.9, {
          damping: 20,
          stiffness: 300,
        }, (finished) => {
          if (finished) runOnJS(() => onTransitionComplete?.())();
        });
        opacity.value = withTiming(isVisible ? 1 : 0, config);
        break;

      case 'modal':
        scale.value = withSpring(isVisible ? 1 : 0.8, { damping: 20, stiffness: 300 });
        translateY.value = withTiming(isVisible ? 0 : SCREEN_HEIGHT * 0.1, config);
        opacity.value = withTiming(isVisible ? 1 : 0, config, (finished) => {
          if (finished) runOnJS(() => onTransitionComplete?.())();
        });
        break;
    }
  }, [isVisible, transition, direction, duration, opacity, translateX, translateY, scale, onTransitionComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <ReAnimated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </ReAnimated.View>
  );
};

// Loading State Transition
interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  duration?: number;
}

export const LoadingTransition: React.FC<LoadingTransitionProps> = ({
  isLoading,
  children,
  loadingComponent,
  duration = 400,
}) => {
  const contentOpacity = useSharedValue(isLoading ? 0 : 1);
  const loadingOpacity = useSharedValue(isLoading ? 1 : 0);
  const contentTranslateY = useSharedValue(isLoading ? 20 : 0);

  useEffect(() => {
    const config = {
      duration,
      easing: Easing.out(Easing.quad),
    };

    if (isLoading) {
      contentOpacity.value = withTiming(0, config);
      contentTranslateY.value = withTiming(20, config);
      loadingOpacity.value = withTiming(1, config);
    } else {
      loadingOpacity.value = withTiming(0, config);
      contentOpacity.value = withTiming(1, { ...config, delay: 100 });
      contentTranslateY.value = withTiming(0, { ...config, delay: 100 });
    }
  }, [isLoading, contentOpacity, loadingOpacity, contentTranslateY, duration]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const loadingStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }));

  return (
    <View style={{ flex: 1 }}>
      <ReAnimated.View style={contentStyle}>
        {children}
      </ReAnimated.View>
      {loadingComponent && (
        <ReAnimated.View style={loadingStyle}>
          {loadingComponent}
        </ReAnimated.View>
      )}
    </View>
  );
};

// Smooth List Item Animation
interface ListItemAnimationProps {
  children: React.ReactNode;
  index: number;
  delay?: number;
  staggerDelay?: number;
}

export const ListItemAnimation: React.FC<ListItemAnimationProps> = ({
  children,
  index,
  delay = 0,
  staggerDelay = 50,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    const totalDelay = delay + (index * staggerDelay);

    opacity.value = withTiming(1, {
      duration: 400,
      delay: totalDelay,
      easing: Easing.out(Easing.quad),
    });

    translateY.value = withTiming(0, {
      duration: 400,
      delay: totalDelay,
      easing: Easing.out(Easing.back(1.1)),
    });

    scale.value = withTiming(1, {
      duration: 400,
      delay: totalDelay,
      easing: Easing.out(Easing.back(1.05)),
    });
  }, [index, delay, staggerDelay, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <ReAnimated.View style={animatedStyle}>
      {children}
    </ReAnimated.View>
  );
};

// Success/Error State Animation
interface StateAnimationProps {
  children: React.ReactNode;
  state: 'idle' | 'loading' | 'success' | 'error';
  duration?: number;
}

export const StateAnimation: React.FC<StateAnimationProps> = ({
  children,
  state,
  duration = 300,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotateZ = useSharedValue(0);

  useEffect(() => {
    switch (state) {
      case 'loading':
        scale.value = withSequence(
          withTiming(0.98, { duration: duration / 2 }),
          withTiming(1, { duration: duration / 2 })
        );
        break;

      case 'success':
        scale.value = withSequence(
          withTiming(1.05, { duration: duration / 3 }),
          withSpring(1, { damping: 15, stiffness: 300 })
        );
        break;

      case 'error':
        rotateZ.value = withSequence(
          withTiming(2, { duration: 50 }),
          withTiming(-2, { duration: 50 }),
          withTiming(2, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        break;

      case 'idle':
      default:
        scale.value = withTiming(1, { duration });
        rotateZ.value = withTiming(0, { duration });
        break;
    }
  }, [state, scale, rotateZ, opacity, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <ReAnimated.View style={animatedStyle}>
      {children}
    </ReAnimated.View>
  );
};

export default {
  StaggerContainer,
  ParallaxScrollView,
  FlipCard,
  SwipeToDelete,
  BounceButton,
  useFadeIn,
  useScaleIn,
  PageTransition,
  LoadingTransition,
  ListItemAnimation,
  StateAnimation,
};