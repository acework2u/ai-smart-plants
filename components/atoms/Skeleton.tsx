import React from 'react';
import { View, ViewStyle, Dimensions } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import Constants from 'expo-constants';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
  shimmerColor?: string;
  baseColor?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  animated = true,
  shimmerColor,
  baseColor,
}) => {
  const { theme } = useTheme();
  const isExpoGo = Constants.appOwnership === 'expo';
  const skeletonSpeed = isExpoGo ? 0 : 1200;

  const defaultBaseColor = baseColor || (theme.isDark ? '#374151' : '#f3f4f6');
  const defaultShimmerColor = shimmerColor || (theme.isDark ? '#4b5563' : '#ffffff');

  if (!animated) {
    return (
      <View
        style={[
          {
            width,
            height,
            borderRadius,
            backgroundColor: defaultBaseColor,
          },
          style,
        ]}
      />
    );
  }

  return (
    <SkeletonPlaceholder
      LinearGradientComponent={LinearGradient}
      backgroundColor={defaultBaseColor}
      highlightColor={defaultShimmerColor}
      speed={skeletonSpeed}
      angle={45}
    >
      <View
        style={[
          {
            width,
            height,
            borderRadius,
          },
          style,
        ]}
      />
    </SkeletonPlaceholder>
  );
};

// Tip Card Skeleton for AI Tips Section
export const TipCardSkeleton: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const { theme } = useTheme();
  const isExpoGo = Constants.appOwnership === 'expo';
  const skeletonSpeed = isExpoGo ? 0 : 1200;

  const fadeAnim = useSharedValue(0);

  React.useEffect(() => {
    fadeAnim.value = withTiming(1, {
      duration: 300,
      delay,
      easing: Easing.out(Easing.quad),
    });
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{
      translateX: interpolate(fadeAnim.value, [0, 1], [-20, 0]),
    }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 160,
          backgroundColor: theme.colors.surface.primary,
          borderRadius: 12,
          padding: theme.spacing(3),
          marginRight: theme.spacing(3),
          shadowColor: theme.colors.black,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: theme.isDark ? 0.2 : 0.05,
          shadowRadius: 4,
          elevation: 2,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        animatedStyle,
      ]}
    >
      <SkeletonPlaceholder
        LinearGradientComponent={LinearGradient}
        backgroundColor={theme.isDark ? '#374151' : '#f3f4f6'}
        highlightColor={theme.isDark ? '#4b5563' : '#ffffff'}
        speed={skeletonSpeed}
        angle={45}
      >
        {/* Tip Icon */}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            marginBottom: theme.spacing(2),
          }}
        />

        {/* Tip Title */}
        <View
          style={{
            width: '80%',
            height: 14,
            borderRadius: 4,
            marginBottom: theme.spacing(1),
          }}
        />

        {/* Tip Description */}
        <View
          style={{
            width: '100%',
            height: 12,
            borderRadius: 4,
            marginBottom: theme.spacing(1),
          }}
        />
        <View
          style={{
            width: '60%',
            height: 12,
            borderRadius: 4,
          }}
        />
      </SkeletonPlaceholder>
    </Animated.View>
  );
};

// Plant Card Skeleton
export const PlantCardSkeleton: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const { theme } = useTheme();
  const isExpoGo = Constants.appOwnership === 'expo';
  const skeletonSpeed = isExpoGo ? 0 : 1200;

  const fadeAnim = useSharedValue(0);

  React.useEffect(() => {
    fadeAnim.value = withTiming(1, {
      duration: 300,
      delay,
      easing: Easing.out(Easing.quad),
    });
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{
      translateY: interpolate(fadeAnim.value, [0, 1], [20, 0]),
    }],
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.surface.primary,
          borderRadius: 16,
          padding: theme.spacing(4),
          marginBottom: theme.spacing(3),
          shadowColor: theme.colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.isDark ? 0.3 : 0.1,
          shadowRadius: 8,
          elevation: 4,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        animatedStyle,
      ]}
    >
      <SkeletonPlaceholder
        LinearGradientComponent={LinearGradient}
        backgroundColor={theme.isDark ? '#374151' : '#f3f4f6'}
        highlightColor={theme.isDark ? '#4b5563' : '#ffffff'}
        speed={skeletonSpeed}
        angle={45}
      >
        <View style={{ flexDirection: 'row' }}>
          {/* Plant Image */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
            }}
          />

          {/* Plant Info */}
          <View style={{ flex: 1, marginLeft: theme.spacing(3) }}>
            {/* Plant Name */}
            <View
              style={{
                width: '70%',
                height: 18,
                borderRadius: 4,
                marginBottom: theme.spacing(2),
              }}
            />

            {/* Scientific Name */}
            <View
              style={{
                width: '85%',
                height: 14,
                borderRadius: 4,
                marginBottom: theme.spacing(2),
              }}
            />

            {/* Status Chip */}
            <View
              style={{
                width: 60,
                height: 24,
                borderRadius: 12,
              }}
            />
          </View>
        </View>

        {/* Health Score Bar */}
        <View
          style={{
            marginTop: theme.spacing(3),
            height: 8,
            borderRadius: 4,
          }}
        />
      </SkeletonPlaceholder>
    </Animated.View>
  );
};

