import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Animated, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  transparent = false
}) => {
  const { theme } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start spin animation
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );

      // Fade in animation
      const fadeAnimation = Animated.timing(fadeValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      });

      spinAnimation.start();
      fadeAnimation.start();

      return () => {
        spinAnimation.stop();
        fadeAnimation.stop();
      };
    } else {
      // Fade out
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, spinValue, fadeValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} statusBarTranslucent>
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: transparent
              ? 'transparent'
              : theme.colors.background.overlay,
            opacity: fadeValue,
          }
        ]}
      >
        <View style={[
          styles.container,
          { backgroundColor: theme.colors.surface.elevated }
        ]}>
          {/* Custom loading spinner with plant theme */}
          <Animated.View
            style={[
              styles.spinner,
              {
                borderColor: theme.colors.gray300,
                borderTopColor: theme.colors.primary,
                transform: [{ rotate: spin }]
              }
            ]}
          />

          <Text style={[
            styles.message,
            { color: theme.colors.text.primary }
          ]}>
            {message}
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

// Success Animation Component
export const SuccessAnimation: React.FC<{
  visible: boolean;
  message: string;
  onComplete?: () => void;
}> = ({ visible, message, onComplete }) => {
  const { theme } = useTheme();
  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Success animation sequence
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleValue, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(fadeValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1500),
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        scaleValue.setValue(0);
        onComplete?.();
      });
    }
  }, [visible, scaleValue, fadeValue, onComplete]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} statusBarTranslucent>
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: theme.colors.background.overlayLight,
            opacity: fadeValue,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.successContainer,
            {
              backgroundColor: theme.colors.surface.elevated,
              transform: [{ scale: scaleValue }]
            }
          ]}
        >
          {/* Success checkmark */}
          <View style={[
            styles.successIcon,
            { backgroundColor: theme.colors.success }
          ]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>

          <Text style={[
            styles.successMessage,
            { color: theme.colors.text.primary }
          ]}>
            {message}
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Error Animation Component
export const ErrorAnimation: React.FC<{
  visible: boolean;
  message: string;
  onComplete?: () => void;
}> = ({ visible, message, onComplete }) => {
  const { theme } = useTheme();
  const shakeValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Error shake animation
      Animated.sequence([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(shakeValue, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeValue, {
            toValue: -10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeValue, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeValue, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1500),
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete?.();
      });
    }
  }, [visible, shakeValue, fadeValue, onComplete]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} statusBarTranslucent>
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: theme.colors.background.overlayLight,
            opacity: fadeValue,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.errorContainer,
            {
              backgroundColor: theme.colors.surface.elevated,
              transform: [{ translateX: shakeValue }]
            }
          ]}
        >
          {/* Error X icon */}
          <View style={[
            styles.errorIcon,
            { backgroundColor: theme.colors.error }
          ]}>
            <Text style={styles.errorMark}>×</Text>
          </View>

          <Text style={[
            styles.errorMessage,
            { color: theme.colors.text.primary }
          ]}>
            {message}
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  spinner: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  successContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorMark: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
    lineHeight: 40,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoadingOverlay;