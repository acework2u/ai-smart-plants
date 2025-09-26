import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor
} from 'react-native-reanimated';
import { lightColors, spacing, radius } from '../../core/theme';

interface ProgressDotsProps {
  total: number;
  current: number;
  activeColor?: string;
  inactiveColor?: string;
  size?: number;
  spacing?: number;
}

export default function ProgressDots({
  total,
  current,
  activeColor = lightColors.primary,
  inactiveColor = lightColors.gray300,
  size = 8,
  spacing: dotSpacing = 8,
}: ProgressDotsProps) {
  return (
    <View
      style={[styles.container, { gap: dotSpacing }]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Progress indicator: slide ${current + 1} of ${total}`}
      accessibilityValue={{
        now: current + 1,
        min: 1,
        max: total,
        text: `Page ${current + 1} of ${total}`,
      }}
    >
      {Array.from({ length: total }, (_, index) => (
        <ProgressDot
          key={index}
          isActive={index === current}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          size={size}
        />
      ))}
    </View>
  );
}

interface ProgressDotProps {
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
  size: number;
}

function ProgressDot({ isActive, activeColor, inactiveColor, size }: ProgressDotProps) {
  const animatedValue = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    animatedValue.value = withSpring(isActive ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isActive, animatedValue]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedValue.value,
      [0, 1],
      [inactiveColor, activeColor]
    );

    const scale = withSpring(animatedValue.value === 1 ? 1.2 : 1, {
      damping: 15,
      stiffness: 200,
    });

    return {
      backgroundColor,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    shadowColor: lightColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});