import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { format, isToday, isYesterday, parseISO, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityEntry,
  ActivityKind,
  ActivityFilter,
  ActivityStats,
  getActivityIcon,
  getActivityColor,
  formatQuantityWithUnit,
} from '../../types/activity';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { EmptyState } from '../atoms/EmptyState';
import { colors, spacing, radius, typography } from '../../core/theme';
import { haptic } from '../../core/haptics';

interface ActivityHistoryProps {
  activities: ActivityEntry[];
  stats: ActivityStats | null;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onEditActivity?: (activity: ActivityEntry) => void;
  onDeleteActivity?: (activityId: string) => void;
  onFilterChange?: (filter: ActivityFilter | null) => void;
  showStats?: boolean;
  showFilters?: boolean;
  maxItems?: number;
}

const { width } = Dimensions.get('window');

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  activities,
  stats,
  isLoading = false,
  onRefresh,
  onEditActivity,
  onDeleteActivity,
  onFilterChange,
  showStats = true,
  showFilters = true,
  maxItems,
}) => {
  const [filter, setFilter] = useState<ActivityFilter | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<'week' | 'month' | 'all'>('all');
  const [selectedKinds, setSelectedKinds] = useState<ActivityKind[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const filterPanelHeight = useSharedValue(0);
  const filterPanelOpacity = useSharedValue(0);

  // Available activity kinds
  const activityKinds: ActivityKind[] = ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'];

  // Filtered activities
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Apply date range filter
    if (selectedDateRange !== 'all') {
      const now = new Date();
      const daysBack = selectedDateRange === 'week' ? 7 : 30;
      const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(activity =>
        parseISO(activity.dateISO) >= cutoffDate
      );
    }

    // Apply activity kind filter
    if (selectedKinds.length > 0) {
      filtered = filtered.filter(activity =>
        selectedKinds.includes(activity.kind)
      );
    }

    // Apply additional filters
    if (filter) {
      if (filter.kinds && filter.kinds.length > 0) {
        filtered = filtered.filter(activity =>
          filter.kinds!.includes(activity.kind)
        );
      }

      if (filter.dateRange) {
        const { start, end } = filter.dateRange;
        filtered = filtered.filter(activity => {
          const activityDate = parseISO(activity.dateISO);
          return activityDate >= start && activityDate <= end;
        });
      }

      if (filter.hasQuantity !== undefined) {
        filtered = filtered.filter(activity =>
          filter.hasQuantity ? !!activity.quantity : !activity.quantity
        );
      }

      if (filter.source) {
        filtered = filtered.filter(activity => activity.source === filter.source);
      }
    }

    // Limit items if specified
    if (maxItems && filtered.length > maxItems) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [activities, selectedDateRange, selectedKinds, filter, maxItems]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, ActivityEntry[]> = {};

    filteredActivities.forEach(activity => {
      const date = parseISO(activity.dateISO);
      let dateKey: string;

      if (isToday(date)) {
        dateKey = 'วันนี้';
      } else if (isYesterday(date)) {
        dateKey = 'เมื่อวาน';
      } else {
        dateKey = format(date, 'dd MMMM yyyy', { locale: th });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    return groups;
  }, [filteredActivities]);

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh) return;

    setRefreshing(true);
    try {
      await onRefresh();
      haptic.impactLight();
    } catch (error) {
      console.error('Failed to refresh activities:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle filter toggle
  const handleFilterToggle = () => {
    const isShowing = !showFilterPanel;
    setShowFilterPanel(isShowing);

    filterPanelHeight.value = withSpring(isShowing ? 200 : 0);
    filterPanelOpacity.value = withTiming(isShowing ? 1 : 0);

    haptic.selectionChanged();
  };

  // Handle activity kind filter
  const handleKindFilter = (kind: ActivityKind) => {
    setSelectedKinds(prev => {
      const newKinds = prev.includes(kind)
        ? prev.filter(k => k !== kind)
        : [...prev, kind];

      const newFilter: ActivityFilter = {
        ...filter,
        kinds: newKinds.length > 0 ? newKinds : undefined,
      };

      setFilter(newKinds.length > 0 || selectedDateRange !== 'all' ? newFilter : null);
      onFilterChange?.(newKinds.length > 0 || selectedDateRange !== 'all' ? newFilter : null);

      return newKinds;
    });

    haptic.selectionChanged();
  };

  // Handle date range filter
  const handleDateRangeFilter = (range: 'week' | 'month' | 'all') => {
    setSelectedDateRange(range);

    const newFilter: ActivityFilter = {
      ...filter,
      dateRange: range !== 'all' ? {
        start: new Date(Date.now() - (range === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000),
        end: new Date(),
      } : undefined,
    };

    setFilter(range !== 'all' || selectedKinds.length > 0 ? newFilter : null);
    onFilterChange?.(range !== 'all' || selectedKinds.length > 0 ? newFilter : null);

    haptic.selectionChanged();
  };

  // Handle activity delete
  const handleDeleteActivity = (activity: ActivityEntry) => {
    Alert.alert(
      'ลบกิจกรรม',
      `คุณต้องการลบกิจกรรม "${activity.kind}" ใช่หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: () => {
            onDeleteActivity?.(activity.id);
            haptic.notificationWarning();
          },
        },
      ]
    );
  };

  // Render activity item
  const renderActivityItem = (activity: ActivityEntry) => {
    const activityDate = parseISO(activity.dateISO);
    const timeString = activity.time24 || format(activityDate, 'HH:mm');
    const daysAgo = differenceInDays(new Date(), activityDate);

    return (
      <TouchableOpacity
        key={activity.id}
        style={styles.activityItem}
        onPress={() => onEditActivity?.(activity)}
        onLongPress={() => handleDeleteActivity(activity)}
      >
        <View style={styles.activityContent}>
          <View style={[
            styles.activityIcon,
            { backgroundColor: getActivityColor(activity.kind) + '20' }
          ]}>
            <Text style={styles.activityIconText}>
              {getActivityIcon(activity.kind)}
            </Text>
          </View>

          <View style={styles.activityDetails}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityKind}>{activity.kind}</Text>
              <Text style={styles.activityTime}>{timeString}</Text>
            </View>

            {activity.quantity && (
              <Text style={styles.activityQuantity}>
                {formatQuantityWithUnit(activity.quantity, activity.unit)}
              </Text>
            )}

            {activity.npk && (activity.npk.n || activity.npk.p || activity.npk.k) && (
              <Text style={styles.activityNPK}>
                NPK: {activity.npk.n || 0}-{activity.npk.p || 0}-{activity.npk.k || 0}
              </Text>
            )}

            {activity.note && (
              <Text style={styles.activityNote} numberOfLines={2}>
                {activity.note}
              </Text>
            )}

            <View style={styles.activityMeta}>
              {activity.source === 'ai' && (
                <View style={styles.sourceTag}>
                  <Ionicons name="sparkles" size={12} color={colors.primary} />
                  <Text style={styles.sourceTagText}>AI</Text>
                </View>
              )}
              {daysAgo > 0 && (
                <Text style={styles.relativeDays}>
                  {daysAgo === 1 ? 'เมื่อวาน' : `${daysAgo} วันที่แล้ว`}
                </Text>
              )}
            </View>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.text.tertiary}
        />
      </TouchableOpacity>
    );
  };

  // Animated styles
  const filterPanelStyle = useAnimatedStyle(() => ({
    height: filterPanelHeight.value,
    opacity: filterPanelOpacity.value,
  }));

  if (activities.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon="📝"
        title="ยังไม่มีกิจกรรม"
        description="เริ่มบันทึกกิจกรรมการดูแลต้นไม้ของคุณ"
        actionText="บันทึกกิจกรรม"
        onActionPress={() => {/* Handle add activity */}}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Section */}
      {showStats && stats && (
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>สถิติกิจกรรม</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalActivities}</Text>
              <Text style={styles.statLabel}>กิจกรรมทั้งหมด</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.round(stats.averageFrequency['รดน้ำ'] || 0)}
              </Text>
              <Text style={styles.statLabel}>วัน/รดน้ำ</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.byKind['รดน้ำ'] || 0}
              </Text>
              <Text style={styles.statLabel}>ครั้งรดน้ำ</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.byKind['ใส่ปุ๋ย'] || 0}
              </Text>
              <Text style={styles.statLabel}>ครั้งใส่ปุ๋ย</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Filter Section */}
      {showFilters && (
        <Card style={styles.filterCard}>
          <TouchableOpacity
            style={styles.filterHeader}
            onPress={handleFilterToggle}
          >
            <View style={styles.filterHeaderLeft}>
              <Ionicons name="funnel" size={18} color={colors.text.secondary} />
              <Text style={styles.filterTitle}>ตัวกรอง</Text>
              {(selectedKinds.length > 0 || selectedDateRange !== 'all') && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {selectedKinds.length + (selectedDateRange !== 'all' ? 1 : 0)}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons
              name={showFilterPanel ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          <Animated.View style={[styles.filterPanel, filterPanelStyle]}>
            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>ช่วงเวลา</Text>
              <View style={styles.filterOptions}>
                {[
                  { key: 'all', label: 'ทั้งหมด' },
                  { key: 'week', label: '7 วันล่าสุด' },
                  { key: 'month', label: '30 วันล่าสุด' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      selectedDateRange === option.key && styles.filterOptionActive
                    ]}
                    onPress={() => handleDateRangeFilter(option.key as any)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedDateRange === option.key && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Activity Kind Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>ประเภทกิจกรรม</Text>
              <View style={styles.filterOptions}>
                {activityKinds.map(kind => (
                  <TouchableOpacity
                    key={kind}
                    style={[
                      styles.filterOption,
                      selectedKinds.includes(kind) && styles.filterOptionActive
                    ]}
                    onPress={() => handleKindFilter(kind)}
                  >
                    <Text style={styles.filterOptionIcon}>
                      {getActivityIcon(kind)}
                    </Text>
                    <Text style={[
                      styles.filterOptionText,
                      selectedKinds.includes(kind) && styles.filterOptionTextActive
                    ]}>
                      {kind}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        </Card>
      )}

      {/* Activity List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      >
        {Object.entries(groupedActivities).map(([dateGroup, dayActivities]) => (
          <View key={dateGroup} style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateTitle}>{dateGroup}</Text>
              <Text style={styles.dateCount}>
                {dayActivities.length} กิจกรรม
              </Text>
            </View>

            <Card style={styles.activitiesCard}>
              {dayActivities.map((activity, index) => (
                <View key={activity.id}>
                  {renderActivityItem(activity)}
                  {index < dayActivities.length - 1 && (
                    <View style={styles.activityDivider} />
                  )}
                </View>
              ))}
            </Card>
          </View>
        ))}

        {filteredActivities.length === 0 && (
          <EmptyState
            icon="🔍"
            title="ไม่พบกิจกรรม"
            description="ลองปรับเปลี่ยนตัวกรองเพื่อดูกิจกรรมอื่น"
            actionText="ล้างตัวกรอง"
            onActionPress={() => {
              setSelectedKinds([]);
              setSelectedDateRange('all');
              setFilter(null);
              onFilterChange?.(null);
            }}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },

  // Stats
  statsCard: {
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  statsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Filter
  filterCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
  },
  filterBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.bold as any,
  },
  filterPanel: {
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  filterSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.xs,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionIcon: {
    fontSize: 16,
  },
  filterOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  filterOptionTextActive: {
    color: colors.white,
  },

  // Activity list
  scrollView: {
    flex: 1,
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  dateTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  dateCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  activitiesCard: {
    marginHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: {
    fontSize: 20,
  },
  activityDetails: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  activityKind: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
  },
  activityTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  activityQuantity: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  activityNPK: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  activityNote: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  sourceTagText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold as any,
  },
  relativeDays: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  activityDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.md,
  },
});

export default ActivityHistory;