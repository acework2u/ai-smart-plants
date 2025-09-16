import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ListRenderItem,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Bell,
  BellRing,
  Brain,
  AlertTriangle,
  Trophy,
  Settings as SettingsIcon,
  Check,
  X,
  Filter,
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../core/theme';
import { useHaptic } from '../../core/haptics';
import { NotiItem, NotiType, formatNotificationTime } from '../../types/notifications';
import EmptyState from '../atoms/EmptyState';
import Chip from '../atoms/Chip';

interface NotificationCenterProps {
  notifications: NotiItem[];
  onRefresh: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onNotificationPress: (notification: NotiItem) => void;
  refreshing?: boolean;
}

interface FilterOption {
  id: NotiType | 'all';
  label: string;
  icon: React.ComponentType<any>;
  count: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const NotificationItem: React.FC<{
  notification: NotiItem;
  onPress: () => void;
  onMarkAsRead: () => void;
  onDismiss: () => void;
}> = ({ notification, onPress, onMarkAsRead, onDismiss }) => {
  const haptic = useHaptic();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const getTypeIcon = () => {
    switch (notification.type) {
      case 'reminder':
        return BellRing;
      case 'ai':
        return Brain;
      case 'alert':
        return AlertTriangle;
      case 'achievement':
        return Trophy;
      case 'system':
        return SettingsIcon;
      default:
        return Bell;
    }
  };

  const getTypeColor = () => {
    switch (notification.type) {
      case 'reminder':
        return colors.info;
      case 'ai':
        return colors.primary;
      case 'alert':
        return colors.warning;
      case 'achievement':
        return colors.success;
      case 'system':
        return colors.gray[500];
      default:
        return colors.gray[500];
    }
  };

  const handlePress = () => {
    haptic.trigger('light');

    // Scale animation
    scale.value = withSpring(0.95, { duration: 100 }, () => {
      scale.value = withSpring(1, { duration: 100 }, () => {
        // Guard and schedule on JS thread safely
        runOnJS(() => onPress && onPress())();
      });
    });
  };

  const handleMarkAsRead = () => {
    haptic.trigger('success');
    onMarkAsRead();
  };

  const handleDismiss = () => {
    haptic.trigger('warning');

    // Fade out animation
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(() => onDismiss && onDismiss())();
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const Icon = getTypeIcon();
  const typeColor = getTypeColor();

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification,
        animatedStyle,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Unread indicator */}
      {!notification.read && <View style={styles.unreadIndicator} />}

      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${typeColor}15` }]}>
        <Icon size={20} color={typeColor} strokeWidth={2} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.notificationHeader}>
          <Text
            style={[
              styles.title,
              !notification.read && styles.unreadTitle,
            ]}
            numberOfLines={2}
          >
            {notification.title}
          </Text>
          <Text style={styles.timeLabel}>
            {notification.timeLabel}
          </Text>
        </View>

        {notification.detail && (
          <Text
            style={[
              styles.detail,
              !notification.read && styles.unreadDetail,
            ]}
            numberOfLines={3}
          >
            {notification.detail}
          </Text>
        )}

        <View style={styles.typeChip}>
          <Chip
            text={getTypeLabel(notification.type)}
            variant="outline"
            size="small"
            color={typeColor}
          />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {!notification.read && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMarkAsRead}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Check size={18} color={colors.success} strokeWidth={2} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={18} color={colors.gray[500]} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </AnimatedTouchableOpacity>
  );
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onNotificationPress,
  refreshing = false,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<NotiType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const haptic = useHaptic();

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<NotiType | 'all', number> = {
      all: notifications.length,
      reminder: 0,
      ai: 0,
      alert: 0,
      achievement: 0,
      system: 0,
    };

    notifications.forEach(notification => {
      counts[notification.type]++;
    });

    return counts;
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (selectedFilter === 'all') {
      return notifications;
    }
    return notifications.filter(n => n.type === selectedFilter);
  }, [notifications, selectedFilter]);

  // Filter options
  const filterOptions: FilterOption[] = [
    { id: 'all', label: 'ทั้งหมด', icon: Bell, count: filterCounts.all },
    { id: 'reminder', label: 'เตือน', icon: BellRing, count: filterCounts.reminder },
    { id: 'ai', label: 'คำแนะนำ AI', icon: Brain, count: filterCounts.ai },
    { id: 'alert', label: 'แจ้งเหตุ', icon: AlertTriangle, count: filterCounts.alert },
    { id: 'achievement', label: 'ความสำเร็จ', icon: Trophy, count: filterCounts.achievement },
    { id: 'system', label: 'ระบบ', icon: SettingsIcon, count: filterCounts.system },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;

    Alert.alert(
      'ทำเครื่องหมายว่าอ่านแล้ว',
      `ต้องการทำเครื่องหมายการแจ้งเตือน ${unreadCount} รายการว่าอ่านแล้วใช่หรือไม่?`,
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
          onPress: () => haptic.trigger('light'),
        },
        {
          text: 'ทำเครื่องหมาย',
          style: 'default',
          onPress: () => {
            haptic.trigger('success');
            onMarkAllAsRead();
          },
        },
      ]
    );
  };

  const handleFilterPress = (filterId: NotiType | 'all') => {
    haptic.tabSwitch();
    setSelectedFilter(filterId);
  };

  const handleToggleFilters = () => {
    haptic.trigger('light');
    setShowFilters(!showFilters);
  };

  const renderNotification: ListRenderItem<NotiItem> = ({ item }) => (
    <NotificationItem
      notification={item}
      onPress={() => onNotificationPress(item)}
      onMarkAsRead={() => onMarkAsRead(item.id)}
      onDismiss={() => onDismiss(item.id)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Title and Actions */}
      <View style={styles.titleRow}>
        <Text style={styles.headerTitle}>การแจ้งเตือน</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterToggle}
            onPress={handleToggleFilters}
            activeOpacity={0.7}
          >
            <Filter size={20} color={colors.gray[600]} strokeWidth={2} />
          </TouchableOpacity>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
              activeOpacity={0.8}
            >
              <Text style={styles.markAllText}>ทำเครื่องหมายทั้งหมด</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <FlatList
            data={filterOptions}
            renderItem={({ item }) => {
              const Icon = item.icon;
              const isSelected = selectedFilter === item.id;

              return (
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    isSelected && styles.filterButtonActive,
                  ]}
                  onPress={() => handleFilterPress(item.id)}
                  activeOpacity={0.7}
                >
                  <Icon
                    size={16}
                    color={isSelected ? colors.white : colors.gray[600]}
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      isSelected && styles.filterButtonTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.count > 0 && (
                    <View
                      style={[
                        styles.filterBadge,
                        isSelected && styles.filterBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterBadgeText,
                          isSelected && styles.filterBadgeTextActive,
                        ]}
                      >
                        {item.count > 99 ? '99+' : item.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
            ItemSeparatorComponent={() => <View style={{ width: spacing[2] }} />}
          />
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon={Bell}
      title="ไม่มีการแจ้งเตือน"
      description={
        selectedFilter === 'all'
          ? "ยังไม่มีการแจ้งเตือนใหม่"
          : `ไม่มีการแจ้งเตือนประเภท${filterOptions.find(f => f.id === selectedFilter)?.label}`
      }
      size="medium"
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const getTypeLabel = (type: NotiType): string => {
  switch (type) {
    case 'reminder':
      return 'เตือน';
    case 'ai':
      return 'AI';
    case 'alert':
      return 'แจ้งเหตุ';
    case 'achievement':
      return 'ความสำเร็จ';
    case 'system':
      return 'ระบบ';
    default:
      return 'ทั่วไป';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing[6],
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterToggle: {
    padding: spacing[2],
    marginRight: spacing[2],
  },
  markAllButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
  },
  markAllText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    color: colors.white,
  },
  filtersContainer: {
    paddingBottom: spacing[4],
  },
  filtersContent: {
    paddingHorizontal: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.gray[100],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    color: colors.text.primary,
    marginLeft: spacing[2],
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  filterBadge: {
    backgroundColor: colors.gray[300],
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    marginLeft: spacing[2],
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: colors.white,
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    color: colors.text.primary,
  },
  filterBadgeTextActive: {
    color: colors.primary,
  },
  separator: {
    height: spacing[2],
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: colors.primarySoft,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  unreadIndicator: {
    position: 'absolute',
    top: spacing[4],
    left: spacing[2],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
    marginRight: spacing[2],
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    color: colors.text.primary,
    lineHeight: typography.fontSize.base * 1.3,
    marginRight: spacing[2],
  },
  unreadTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontWeight: '600',
  },
  timeLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    fontWeight: '400',
    color: colors.text.tertiary,
    flexShrink: 0,
  },
  detail: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: typography.fontSize.sm * 1.4,
    marginBottom: spacing[2],
  },
  unreadDetail: {
    color: colors.text.primary,
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  actionButton: {
    padding: spacing[2],
    marginBottom: spacing[1],
  },
});

export default NotificationCenter;
