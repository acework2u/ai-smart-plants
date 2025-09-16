import React, { useMemo, useCallback, memo } from 'react';
import {
  FlatList,
  FlatListProps,
  ViewStyle,
  Platform,
  RefreshControl,
  View,
  Text,
} from 'react-native';
import { MemoryManager, BundleAnalyzer } from '../../utils/performance';
import { useTheme } from '../../contexts/ThemeContext';

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  itemHeight?: number;
  enableVirtualization?: boolean;
  cacheExtent?: number;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  EmptyComponent?: React.ComponentType;
  style?: ViewStyle;
}

// Memoized empty state component
const DefaultEmptyComponent: React.FC<{
  title?: string;
  subtitle?: string;
}> = memo(({ title = 'No items', subtitle = 'Nothing to display' }) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing(8),
        paddingHorizontal: theme.spacing(4),
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: theme.colors.text.primary,
          marginBottom: theme.spacing(2),
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.text.secondary,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
});

function OptimizedFlatListComponent<T>({
  data,
  renderItem,
  itemHeight = 80,
  enableVirtualization = true,
  cacheExtent,
  onRefresh,
  refreshing = false,
  emptyTitle,
  emptySubtitle,
  EmptyComponent,
  style,
  ...otherProps
}: OptimizedFlatListProps<T>) {
  const { theme } = useTheme();

  // Performance configuration based on device capabilities
  const performanceConfig = useMemo(() => {
    const isLowEnd = BundleAnalyzer.isLowEndDevice();

    return {
      windowSize: isLowEnd ? 5 : 10,
      initialNumToRender: isLowEnd ? 5 : 10,
      maxToRenderPerBatch: isLowEnd ? 3 : 8,
      updateCellsBatchingPeriod: isLowEnd ? 200 : 100,
      getItemLayout: enableVirtualization && itemHeight ?
        (_: any, index: number) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        }) : undefined,
    };
  }, [enableVirtualization, itemHeight]);

  // Memoized virtualization config
  const virtualizationConfig = useMemo(() => {
    if (!enableVirtualization) return {};

    return MemoryManager.createVirtualizedConfig(itemHeight, !itemHeight);
  }, [enableVirtualization, itemHeight]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: any, index: number) => {
    return item.id || item.key || String(index);
  }, []);

  // Memoized render item with performance tracking
  const memoizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      return renderItem({ item, index });
    },
    [renderItem]
  );

  // Refresh control with proper styling
  const refreshControlComponent = useMemo(() => {
    if (!onRefresh) return undefined;

    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={theme.colors.primary}
        colors={[theme.colors.primary]}
        progressBackgroundColor={theme.colors.background.primary}
        style={{ backgroundColor: 'transparent' }}
      />
    );
  }, [onRefresh, refreshing, theme]);

  // Empty component
  const emptyComponent = useMemo(() => {
    if (EmptyComponent) {
      return <EmptyComponent />;
    }

    return (
      <DefaultEmptyComponent
        title={emptyTitle}
        subtitle={emptySubtitle}
      />
    );
  }, [EmptyComponent, emptyTitle, emptySubtitle]);

  // Handle memory cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Cleanup any cached data related to this list
      if (__DEV__) {
        console.log('🧹 OptimizedFlatList cleanup');
      }
    };
  }, []);

  return (
    <FlatList
      {...otherProps}
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={keyExtractor}
      style={[{ backgroundColor: theme.colors.background.primary }, style]}
      contentContainerStyle={[
        { flexGrow: 1 },
        otherProps.contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      removeClippedSubviews={Platform.select({
        android: true,
        ios: false, // Can cause issues on iOS with dynamic content
        default: true,
      })}
      // Performance optimizations
      {...performanceConfig}
      {...virtualizationConfig}
      // Cache extent for better scrolling performance
      maintainVisibleContentPosition={
        cacheExtent ? { minIndexForVisible: 0, autoscrollToTopThreshold: cacheExtent } : undefined
      }
      // Refresh control
      refreshControl={refreshControlComponent}
      // Empty state
      ListEmptyComponent={data.length === 0 ? emptyComponent : null}
      // Optimize for memory
      legacyImplementation={false}
    />
  );
}

// Export memoized component to prevent unnecessary re-renders
export const OptimizedFlatList = memo(OptimizedFlatListComponent) as <T>(
  props: OptimizedFlatListProps<T>
) => React.ReactElement;

// Specialized components for common use cases

// Plant list optimized for garden display
export const OptimizedPlantList = memo(<T,>({
  plants,
  onPlantPress,
  ...otherProps
}: {
  plants: T[];
  onPlantPress: (plant: T) => void;
} & Partial<OptimizedFlatListProps<T>>) => {
  const renderPlantItem = useCallback(
    ({ item }: { item: T; index: number }) => {
      // This would be replaced with actual PlantCard component
      return <View style={{ height: 120 }} />;
    },
    [onPlantPress]
  );

  return (
    <OptimizedFlatList
      data={plants}
      renderItem={renderPlantItem}
      itemHeight={120}
      emptyTitle="No plants found"
      emptySubtitle="Start by adding your first plant"
      {...otherProps}
    />
  );
});

// Activity list optimized for activity feed
export const OptimizedActivityList = memo(<T,>({
  activities,
  onActivityPress,
  ...otherProps
}: {
  activities: T[];
  onActivityPress?: (activity: T) => void;
} & Partial<OptimizedFlatListProps<T>>) => {
  const renderActivityItem = useCallback(
    ({ item }: { item: T; index: number }) => {
      // This would be replaced with actual ActivityItem component
      return <View style={{ height: 80 }} />;
    },
    [onActivityPress]
  );

  return (
    <OptimizedFlatList
      data={activities}
      renderItem={renderActivityItem}
      itemHeight={80}
      emptyTitle="No activities"
      emptySubtitle="Your plant activities will appear here"
      {...otherProps}
    />
  );
});

// Notification list optimized for notification display
export const OptimizedNotificationList = memo(<T,>({
  notifications,
  onNotificationPress,
  ...otherProps
}: {
  notifications: T[];
  onNotificationPress?: (notification: T) => void;
} & Partial<OptimizedFlatListProps<T>>) => {
  const renderNotificationItem = useCallback(
    ({ item }: { item: T; index: number }) => {
      // This would be replaced with actual NotificationItem component
      return <View style={{ height: 100 }} />;
    },
    [onNotificationPress]
  );

  return (
    <OptimizedFlatList
      data={notifications}
      renderItem={renderNotificationItem}
      itemHeight={100}
      emptyTitle="No notifications"
      emptySubtitle="You're all caught up!"
      {...otherProps}
    />
  );
});

export default OptimizedFlatList;