// Activity Row Skeleton
export const ActivityRowSkeleton: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const { theme } = useTheme();
  const isExpoGo = Constants.appOwnership === 'expo';
  const skeletonSpeed = isExpoGo ? 0 : 1200;

  const fadeAnim = useSharedValue(0);

  React.useEffect(() => {
    fadeAnim.value = withTiming(1, {
      duration: 200,
      delay,
      easing: Easing.out(Easing.quad),
    });
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{
      translateX: interpolate(fadeAnim.value, [0, 1], [-20, 0]),
    }],
  }));

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: theme.spacing(3),
          paddingHorizontal: theme.spacing(4),
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.divider,
        },
        animatedStyle,
      ]}
    >
      <SkeletonPlaceholder
        LinearGradientComponent={LinearGradient}
        backgroundColor={theme.isDark ? '#374151' : '#f3f4f6'}
        highlightColor={theme.isDark ? '#4b5563' : '#ffffff'}
        speed={skeletonSpeed}
        angle={45}
      >
        {/* Activity Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: theme.spacing(3),
          }}
        />

        {/* Activity Info */}
        <View style={{ flex: 1 }}>
          {/* Activity Type */}
          <View
            style={{
              width: '60%',
              height: 16,
              borderRadius: 4,
              marginBottom: theme.spacing(1),
            }}
          />

          {/* Activity Details */}
          <View
            style={{
              width: '80%',
              height: 12,
              borderRadius: 4,
            }}
          />
        </View>

        {/* Time */}
        <View
          style={{
            width: 50,
            height: 12,
            borderRadius: 4,
          }}
        />
      </SkeletonPlaceholder>
    </Animated.View>
  );
};

// Notification Item Skeleton
export const NotificationSkeleton: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const { theme } = useTheme();
  const isExpoGo = Constants.appOwnership === 'expo';
  const skeletonSpeed = isExpoGo ? 0 : 1200;

  const fadeAnim = useSharedValue(0);

  React.useEffect(() => {
    fadeAnim.value = withTiming(1, {
      duration: 200,
      delay,
      easing: Easing.out(Easing.quad),
    });
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{
      translateX: interpolate(fadeAnim.value, [0, 1], [30, 0]),
    }],
  }));

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          padding: theme.spacing(4),
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.divider,
        },
        animatedStyle,
      ]}
    >
      <SkeletonPlaceholder
        LinearGradientComponent={LinearGradient}
        backgroundColor={theme.isDark ? '#374151' : '#f3f4f6'}
        highlightColor={theme.isDark ? '#4b5563' : '#ffffff'}
        speed={skeletonSpeed}
        angle={45}
      >
        {/* Notification Icon */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            marginRight: theme.spacing(3),
          }}
        />

        {/* Notification Content */}
        <View style={{ flex: 1 }}>
          {/* Title */}
          <View
            style={{
              width: '70%',
              height: 16,
              borderRadius: 4,
              marginBottom: theme.spacing(1),
            }}
          />

          {/* Description */}
          <View
            style={{
              width: '90%',
              height: 12,
              borderRadius: 4,
              marginBottom: theme.spacing(1),
            }}
          />

          {/* Time */}
          <View
            style={{
              width: '30%',
              height: 10,
              borderRadius: 4,
            }}
          />
        </View>
      </SkeletonPlaceholder>
    </Animated.View>
  );
};

