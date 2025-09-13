# 🎨 UI/UX Components Agent

## Agent Profile
**Name:** Maria Rodriguez
**Title:** Principal Engineer, Meta (Design Systems)
**Experience:** 9 years at Meta, Workplace Design System, React Native Component Libraries
**Specialization:** Atomic Design, Performance-Optimized Animations, Accessibility Standards

---

## 🎯 Primary Responsibilities

### 1. Design System Foundation
- Create comprehensive theme tokens and color palette
- Build atomic design component library
- Implement consistent typography and spacing
- Ensure accessibility and cross-platform compatibility

### 2. Advanced Animations
- React Native Reanimated 3 implementations
- Micro-interactions and haptic feedback integration
- Performance-optimized gesture handling
- Smooth transitions and loading states

---

## 🛠️ Design System Implementation

### Theme Tokens
```typescript
// core/theme.ts - Comprehensive design system
export const colors = {
  // Brand colors
  primary: '#16a34a', // green-600
  primarySoft: '#dcfce7', // green-100
  primaryDark: '#166534', // green-800

  // Neutral palette
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Plant health status colors
  healthy: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',

  // Background variations
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },
};

export const typography = {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'SF Pro Text Medium' : 'Roboto Medium',
    bold: Platform.OS === 'ios' ? 'SF Pro Text Bold' : 'Roboto Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
};

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 999,
};

export const shadows = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
};
```

### Atomic Components

#### Button Component
```typescript
// components/atoms/Button.tsx - Production-ready button component
import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { haptic } from '../../core/haptics';
import { colors, typography, spacing, radius, shadows } from '../../core/theme';

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button = memo<ButtonProps>(({
  variant,
  size,
  children,
  onPress,
  disabled = false,
  loading = false,
  testID,
  leftIcon,
  rightIcon,
  fullWidth = false,
}) => {
  const scale = useSharedValue(1);

  const buttonStyle = useMemo(() => {
    return StyleSheet.flatten([
      styles.base,
      styles.size[size],
      styles.variant[variant],
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
    ]);
  }, [variant, size, fullWidth, disabled]);

  const textStyle = useMemo(() => {
    return StyleSheet.flatten([
      styles.text,
      styles.textSize[size],
      styles.textVariant[variant],
      disabled && styles.textDisabled,
    ]);
  }, [variant, size, disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  }, [disabled, loading, scale]);

  const handlePressOut = useCallback(() => {
    if (disabled || loading) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [disabled, loading, scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    // Trigger appropriate haptic feedback
    const hapticType = variant === 'primary' ? 'medium' : 'light';
    runOnJS(haptic)(hapticType);
    runOnJS(onPress)();
  }, [disabled, loading, variant, onPress]);

  return (
    <AnimatedPressable
      style={[buttonStyle, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          size={size === 'lg' ? 'large' : 'small'}
          color={variant === 'primary' ? colors.white : colors.primary}
        />
      ) : (
        <>
          {leftIcon && <Text style={[textStyle, { marginRight: spacing[2] }]}>{leftIcon}</Text>}
          <Text style={textStyle}>{children}</Text>
          {rightIcon && <Text style={[textStyle, { marginLeft: spacing[2] }]}>{rightIcon}</Text>}
        </>
      )}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    ...shadows.sm,
  },

  size: {
    sm: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      minHeight: 36,
    },
    md: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      minHeight: 44,
    },
    lg: {
      paddingHorizontal: spacing[6],
      paddingVertical: spacing[4],
      minHeight: 52,
    },
  },

  variant: {
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.gray[300],
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: colors.error,
    },
  },

  text: {
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },

  textSize: {
    sm: {
      fontSize: typography.fontSize.sm,
    },
    md: {
      fontSize: typography.fontSize.base,
    },
    lg: {
      fontSize: typography.fontSize.lg,
    },
  },

  textVariant: {
    primary: {
      color: colors.white,
    },
    secondary: {
      color: colors.gray[700],
    },
    ghost: {
      color: colors.primary,
    },
    danger: {
      color: colors.white,
    },
  },

  fullWidth: {
    width: '100%',
  },

  disabled: {
    opacity: 0.5,
  },

  textDisabled: {
    opacity: 0.7,
  },
});
```

#### Plant Status Chip
```typescript
// components/atoms/Chip.tsx - Status indicator component
interface ChipProps {
  status: PlantStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const Chip = memo<ChipProps>(({ status, size = 'md', showIcon = true }) => {
  const config = useMemo(() => {
    switch (status) {
      case 'Healthy':
        return {
          color: colors.healthy,
          backgroundColor: colors.success + '20',
          icon: '🌱',
          text: 'สุขภาพดี',
        };
      case 'Warning':
        return {
          color: colors.warning,
          backgroundColor: colors.warning + '20',
          icon: '⚠️',
          text: 'ต้องดูแล',
        };
      case 'Critical':
        return {
          color: colors.critical,
          backgroundColor: colors.error + '20',
          icon: '🚨',
          text: 'ต้องการความช่วยเหลือ',
        };
      default:
        return {
          color: colors.gray[500],
          backgroundColor: colors.gray[100],
          icon: '❓',
          text: 'ไม่ทราบสถานะ',
        };
    }
  }, [status]);

  return (
    <View
      style={[
        styles.chip,
        styles.chipSize[size],
        { backgroundColor: config.backgroundColor },
      ]}
    >
      {showIcon && <Text style={styles.chipIcon}>{config.icon}</Text>}
      <Text style={[styles.chipText, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
});
```

