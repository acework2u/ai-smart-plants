import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, PanGestureHandler, State } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';

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

export default {
  StaggerContainer,
  ParallaxScrollView,
  FlipCard,
  SwipeToDelete,
  BounceButton,
  useFadeIn,
  useScaleIn,
};