// Garden Grid Skeleton with staggered animation
export const GardenGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        padding: theme.spacing(4)
      }}
      accessible={true}
      accessibilityLabel="Loading garden plants"
      accessibilityRole="none"
    >
      {Array.from({ length: count }).map((_, index) => (
        <PlantCardSkeleton key={index} delay={index * 100} />
      ))}
    </View>
  );
};

// Activity List Skeleton with staggered animation
export const ActivityListSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <View
      accessible={true}
      accessibilityLabel="Loading activities"
      accessibilityRole="none"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ActivityRowSkeleton key={index} delay={index * 80} />
      ))}
    </View>
  );
};

// Notification List Skeleton
export const NotificationListSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => {
  return (
    <View
      accessible={true}
      accessibilityLabel="Loading notifications"
      accessibilityRole="none"
    >
      {Array.from({ length: count }).map((_, index) => (
        <NotificationSkeleton key={index} delay={index * 60} />
      ))}
    </View>
  );
};

// Analytics Chart Skeleton
export const ChartSkeleton: React.FC<{ height?: number; delay?: number }> = ({
  height = 220,
  delay = 0
}) => {
  const { theme } = useTheme();
  const isExpoGo = Constants.appOwnership === 'expo';
  const skeletonSpeed = isExpoGo ? 0 : 1200;

  const fadeAnim = useSharedValue(0);

  React.useEffect(() => {
    fadeAnim.value = withTiming(1, {
      duration: 400,
      delay,
      easing: Easing.out(Easing.quad),
    });
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{
      scale: interpolate(fadeAnim.value, [0, 1], [0.95, 1]),
    }],
  }));

  return (
    <Animated.View
      style={[
        {
          height,
          backgroundColor: theme.colors.surface.primary,
          borderRadius: 16,
          padding: theme.spacing(4),
          marginVertical: theme.spacing(2),
          shadowColor: theme.colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.isDark ? 0.3 : 0.1,
          shadowRadius: 6,
          elevation: 3,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        animatedStyle,
      ]}
    >
      <SkeletonPlaceholder
        LinearGradientComponent={LinearGradient}
        backgroundColor={theme.isDark ? '#374151' : '#f3f4f6'}
        highlightColor={theme.isDark ? '#4b5563' : '#ffffff'}
        speed={skeletonSpeed}
        angle={45}
      >
        {/* Chart Title */}
        <View
          style={{
            width: '50%',
            height: 16,
            borderRadius: 4,
            marginBottom: theme.spacing(4),
          }}
        />

        {/* Chart Area */}
        <View
          style={{
            flex: 1,
            borderRadius: 8,
          }}
        />
      </SkeletonPlaceholder>
    </Animated.View>
  );
};

// Pulse Skeleton for simple loading states
export const PulseSkeleton: React.FC<SkeletonProps> = (props) => {
  const { theme } = useTheme();
  const pulseAnim = useSharedValue(0.3);

  React.useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseAnim.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: props.width || '100%',
          height: props.height || 20,
          borderRadius: props.borderRadius || 4,
          backgroundColor: theme.isDark ? '#374151' : '#f3f4f6',
        },
        animatedStyle,
        props.style,
      ]}
    />
  );
};

// Tips List Skeleton with horizontal scrolling layout
export const TipsListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingRight: theme.spacing(4),
      }}
      accessible={true}
      accessibilityLabel="Loading AI tips"
      accessibilityRole="none"
    >
      {Array.from({ length: count }).map((_, index) => (
        <TipCardSkeleton key={index} delay={index * 100} />
      ))}
    </View>
  );
};

// List Skeleton with enhanced staggered loading
export const ListSkeleton: React.FC<{
  itemCount?: number;
  ItemComponent?: React.ComponentType<{ delay?: number }>;
  staggerDelay?: number;
}> = ({
  itemCount = 5,
  ItemComponent = ActivityRowSkeleton,
  staggerDelay = 100
}) => {
  return (
    <View
      accessible={true}
      accessibilityLabel="Loading content"
      accessibilityRole="none"
    >
      {Array.from({ length: itemCount }).map((_, index) => (
        <ItemComponent key={index} delay={index * staggerDelay} />
      ))}
    </View>
  );
};