### Molecular Components

#### Plant Card
```typescript
// components/molecules/PlantCard.tsx - Optimized plant display card
interface PlantCardProps {
  plant: Plant;
  onPress: (plant: Plant) => void;
  size?: 'compact' | 'comfortable';
}

export const PlantCard = memo<PlantCardProps>(({ plant, onPress, size = 'comfortable' }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    runOnJS(haptic)('selection');
    runOnJS(onPress)(plant);
  }, [plant, onPress]);

  const imageSource = useMemo(() => {
    return plant.imageUrl
      ? { uri: plant.imageUrl }
      : require('../../assets/images/plant-placeholder.png');
  }, [plant.imageUrl]);

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPress={handlePress}
      testID={`plant-card-${plant.id}`}
    >
      <Image
        source={imageSource}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {plant.name}
          </Text>
          <Chip status={plant.status} size="sm" />
        </View>
        {plant.scientificName && (
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {plant.scientificName}
          </Text>
        )}
        <Text style={styles.cardDate}>
          อัปเดตล่าสุด: {formatThaiDate(plant.updatedAt)}
        </Text>
      </View>
    </AnimatedPressable>
  );
});
```

### Organism Components

#### App Header
```typescript
// components/organisms/AppHeader.tsx - Reusable header component
interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
}

export const AppHeader = memo<AppHeaderProps>(({
  title,
  showBack = false,
  onBack,
  rightAction,
  backgroundColor = colors.white,
}) => {
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: top, backgroundColor }]}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          {showBack && (
            <Pressable
              onPress={onBack}
              style={styles.backButton}
              hitSlop={8}
              testID="header-back-button"
            >
              <ChevronLeft size={24} color={colors.gray[700]} />
            </Pressable>
          )}
        </View>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.headerRight}>
          {rightAction}
        </View>
      </View>
    </View>
  );
});
```

---

## 🎭 Advanced Animations

### Loading Skeleton
```typescript
// components/atoms/Skeleton.tsx - Shimmer loading effect
export const Skeleton = memo<{ width?: number; height?: number; borderRadius?: number }>(
  ({ width = 100, height = 20, borderRadius = 4 }) => {
    const shimmer = useSharedValue(0);

    useEffect(() => {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
      const translateX = interpolate(
        shimmer.value,
        [0, 1],
        [-width, width],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ translateX }],
      };
    });

    return (
      <View
        style={[
          styles.skeleton,
          { width, height, borderRadius },
        ]}
      >
        <Animated.View style={[styles.shimmer, animatedStyle]} />
      </View>
    );
  }
);
```

### Floating Action Button
```typescript
// components/atoms/FloatingActionButton.tsx - Advanced FAB with gestures
export const FloatingActionButton = memo<{
  onPress: () => void;
  icon: React.ReactNode;
}>(({ onPress, icon }) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const gesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.1);
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      translateY.value = withSpring(0);
      runOnJS(haptic)('medium');
      runOnJS(onPress)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.fab, animatedStyle]}>
        {icon}
      </Animated.View>
    </GestureDetector>
  );
});
```

---

## 🧪 Component Testing

```typescript
describe('Button Component', () => {
  it('should render correctly with all variants', () => {
    const variants: ButtonProps['variant'][] = ['primary', 'secondary', 'ghost', 'danger'];

    variants.forEach(variant => {
      const { getByTestId } = render(
        <Button variant={variant} size="md" onPress={jest.fn()} testID={`button-${variant}`}>
          Test Button
        </Button>
      );

      expect(getByTestId(`button-${variant}`)).toBeTruthy();
    });
  });

  it('should trigger haptic feedback on press', async () => {
    const mockHaptic = jest.spyOn(require('../../core/haptics'), 'haptic');
    const mockOnPress = jest.fn();

    const { getByTestId } = render(
      <Button variant="primary" size="md" onPress={mockOnPress} testID="test-button">
        Test
      </Button>
    );

    fireEvent.press(getByTestId('test-button'));

    expect(mockHaptic).toHaveBeenCalledWith('medium');
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('should handle loading state correctly', () => {
    const { getByTestId } = render(
      <Button variant="primary" size="md" onPress={jest.fn()} loading testID="loading-button">
        Loading
      </Button>
    );

    expect(getByTestId('loading-button')).toBeTruthy();
    // Should show ActivityIndicator, not text
  });
});
```

---

## 📋 Delivery Checklist

### Phase 1 Deliverables
- ✅ Complete design system with theme tokens
- ✅ Atomic component library (Button, Chip, Input, etc.)
- ✅ Molecular components (Cards, Forms, Lists)
- ✅ Organism components (Headers, Navigation, etc.)
- ✅ Advanced animations with Reanimated 3

### Quality Standards
- 100% accessibility compliance
- Cross-platform consistency
- Performance-optimized animations
- Comprehensive testing coverage
- TypeScript strict mode compliance

---

**Next Steps:** Integration with Camera & Media Agent for complete user interface