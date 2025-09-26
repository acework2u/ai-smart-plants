import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Leaf, Camera, Wifi, Search, Upload, Download, Sync } from 'lucide-react-native';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { radius, typography } from '../../core/theme';

export interface LoadingProps {
  visible: boolean;
  type?: LoadingType;
  message?: string;
  progress?: number;
  subMessage?: string;
  timeout?: number;
  onTimeout?: () => void;
}

export type LoadingType =
  | 'default'
  | 'auth'
  | 'plant-scan'
  | 'upload'
  | 'download'
  | 'sync'
  | 'search'
  | 'network'
  | 'processing';

const { width: screenWidth } = Dimensions.get('window');

export const Loading: React.FC<LoadingProps> = ({
  visible,
  type = 'default',
  message,
  progress,
  subMessage,
  timeout,
  onTimeout,
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Animate visibility
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start rotation animation for spinning indicators
      if (['sync', 'processing', 'network'].includes(type)) {
        Animated.loop(
          Animated.timing(rotation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ).start();
      }

      // Setup timeout
      if (timeout && onTimeout) {
        timeoutRef.current = setTimeout(onTimeout, timeout);
      }
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      rotation.setValue(0);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, type, timeout, onTimeout, opacity, scale, rotation]);

  // Animate progress
  useEffect(() => {
    if (progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, progressAnim]);

  const getLoadingIcon = () => {
    const iconSize = 32;
    const iconColor = theme.colors.primary;

    const rotateInterpolation = rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const rotatingStyle = {
      transform: [{ rotate: rotateInterpolation }],
    };

    switch (type) {
      case 'auth':
        return <Leaf size={iconSize} color={iconColor} />;
      case 'plant-scan':
        return <Camera size={iconSize} color={iconColor} />;
      case 'upload':
        return <Upload size={iconSize} color={iconColor} />;
      case 'download':
        return <Download size={iconSize} color={iconColor} />;
      case 'search':
        return <Search size={iconSize} color={iconColor} />;
      case 'network':
        return (
          <Animated.View style={rotatingStyle}>
            <Wifi size={iconSize} color={iconColor} />
          </Animated.View>
        );
      case 'sync':
        return (
          <Animated.View style={rotatingStyle}>
            <Sync size={iconSize} color={iconColor} />
          </Animated.View>
        );
      case 'processing':
        return (
          <Animated.View style={rotatingStyle}>
            <ActivityIndicator size="large" color={iconColor} />
          </Animated.View>
        );
      default:
        return <ActivityIndicator size="large" color={iconColor} />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'auth':
        return 'กำลังเข้าสู่ระบบ...';
      case 'plant-scan':
        return 'กำลังวิเคราะห์ภาพต้นไม้...';
      case 'upload':
        return 'กำลังอัพโหลด...';
      case 'download':
        return 'กำลังดาวน์โหลด...';
      case 'search':
        return 'กำลังค้นหา...';
      case 'network':
        return 'กำลังเชื่อมต่อ...';
      case 'sync':
        return 'กำลังซิงค์ข้อมูล...';
      case 'processing':
        return 'กำลังประมวลผล...';
      default:
        return 'กำลังโหลด...';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          {getLoadingIcon()}
        </View>

        <Text style={styles.message}>
          {message || getDefaultMessage()}
        </Text>

        {subMessage && (
          <Text style={styles.subMessage}>
            {subMessage}
          </Text>
        )}

        {progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress)}%
            </Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

// Skeleton loading components
export const SkeletonLoader: React.FC<{
  visible: boolean;
  type: 'list' | 'card' | 'text' | 'image' | 'profile';
  count?: number;
}> = ({ visible, type, count = 1 }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createSkeletonStyles(theme), [theme]);

  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, opacity]);

  if (!visible) return null;

  const renderSkeleton = () => {
    switch (type) {
      case 'list':
        return Array.from({ length: count }).map((_, index) => (
          <Animated.View key={index} style={[styles.listItem, { opacity }]}>
            <View style={styles.avatar} />
            <View style={styles.content}>
              <View style={styles.title} />
              <View style={styles.subtitle} />
            </View>
          </Animated.View>
        ));

      case 'card':
        return Array.from({ length: count }).map((_, index) => (
          <Animated.View key={index} style={[styles.card, { opacity }]}>
            <View style={styles.cardImage} />
            <View style={styles.cardContent}>
              <View style={styles.cardTitle} />
              <View style={styles.cardSubtitle} />
            </View>
          </Animated.View>
        ));

      case 'text':
        return Array.from({ length: count }).map((_, index) => (
          <Animated.View key={index} style={[styles.textLine, { opacity }]} />
        ));

      case 'image':
        return Array.from({ length: count }).map((_, index) => (
          <Animated.View key={index} style={[styles.imagePlaceholder, { opacity }]} />
        ));

      case 'profile':
        return (
          <Animated.View style={[styles.profile, { opacity }]}>
            <View style={styles.profileAvatar} />
            <View style={styles.profileName} />
            <View style={styles.profileBio} />
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderSkeleton()}</View>;
};

// Loading button component
export const LoadingButton: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  onPress?: () => void;
}> = ({ loading, children, loadingText, disabled, style, textStyle, onPress }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createButtonStyles(theme), [theme]);

  return (
    <Animated.View
      style={[
        styles.button,
        (loading || disabled) && styles.buttonDisabled,
        style,
      ]}
      onTouchEnd={loading || disabled ? undefined : onPress}
    >
      {loading ? (
        <View style={styles.loadingContent}>
          <ActivityIndicator
            size="small"
            color={theme.colors.white}
            style={styles.spinner}
          />
          <Text style={[styles.buttonText, textStyle]}>
            {loadingText || 'กำลังโหลด...'}
          </Text>
        </View>
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{children}</Text>
      )}
    </Animated.View>
  );
};

