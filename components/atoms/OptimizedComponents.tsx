import React, { memo, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleSheet,
} from 'react-native';
import { Leaf } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ImageOptimizer, MemoryManager } from '../../utils/performance';
import { Card, Chip } from './index';
import { radius } from '../../core/theme';

// Optimized Plant Card with memoization and image caching
interface OptimizedPlantCardProps {
  plant: {
    id: string;
    name: string;
    scientificName?: string;
    status: 'Healthy' | 'Warning' | 'Critical';
    imageUri?: string;
    lastWatered?: Date;
  };
  onPress: (plantId: string) => void;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const OptimizedPlantCard = memo<OptimizedPlantCardProps>(({ 
  plant,
  onPress,
  size = 'medium',
  style,
}) => {
  const { theme } = useTheme();

  // Memoize expensive calculations
  const { dimensions, imageSize } = useMemo(() => {
    const sizes = {
      small: { width: 120, height: 140, imageSize: 60 },
      medium: { width: 160, height: 180, imageSize: 80 },
      large: { width: 200, height: 220, imageSize: 100 },
    };
    return {
      dimensions: { width: sizes[size].width, height: sizes[size].height },
      imageSize: sizes[size].imageSize,
    };
  }, [size]);

  // Memoize press handler
  const handlePress = useCallback(() => {
    onPress(plant.id);
  }, [onPress, plant.id]);

  // Memoize optimized image URI
  const optimizedImageUri = useMemo(() => {
    if (!plant.imageUri) return null;

    const cacheKey = `plant_${plant.id}_${size}`;
    const cached = ImageOptimizer.getCachedImage(cacheKey);

    if (cached) return cached;

    const optimized = ImageOptimizer.getOptimizedImageUrl(
      plant.imageUri,
      imageSize,
      imageSize,
      75
    );

    // Cache for future use
    ImageOptimizer.cacheImage(cacheKey, optimized, imageSize * imageSize * 0.5);
    return optimized;
  }, [plant.imageUri, plant.id, size, imageSize]);

  // Memoize styles
  const cardStyles = useMemo(() =>
    StyleSheet.create({
      container: {
        width: dimensions.width,
        height: dimensions.height,
        ...style,
      },
      imageContainer: {
        width: imageSize,
        height: imageSize,
        borderRadius: radius.lg,
        backgroundColor: theme.colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing(2),
        alignSelf: 'center',
      },
      image: {
        width: imageSize,
        height: imageSize,
        borderRadius: radius.lg,
      },
      content: {
        flex: 1,
        alignItems: 'center',
      },
      name: {
        fontSize: size === 'small' ? 12 : size === 'medium' ? 14 : 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: theme.spacing(1),
      },
      scientificName: {
        fontSize: size === 'small' ? 10 : size === 'medium' ? 12 : 14,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: theme.spacing(2),
      },
    })
  , [theme, dimensions, imageSize, size, style]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={cardStyles.container} variant="default">
        <View style={cardStyles.imageContainer}>
          {optimizedImageUri ? (
            <Image
              source={{ uri: optimizedImageUri }}
              style={cardStyles.image}
              resizeMode="cover"
              onError={() => {
                // Remove from cache if image fails to load
                const cacheKey = `plant_${plant.id}_${size}`;
                ImageOptimizer.removeFromCache(cacheKey);
              }}
            />
          ) : (
            <Leaf size={imageSize * 0.6} color={theme.colors.primary} />
          )}
        </View>

        <View style={cardStyles.content}>
          <Text style={cardStyles.name} numberOfLines={1}>
            {plant.name}
          </Text>

          {plant.scientificName && (
            <Text style={cardStyles.scientificName} numberOfLines={1}>
              {plant.scientificName}
            </Text>
          )}

          <Chip
            label={plant.status}
            status={plant.status}
            variant="status"
            size="sm"
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
});
OptimizedPlantCard.displayName = 'OptimizedPlantCard';

// Optimized Activity Item with memoization
interface OptimizedActivityItemProps {
  activity: {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    plantName?: string;
    icon?: string;
  };
  onPress?: (activityId: string) => void;
  style?: ViewStyle;
}

export const OptimizedActivityItem = memo<OptimizedActivityItemProps>(({ 
  activity,
  onPress,
  style,
}) => {
  const { theme } = useTheme();

  // Memoize press handler
  const handlePress = useCallback(() => {
    onPress?.(activity.id);
  }, [onPress, activity.id]);

  // Memoize formatted time
  const formattedTime = useMemo(() => {
    const now = new Date();
    const diff = now.getTime() - activity.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }, [activity.timestamp]);

  // Memoize styles
  const itemStyles = useMemo(() => ({
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: theme.spacing(3),
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      ...style,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: theme.spacing(3),
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing(0.5),
    },
    description: {
      fontSize: 12,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing(0.5),
    },
    meta: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    plantName: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '500' as const,
    },
    time: {
      fontSize: 11,
      color: theme.colors.text.tertiary,
    },
  }), [theme, style]);

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component onPress={onPress ? handlePress : undefined} activeOpacity={0.7}>
      <View style={itemStyles.container}>
        <View style={itemStyles.iconContainer}>
          <Text style={{ fontSize: 18 }}>{activity.icon || '🌱'}</Text>
        </View>

        <View style={itemStyles.content}>
          <Text style={itemStyles.title} numberOfLines={1}>
            {activity.title}
          </Text>
          <Text style={itemStyles.description} numberOfLines={2}>
            {activity.description}
          </Text>

          <View style={itemStyles.meta}>
            {activity.plantName && (
              <Text style={itemStyles.plantName} numberOfLines={1}>
                {activity.plantName}
              </Text>
            )}
            <Text style={itemStyles.time}>{formattedTime}</Text>
          </View>
        </View>
      </View>
    </Component>
  );
});
OptimizedActivityItem.displayName = 'OptimizedActivityItem';