// Shimmer effect component
export const ShimmerPlaceholder: React.FC<{
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}> = ({ width, height, borderRadius = 4, style }) => {
  const { theme } = useTheme();
  const shimmerOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerOpacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: theme.colors.surface.secondary,
          borderRadius,
          opacity: shimmerOpacity,
        },
        style,
      ]}
    />
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    container: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: radius.xl,
      padding: theme.spacing(6),
      alignItems: 'center',
      minWidth: 200,
      shadowColor: theme.colors.black,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    iconContainer: {
      marginBottom: theme.spacing(4),
    },
    message: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: theme.spacing(2),
    },
    subMessage: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing(4),
    },
    progressContainer: {
      width: '100%',
      alignItems: 'center',
    },
    progressTrack: {
      width: '100%',
      height: 4,
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: theme.spacing(2),
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
    progressText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontFamily: typography.fontFamily.medium,
    },
  });

const createSkeletonStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      padding: theme.spacing(4),
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing(3),
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface.secondary,
      marginRight: theme.spacing(3),
    },
    content: {
      flex: 1,
    },
    title: {
      height: 16,
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: 4,
      marginBottom: theme.spacing(2),
      width: '70%',
    },
    subtitle: {
      height: 12,
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: 4,
      width: '50%',
    },
    card: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: radius.lg,
      marginBottom: theme.spacing(4),
      overflow: 'hidden',
    },
    cardImage: {
      height: 200,
      backgroundColor: theme.colors.surface.secondary,
    },
    cardContent: {
      padding: theme.spacing(4),
    },
    cardTitle: {
      height: 18,
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: 4,
      marginBottom: theme.spacing(2),
      width: '80%',
    },
    cardSubtitle: {
      height: 14,
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: 4,
      width: '60%',
    },
    textLine: {
      height: 16,
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: 4,
      marginBottom: theme.spacing(2),
      width: '100%',
    },
    imagePlaceholder: {
      width: '100%',
      height: 200,
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: radius.lg,
      marginBottom: theme.spacing(4),
    },
    profile: {
      alignItems: 'center',
      padding: theme.spacing(6),
    },
    profileAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surface.secondary,
      marginBottom: theme.spacing(4),
    },
    profileName: {
      height: 20,
      width: 120,
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: 4,
      marginBottom: theme.spacing(2),
    },
    profileBio: {
      height: 16,
      width: 200,
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: 4,
    },
  });

const createButtonStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: radius.lg,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing(4),
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.white,
    },
    loadingContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spinner: {
      marginRight: theme.spacing(2),
    },
  });