// Optimized Notification Item with memoization
interface OptimizedNotificationItemProps {
  notification: {
    id: string;
    title: string;
    body: string;
    timestamp: Date;
    read: boolean;
    type: 'reminder' | 'alert' | 'info';
    plantId?: string;
    plantName?: string;
  };
  onPress?: (notificationId: string) => void;
  onMarkRead?: (notificationId: string) => void;
  style?: ViewStyle;
}

export const OptimizedNotificationItem = memo<OptimizedNotificationItemProps>(({ 
  notification,
  onPress,
  onMarkRead,
  style,
}) => {
  const { theme } = useTheme();

  // Memoize press handler
  const handlePress = useCallback(() => {
    onPress?.(notification.id);
    if (!notification.read) {
      onMarkRead?.(notification.id);
    }
  }, [onPress, onMarkRead, notification.id, notification.read]);

  // Memoize notification icon and color
  const { icon, color } = useMemo(() => {
    const configs = {
      reminder: { icon: '⏰', color: theme.colors.blue },
      alert: { icon: '⚠️', color: theme.colors.orange },
      info: { icon: 'ℹ️', color: theme.colors.primary },
    };
    return configs[notification.type] || configs.info;
  }, [notification.type, theme]);

  // Memoize formatted time
  const formattedTime = useMemo(() => {
    const now = new Date();
    const diff = now.getTime() - notification.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  }, [notification.timestamp]);

  // Memoize styles
  const itemStyles = useMemo(() => ({
    container: {
      flexDirection: 'row' as const,
      padding: theme.spacing(4),
      backgroundColor: notification.read ? theme.colors.card : theme.colors.primarySoft,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      ...style,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: color,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: theme.spacing(3),
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: theme.spacing(1),
    },
    title: {
      flex: 1,
      fontSize: 14,
      fontWeight: notification.read ? '500' : '600',
      color: theme.colors.text.primary,
      marginRight: theme.spacing(2),
    },
    time: {
      fontSize: 11,
      color: theme.colors.text.tertiary,
    },
    body: {
      fontSize: 13,
      color: theme.colors.text.secondary,
      lineHeight: 18,
      marginBottom: theme.spacing(1),
    },
    plantName: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '500' as const,
    },
    unreadIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      position: 'absolute' as const,
      top: 4,
      right: 4,
    },
  }), [theme, notification.read, color, style]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View style={itemStyles.container}>
        <View style={itemStyles.iconContainer}>
          <Text style={{ fontSize: 16 }}>{icon}</Text>
        </View>

        <View style={itemStyles.content}>
          <View style={itemStyles.header}>
            <Text style={itemStyles.title} numberOfLines={2}>
              {notification.title}
            </Text>
            <Text style={itemStyles.time}>{formattedTime}</Text>
          </View>

          <Text style={itemStyles.body} numberOfLines={3}>
            {notification.body}
          </Text>

          {notification.plantName && (
            <Text style={itemStyles.plantName} numberOfLines={1}>
              📱 {notification.plantName}
            </Text>
          )}
        </View>

        {!notification.read && <View style={itemStyles.unreadIndicator} />}
      </View>
    </TouchableOpacity>
  );
});
OptimizedNotificationItem.displayName = 'OptimizedNotificationItem';

// Performance-optimized image component with lazy loading
interface OptimizedImageProps {
  uri: string;
  width: number;
  height: number;
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = memo<OptimizedImageProps>(({ 
  uri,
  width,
  height,
  style,
  resizeMode = 'cover',
  placeholder,
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  // Memoize optimized URI
  const optimizedUri = useMemo(() => {
    const cacheKey = `image_${uri}_${width}x${height}`;
    const cached = ImageOptimizer.getCachedImage(cacheKey);

    if (cached) return cached;

    const optimized = ImageOptimizer.getOptimizedImageUrl(uri, width, height);
    ImageOptimizer.cacheImage(cacheKey, optimized, width * height * 0.3);
    return optimized;
  }, [uri, width, height]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    // Remove from cache on error
    const cacheKey = `image_${uri}_${width}x${height}`;
    ImageOptimizer.removeFromCache(cacheKey);
    onError?.();
  }, [onError, uri, width, height]);

  if (hasError) {
    return (
      <View style={[{ width, height, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }, style]}>
        {placeholder || <Text>Failed to load</Text>}
      </View>
    );
  }

  return (
    <View style={[{ width, height }, style]}>
      <Image
        source={{ uri: optimizedUri }}
        style={{ width, height }}
        resizeMode={resizeMode}
        onLoad={handleLoad}
        onError={handleError}
      />
      {isLoading && placeholder && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
          {placeholder}
        </View>
      )}
    </View>
  );
});
OptimizedImage.displayName = 'OptimizedImage';

// Note: components are already exported above via named exports.
// Avoid re-exporting the same identifiers to prevent duplicate export errors.
