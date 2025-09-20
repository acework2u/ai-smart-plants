import { router } from 'expo-router';
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUp,
  Calendar,
  CheckCircle,
  Clock,
  Columns2,
  Filter,
  Heart,
  Leaf,
  Plus,
  Rows3,
  Search,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Chip } from '../../components/atoms';
import { OptimizedFlatList } from '../../components/atoms/OptimizedFlatList';
import { PlantCardSkeleton, Skeleton } from '../../components/atoms/Skeleton';
import { useTheme } from '../../contexts/ThemeContext';
import { getSpacing, radius, typography } from '../../core/theme';
import {
  useFilteredPlants,
  useAllPlants,
  useGardenStats,
  useGardenStore,
} from '../../stores/garden';

export default function GardenScreen() {
  const plants = useFilteredPlants(); // Filtered plants for display
  const allPlants = useAllPlants(); // All plants for counting
  const [searchQuery, setSearchQueryLocal] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<'recent' | 'name' | 'status'>('recent');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  // Enhanced filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [dateFilter, setDateFilter] = React.useState<'all' | 'today' | 'week' | 'month'>('all');
  const [activityFilter, setActivityFilter] = React.useState<'all' | 'recent' | 'overdue'>('all');

  // Pagination states for infinite scroll
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const ITEMS_PER_PAGE = 20;

  // Ref for FlatList to handle scroll to top
  const listRef = React.useRef<any>(null);

  // Animation values for micro-interactions
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const { theme } = useTheme();
  const setSearchQuery = useGardenStore((s) => s.setSearchQuery);
  const setFilter = useGardenStore((s) => s.setFilter);
  const activeFilter = useGardenStore((s) => s.filter);
  const stats = useGardenStats();

  React.useEffect(() => {
    const loadGardenData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setIsLoading(false);
        // Fade in animation when data loads
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error('Failed to load garden data:', error);
        setIsLoading(false);
      }
    };

    loadGardenData();
  }, [fadeAnim]);

  const heroStats = useMemo(() => {
    // Use allPlants for accurate total counts
    const total = stats?.totalPlants ?? allPlants.length;
    const healthy = stats?.healthyCount ?? allPlants.filter((p) => p.status === 'Healthy').length;
    const warning = stats?.warningCount ?? allPlants.filter((p) => p.status === 'Warning').length;
    const critical = stats?.criticalCount ?? allPlants.filter((p) => p.status === 'Critical').length;
    return {
      total,
      healthy,
      warning,
      critical,
      attention: warning + critical,
    };
  }, [allPlants, stats]);

  // Filter counts - always show total counts regardless of active filters
  // This provides better UX by showing the full picture of garden status
  const filterCounts = useMemo(() => {
    // Always count from allPlants (unfiltered) to show total counts
    // This helps users understand the overall garden status even when filtering
    return {
      all: allPlants.length,
      healthy: allPlants.filter((p) => p.status === 'Healthy').length,
      warning: allPlants.filter((p) => p.status === 'Warning').length,
      critical: allPlants.filter((p) => p.status === 'Critical').length,
    };
  }, [allPlants]);

  const handlePlantPress = useCallback((plantId: string) => {
    router.push(`/plant/${plantId}`);
  }, []);

  const handleAddPlant = useCallback(() => {
    router.push('/');
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // Reset pagination on refresh
      setCurrentPage(1);
      setHasMore(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQueryLocal(query);
    // Reset pagination when searching
    setCurrentPage(1);
    setHasMore(true);

    if (query.length > 0) {
      setIsSearching(true);
      const searchTimeout = setTimeout(() => {
        setSearchQuery(query);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(searchTimeout);
    }

    setSearchQuery(query);
    setIsSearching(false);
  }, [setSearchQuery]);

  const sortedPlants = useMemo(() => {
    let filtered = [...plants];

    // Apply advanced date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((plant) => {
        const plantDate = new Date(plant.createdAt);

        switch (dateFilter) {
          case 'today':
            return plantDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return plantDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return plantDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Apply advanced activity filter
    if (activityFilter !== 'all') {
      filtered = filtered.filter((plant) => {
        if (activityFilter === 'recent') {
          return plant.metadata?.lastActivity;
        } else if (activityFilter === 'overdue') {
          // Plants that haven't been watered in 7+ days
          const lastWatered = plant.metadata?.lastWatered;
          if (lastWatered && typeof lastWatered === 'string') {
            const daysSince = (Date.now() - new Date(lastWatered).getTime()) / (1000 * 60 * 60 * 24);
            return daysSince > 7;
          }
          return false;
        }
        return true;
      });
    }

    // Apply sorting
    if (sortOption === 'name') {
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'status') {
      const order = { Healthy: 0, Warning: 1, Critical: 2 } as const;
      filtered = filtered.sort((a, b) => order[a.status] - order[b.status]);
    } else {
      filtered = filtered.sort((a, b) => {
        const aDate = new Date(a.updatedAt ?? a.createdAt).getTime();
        const bDate = new Date(b.updatedAt ?? b.createdAt).getTime();
        return bDate - aDate;
      });
    }

    return filtered;
  }, [plants, sortOption, dateFilter, activityFilter]);

  // Paginated plants for infinite scroll
  const paginatedPlants = useMemo(() => {
    const endIndex = currentPage * ITEMS_PER_PAGE;
    return sortedPlants.slice(0, endIndex);
  }, [sortedPlants, currentPage]);

  // Handle load more for infinite scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isSearching) return;

    const totalPages = Math.ceil(sortedPlants.length / ITEMS_PER_PAGE);
    if (currentPage >= totalPages) {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);
    // Simulate network delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 500));

    setCurrentPage(prev => prev + 1);
    setIsLoadingMore(false);

    // Check if we've loaded all items
    if (currentPage + 1 >= totalPages) {
      setHasMore(false);
    }
  }, [isLoadingMore, hasMore, isSearching, sortedPlants.length, currentPage]);

  // Handle scroll events for scroll-to-top button
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 500);
  }, []);

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Enhanced filter handlers
  const clearAllFilters = useCallback(() => {
    setFilter('all');
    setDateFilter('all');
    setActivityFilter('all');
    setSearchQueryLocal('');
    setSearchQuery('');
    setCurrentPage(1);
    setHasMore(true);
  }, [setFilter, setSearchQuery]);

  const hasActiveFilters = useMemo(() => {
    return activeFilter !== 'all' || dateFilter !== 'all' || activityFilter !== 'all' || searchQuery.length > 0;
  }, [activeFilter, dateFilter, activityFilter, searchQuery]);

  const getFilterTitle = useCallback((filter: string, count: number) => {
    const labels = {
      'all': 'ทั้งหมด',
      'Healthy': 'แข็งแรง',
      'Warning': 'เตือน',
      'Critical': 'วิกฤต'
    };
    return `${labels[filter as keyof typeof labels] || filter} (${count})`;
  }, []);

  // Enhanced hero calculations
  const gardenHealth = useMemo(() => {
    const total = heroStats.total || 1;
    const healthyPercent = Math.round((heroStats.healthy / total) * 100);
    const status = healthyPercent >= 80 ? 'excellent' : healthyPercent >= 60 ? 'good' : healthyPercent >= 40 ? 'fair' : 'poor';

    return {
      percentage: healthyPercent,
      status,
      trend: healthyPercent >= 70 ? 'up' : 'down', // Mock trend for demo
      icon: healthyPercent >= 80 ? CheckCircle : healthyPercent >= 60 ? Heart : AlertTriangle,
      color: healthyPercent >= 80 ? theme.colors.success : healthyPercent >= 60 ? theme.colors.primary : theme.colors.warning
    };
  }, [heroStats, theme.colors]);

  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'สวัสดีตอนเช้า';
    if (hour < 18) return 'สวัสดีตอนบ่าย';
    return 'สวัสดีตอนเย็น';
  }, []);

  const getQuickAction = useCallback(() => {
    if (heroStats.critical > 0) return { title: 'ช่วยด่วน!', subtitle: `${heroStats.critical} ต้นต้องการความช่วยเหลือ`, action: 'critical' };
    if (heroStats.warning > 0) return { title: 'ติดตาม', subtitle: `${heroStats.warning} ต้นต้องการความใส่ใจ`, action: 'warning' };
    return { title: 'ดูแลต่อ', subtitle: 'สวนของคุณสุขภาพดี', action: 'maintain' };
  }, [heroStats]);

  // Pulse animation for urgent actions
  React.useEffect(() => {
    if (heroStats.critical > 0 || heroStats.warning > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [heroStats.critical, heroStats.warning, pulseAnim]);

  const listCardTheme = useMemo(
    () => ({
      backgroundColor: theme.colors.surface.primary,
      borderColor: theme.colors.border,
      shadowColor: theme.isDark ? 'rgba(0,0,0,0.45)' : 'rgba(15,23,42,0.14)',
    }),
    [theme],
  );

  const viewToggleInactiveBg = theme.colors.gray100;
  const viewToggleActiveBg = `${theme.colors.primary}15`;

  const renderPlantCard = useCallback(({ item: plant }: { item: any }) => {
    const statusAccent = plant.status === 'Healthy'
      ? theme.colors.success
      : plant.status === 'Warning'
        ? theme.colors.warning
        : theme.colors.error;

    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          style={[
            styles.listCard,
            listCardTheme,
            {
              borderLeftColor: statusAccent,
              backgroundColor: theme.colors.surface.primary,
              borderColor: theme.colors.border
            }
          ]}
          onPress={() => handlePlantPress(plant.id)}
          activeOpacity={0.9}
        >
          <View style={styles.listCardRow}>
            <View style={[styles.listImageWrapper, { backgroundColor: theme.colors.gray100 }]}>
              {plant.imageUri ? (
                <Image source={{ uri: plant.imageUri }} style={styles.listImage} resizeMode="cover" />
              ) : (
                <View style={styles.listImagePlaceholder}>
                  <Leaf size={28} color={theme.colors.primary} />
                </View>
              )}
            </View>
            <View style={styles.listCardContent}>
              <View style={styles.listCardHeader}>
                <Text style={[styles.listCardTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>{plant.name}</Text>
                <Chip label={plant.status} status={plant.status} size="sm" />
              </View>
              {plant.scientificName ? (
                <Text style={[styles.listCardSubtitle, { color: theme.colors.text.secondary }]} numberOfLines={1}>{plant.scientificName}</Text>
              ) : null}
              <View style={styles.listMetaRow}>
                <Text style={[styles.listMetaLabel, { color: theme.colors.text.tertiary }]}>เพิ่มเมื่อ</Text>
                <Text style={[styles.listMetaValue, { color: theme.colors.text.primary }]}>
                  {new Date(plant.createdAt).toLocaleDateString('th-TH', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
              </View>
              {plant.metadata?.lastActivity && (
                <View style={styles.listMetaRow}>
                  <Text style={[styles.listMetaLabel, { color: theme.colors.text.tertiary }]}>กิจกรรมล่าสุด</Text>
                  <Text style={[styles.listMetaValue, { color: theme.colors.text.primary }]}>{plant.metadata.lastActivity}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.gridCard,
          {
            borderTopColor: statusAccent,
            backgroundColor: theme.colors.surface.primary,
            borderColor: theme.colors.border
          }
        ]}
        onPress={() => handlePlantPress(plant.id)}
        activeOpacity={0.85}
      >
        <View style={[styles.gridImageWrapper, { backgroundColor: theme.colors.gray100 }]}>
          {plant.imageUri ? (
            <Image source={{ uri: plant.imageUri }} style={styles.gridImage} resizeMode="cover" />
          ) : (
            <View style={styles.gridImagePlaceholder}>
              <Leaf size={24} color={theme.colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.gridCardBody}>
          <View style={styles.gridCardHeader}>
            <Text style={[styles.gridCardName, { color: theme.colors.text.primary }]} numberOfLines={2}>{plant.name}</Text>
            <Chip label={plant.status} status={plant.status} size="sm" />
          </View>
          {plant.scientificName ? (
            <Text style={[styles.gridCardSubtitle, { color: theme.colors.text.secondary }]} numberOfLines={1}>{plant.scientificName}</Text>
          ) : null}
          <View style={styles.gridMetaRow}>
            <Text style={[styles.gridMetaLabel, { color: theme.colors.text.tertiary }]}>เพิ่มเมื่อ</Text>
            <Text style={[styles.gridMetaValue, { color: theme.colors.text.primary }]}>
              {new Date(plant.createdAt).toLocaleDateString('th-TH', {
                day: 'numeric', month: 'short',
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [handlePlantPress, listCardTheme, theme.colors.border, theme.colors.error, theme.colors.gray100, theme.colors.primary, theme.colors.success, theme.colors.surface.primary, theme.colors.warning, theme.colors.text.primary, theme.colors.text.secondary, theme.colors.text.tertiary, viewMode]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyState}>
        <Leaf size={64} color={theme.colors.text.disabled} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>เริ่มต้นสร้างสวน</Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
          เพิ่มต้นไม้แรกของคุณเพื่อเริ่มต้นการดูแล
        </Text>
        <Button
          title="เพิ่มต้นไม้"
          onPress={handleAddPlant}
          variant="primary"
          style={styles.emptyButton}
        />
      </View>
    </View>
  ), [handleAddPlant, theme.colors.text.disabled, theme.colors.text.primary, theme.colors.text.secondary]);

  const renderSearchSkeleton = useCallback(() => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonRow}>
        <PlantCardSkeleton delay={0} />
        <PlantCardSkeleton delay={80} />
        <PlantCardSkeleton delay={160} />
      </View>
      <View style={styles.skeletonRow}>
        <PlantCardSkeleton delay={240} />
        <PlantCardSkeleton delay={320} />
        <PlantCardSkeleton delay={400} />
      </View>
    </View>
  ), []);

  // Footer component for infinite scroll
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          กำลังโหลดเพิ่มเติม...
        </Text>
      </View>
    );
  }, [isLoadingMore, theme.colors.primary, theme.colors.text.secondary]);

  // End reached message
  const renderEndMessage = useCallback(() => {
    if (hasMore || paginatedPlants.length === 0) return null;

    return (
      <View style={styles.endMessage}>
        <Text style={[styles.endMessageText, { color: theme.colors.text.tertiary }]}>
          • แสดงต้นไม้ทั้งหมดแล้ว ({paginatedPlants.length} ต้น) •
        </Text>
      </View>
    );
  }, [hasMore, paginatedPlants.length, theme.colors.text.tertiary]);

  const listHeader = useMemo(() => (
    <View>
      {/* Enhanced Hero Section */}
      <View style={[styles.enhancedHeader, { backgroundColor: theme.colors.surface.primary }]}>
        {/* Greeting and Quick Action */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingContent}>
            <Text style={[styles.greetingText, { color: theme.colors.text.tertiary }]}>{getGreeting}</Text>
            <Text style={[styles.heroTitle, { color: theme.colors.text.primary }]}>สวนของฉัน</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: gardenHealth.color + '15' }]}
              onPress={() => {
                const action = getQuickAction();
                if (action.action === 'critical') setFilter('Critical');
                else if (action.action === 'warning') setFilter('Warning');
              }}
              activeOpacity={0.8}
            >
              <gardenHealth.icon size={16} color={gardenHealth.color} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Garden Health Score */}
        <View style={[styles.healthScoreCard, { backgroundColor: theme.colors.gray100 }]}>
          <View style={styles.healthScoreHeader}>
            <View style={styles.healthScoreInfo}>
              <Text style={[styles.healthScoreTitle, { color: theme.colors.text.primary }]}>สุขภาพสวน</Text>
              <View style={styles.healthScoreTrend}>
                <Text style={[styles.healthScorePercent, { color: gardenHealth.color }]}>
                  {gardenHealth.percentage}%
                </Text>
                {gardenHealth.trend === 'up' ? (
                  <TrendingUp size={14} color={theme.colors.success} />
                ) : (
                  <TrendingDown size={14} color={theme.colors.warning} />
                )}
              </View>
            </View>
            <gardenHealth.icon size={24} color={gardenHealth.color} />
          </View>

          {/* Health Progress Bar */}
          <View style={[styles.healthProgressBg, { backgroundColor: theme.colors.background.primary }]}>
            <View
              style={[
                styles.healthProgress,
                {
                  backgroundColor: gardenHealth.color,
                  width: `${gardenHealth.percentage}%`
                }
              ]}
            />
          </View>

          <Text style={[styles.healthScoreSubtitle, { color: theme.colors.text.secondary }]}>
            {getQuickAction().subtitle}
          </Text>
        </View>

        {/* Enhanced Metrics Grid */}
        <Animated.View style={[styles.enhancedMetrics, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.enhancedMetricCard, { backgroundColor: theme.colors.success + '10' }]}
            onPress={() => setFilter('Healthy')}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <CheckCircle size={20} color={theme.colors.success} />
              <Text style={[styles.metricCardValue, { color: theme.colors.success }]}>
                {heroStats.healthy}
              </Text>
            </View>
            <Text style={[styles.metricCardLabel, { color: theme.colors.text.secondary }]}>แข็งแรง</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.enhancedMetricCard, { backgroundColor: theme.colors.warning + '10' }]}
            onPress={() => setFilter('Warning')}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <AlertTriangle size={20} color={theme.colors.warning} />
              <Text style={[styles.metricCardValue, { color: theme.colors.warning }]}>
                {heroStats.warning}
              </Text>
            </View>
            <Text style={[styles.metricCardLabel, { color: theme.colors.text.secondary }]}>เตือน</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.enhancedMetricCard, { backgroundColor: theme.colors.error + '10' }]}
            onPress={() => setFilter('Critical')}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <Heart size={20} color={theme.colors.error} />
              <Text style={[styles.metricCardValue, { color: theme.colors.error }]}>
                {heroStats.critical}
              </Text>
            </View>
            <Text style={[styles.metricCardLabel, { color: theme.colors.text.secondary }]}>วิกฤต</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.enhancedMetricCard, { backgroundColor: theme.colors.primary + '10' }]}
            onPress={handleAddPlant}
            activeOpacity={0.8}
          >
            <View style={styles.metricCardHeader}>
              <Plus size={20} color={theme.colors.primary} />
              <Text style={[styles.metricCardValue, { color: theme.colors.primary }]}>
                {heroStats.total}
              </Text>
            </View>
            <Text style={[styles.metricCardLabel, { color: theme.colors.text.secondary }]}>ทั้งหมด</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={[styles.controlCard, {
        backgroundColor: theme.colors.surface.primary,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
        borderBottomColor: theme.colors.border,
      }]}
      >
        <View style={styles.controlRow}>
          <View style={[styles.searchField, { backgroundColor: theme.colors.gray100 }]}>
            <Search
              size={18}
              color={isSearching ? theme.colors.primary : theme.colors.text.tertiary}
            />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="ค้นหาต้นไม้..."
              placeholderTextColor={theme.colors.text.tertiary}
              returnKeyType="search"
            />
            {isSearching && (
              <Skeleton width={16} height={16} borderRadius={8} animated={true} />
            )}
          </View>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: theme.colors.gray100 }]}
            onPress={() => {
              setSortOption((prev) => {
                if (prev === 'recent') return 'name';
                if (prev === 'name') return 'status';
                return 'recent';
              });
              // Log sort change
              if (__DEV__) console.log('Sort changed:', sortOption);
            }}
          >
            <ArrowDownWideNarrow size={18} color={theme.colors.text.secondary} />
            <Text style={[styles.sortLabel, { color: theme.colors.text.secondary }]}>
              {sortOption === 'recent' ? 'ล่าสุด' : sortOption === 'name' ? 'ตามชื่อ' : 'ตามสถานะ'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Enhanced Filter Section */}
        <View style={[styles.enhancedFilterSection, { backgroundColor: theme.colors.background.primary }]}>
          {/* Primary Filter Row */}
          <View style={styles.primaryFilterRow}>
            <Text style={[styles.filterLabel, { color: theme.colors.text.secondary }]}>สถานะ</Text>
            <View style={styles.filterActions}>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={clearAllFilters}
                >
                  <X size={14} color={theme.colors.text.secondary} />
                  <Text style={[styles.clearFiltersText, { color: theme.colors.text.secondary }]}>เคลียร์</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.advancedFilterButton, { backgroundColor: showAdvancedFilters ? theme.colors.primary + '15' : 'transparent' }]}
                onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter size={16} color={showAdvancedFilters ? theme.colors.primary : theme.colors.text.secondary} />
                <Text style={[styles.advancedFilterText, { color: showAdvancedFilters ? theme.colors.primary : theme.colors.text.secondary }]}>ตัวกรอง</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Status Filter Chips with Counts */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.filterScrollView}
          >
            <Chip
              label={getFilterTitle('all', filterCounts.all)}
              variant="filter"
              selected={activeFilter === 'all'}
              onPress={() => setFilter('all')}
              style={styles.filterChip}
            />
            <Chip
              label={getFilterTitle('Healthy', filterCounts.healthy)}
              variant="filter"
              status="Healthy"
              selected={activeFilter === 'Healthy'}
              onPress={() => setFilter('Healthy')}
              style={styles.filterChip}
            />
            <Chip
              label={getFilterTitle('Warning', filterCounts.warning)}
              variant="filter"
              status="Warning"
              selected={activeFilter === 'Warning'}
              onPress={() => setFilter('Warning')}
              style={styles.filterChip}
            />
            <Chip
              label={getFilterTitle('Critical', filterCounts.critical)}
              variant="filter"
              status="Critical"
              selected={activeFilter === 'Critical'}
              onPress={() => setFilter('Critical')}
              style={styles.filterChip}
            />
          </ScrollView>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <View style={styles.advancedFilters}>
              {/* Date Filter */}
              <View style={styles.advancedFilterRow}>
                <View style={styles.advancedFilterHeader}>
                  <Calendar size={16} color={theme.colors.text.secondary} />
                  <Text style={[styles.advancedFilterLabel, { color: theme.colors.text.secondary }]}>วันที่เพิ่ม</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.advancedFilterChips}
                >
                  <Chip
                    label="ทั้งหมด"
                    variant="filter"
                    selected={dateFilter === 'all'}
                    onPress={() => setDateFilter('all')}
                    size="sm"
                    style={styles.advancedFilterChip}
                  />
                  <Chip
                    label="วันนี้"
                    variant="filter"
                    selected={dateFilter === 'today'}
                    onPress={() => setDateFilter('today')}
                    size="sm"
                    style={styles.advancedFilterChip}
                  />
                  <Chip
                    label="สัปดาห์นี้"
                    variant="filter"
                    selected={dateFilter === 'week'}
                    onPress={() => setDateFilter('week')}
                    size="sm"
                    style={styles.advancedFilterChip}
                  />
                  <Chip
                    label="เดือนนี้"
                    variant="filter"
                    selected={dateFilter === 'month'}
                    onPress={() => setDateFilter('month')}
                    size="sm"
                    style={styles.advancedFilterChip}
                  />
                </ScrollView>
              </View>

              {/* Activity Filter */}
              <View style={styles.advancedFilterRow}>
                <View style={styles.advancedFilterHeader}>
                  <Clock size={16} color={theme.colors.text.secondary} />
                  <Text style={[styles.advancedFilterLabel, { color: theme.colors.text.secondary }]}>กิจกรรม</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.advancedFilterChips}
                >
                  <Chip
                    label="ทั้งหมด"
                    variant="filter"
                    selected={activityFilter === 'all'}
                    onPress={() => setActivityFilter('all')}
                    size="sm"
                    style={styles.advancedFilterChip}
                  />
                  <Chip
                    label="มีกิจกรรมล่าสุด"
                    variant="filter"
                    selected={activityFilter === 'recent'}
                    onPress={() => setActivityFilter('recent')}
                    size="sm"
                    style={styles.advancedFilterChip}
                  />
                  <Chip
                    label="ต้องดูแล"
                    variant="filter"
                    selected={activityFilter === 'overdue'}
                    onPress={() => setActivityFilter('overdue')}
                    size="sm"
                    style={styles.advancedFilterChip}
                  />
                </ScrollView>
              </View>
            </View>
          )}
        </View>

        <View style={styles.viewToggleRow}>
          <Text style={[styles.viewToggleLabel, { color: theme.colors.text.secondary }]}>มุมมอง</Text>
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              onPress={() => setViewMode('grid')}
              style={[styles.viewToggleButton, { backgroundColor: viewToggleInactiveBg }, viewMode === 'grid' && { backgroundColor: viewToggleActiveBg }]}
            >
              <Columns2 size={16} color={viewMode === 'grid' ? theme.colors.primary : theme.colors.text.secondary} />
              <Text style={[styles.viewToggleText, { color: viewMode === 'grid' ? theme.colors.primary : theme.colors.text.secondary }]}>Grid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              style={[styles.viewToggleButton, { backgroundColor: viewToggleInactiveBg }, viewMode === 'list' && { backgroundColor: viewToggleActiveBg }]}
            >
              <Rows3 size={16} color={viewMode === 'list' ? theme.colors.primary : theme.colors.text.secondary} />
              <Text style={[styles.viewToggleText, { color: viewMode === 'list' ? theme.colors.primary : theme.colors.text.secondary }]}>List</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  ), [
    activeFilter,
    handleAddPlant,
    handleSearch,
    heroStats.attention,
    heroStats.healthy,
    heroStats.total,
    heroStats.warning,
    heroStats.critical,
    isSearching,
    searchQuery,
    setFilter,
    sortOption,
    theme.colors.gray100,
    theme.colors.border,
    theme.colors.primary,
    theme.colors.surface.primary,
    theme.colors.text.primary,
    theme.colors.text.secondary,
    theme.colors.text.tertiary,
    theme.colors.background.primary,
    theme.colors.success,
    theme.colors.warning,
    theme.colors.error,
    theme.colors.white,
    viewMode,
    viewToggleActiveBg,
    viewToggleInactiveBg,
    // Enhanced filter deps
    showAdvancedFilters,
    dateFilter,
    activityFilter,
    hasActiveFilters,
    filterCounts,
    getFilterTitle,
    clearAllFilters,
    // Enhanced hero deps
    gardenHealth,
    getGreeting,
    getQuickAction
  ]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <OptimizedFlatList
          data={[]}
          renderItem={() => <View />}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={renderSearchSkeleton()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <OptimizedFlatList
        ref={listRef}
        key={`${viewMode}-${isSearching ? 'loading' : 'ready'}`}
        data={isSearching ? [] : paginatedPlants}
        renderItem={renderPlantCard}
        numColumns={viewMode === 'grid' ? 3 : 1}
        enableVirtualization={true}
        removeClippedSubviews={false}
        style={styles.list}
        contentContainerStyle={[styles.listContent, viewMode === 'list' && styles.listContentList]}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={isSearching ? renderSearchSkeleton : renderEmptyState}
        ListFooterComponent={hasMore ? renderFooter : renderEndMessage}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <TouchableOpacity
          style={[styles.scrollToTop, { backgroundColor: theme.colors.primary }]}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <ArrowUp size={20} color={theme.colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: getSpacing(4),
    paddingTop: getSpacing(4),
    paddingBottom: getSpacing(3),
    borderBottomWidth: 1,
  },
  enhancedHeader: {
    paddingHorizontal: getSpacing(4),
    paddingTop: getSpacing(6),
    paddingBottom: getSpacing(4),
    gap: getSpacing(4),
  },
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContent: {
    flex: 1,
  },
  greetingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginBottom: getSpacing(0.5),
  },
  quickActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthScoreCard: {
    padding: getSpacing(4),
    borderRadius: radius.xl,
    gap: getSpacing(3),
  },
  healthScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthScoreInfo: {
    flex: 1,
  },
  healthScoreTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    marginBottom: getSpacing(1),
  },
  healthScoreTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
  },
  healthScorePercent: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
  },
  healthProgressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  healthProgress: {
    height: '100%',
    borderRadius: 3,
  },
  healthScoreSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  enhancedMetrics: {
    flexDirection: 'row',
    gap: getSpacing(2),
  },
  enhancedMetricCard: {
    flex: 1,
    padding: getSpacing(3),
    borderRadius: radius.lg,
    gap: getSpacing(2),
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricCardValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
  },
  metricCardLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
  },
  heroSubtitle: {
    marginTop: getSpacing(1),
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: getSpacing(2),
    marginTop: getSpacing(3),
  },
  heroMetricCard: {
    flex: 1,
    padding: getSpacing(3),
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  heroMetricValue: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
  },
  heroMetricLabel: {
    marginTop: getSpacing(1),
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  controlCard: {
    marginTop: getSpacing(2),
    marginBottom: getSpacing(2),
    paddingHorizontal: getSpacing(4),
    paddingVertical: getSpacing(4),
    gap: getSpacing(3),
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(2),
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(2),
    borderRadius: radius.lg,
    paddingHorizontal: getSpacing(3),
    paddingVertical: getSpacing(2),
    flex: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
    paddingHorizontal: getSpacing(3),
    paddingVertical: getSpacing(2),
    borderRadius: radius.lg,
  },
  sortLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  filterSection: {
    gap: getSpacing(1),
  },
  enhancedFilterSection: {
    gap: getSpacing(3),
    paddingVertical: getSpacing(3),
    paddingHorizontal: getSpacing(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  primaryFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(2),
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
    paddingHorizontal: getSpacing(3),
    paddingVertical: getSpacing(1.5),
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  clearFiltersText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  advancedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
    paddingHorizontal: getSpacing(3),
    paddingVertical: getSpacing(1.5),
    borderRadius: radius.lg,
  },
  advancedFilterText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  advancedFilters: {
    paddingTop: getSpacing(3),
    marginTop: getSpacing(2),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: getSpacing(4),
  },
  advancedFilterRow: {
    gap: getSpacing(2),
  },
  advancedFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
  },
  advancedFilterLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  advancedFilterChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(2),
    paddingVertical: getSpacing(1),
    paddingHorizontal: getSpacing(4),
  },
  advancedFilterChip: {
    marginRight: getSpacing(1.5),
  },
  filterLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(2),
    paddingVertical: getSpacing(2),
    paddingHorizontal: getSpacing(4),
    flexGrow: 1,
  },
  filterChip: {
    marginRight: getSpacing(2),
  },
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewToggleLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    gap: getSpacing(1),
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1.5),
    borderRadius: radius.lg,
  },
  viewToggleText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: getSpacing(4),
    paddingBottom: getSpacing(12),
  },
  listContentList: {
    paddingBottom: getSpacing(14),
  },
  gridCard: {
    flexBasis: '32%',
    maxWidth: '32%',
    borderRadius: radius.lg,
    borderTopWidth: 3,
    borderWidth: StyleSheet.hairlineWidth,
    padding: getSpacing(3),
    shadowColor: 'rgba(15,23,42,0.12)',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 2,
    marginBottom: getSpacing(3),
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: getSpacing(3),
  },
  gridImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: getSpacing(2),
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardBody: {
    gap: getSpacing(1),
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: getSpacing(1),
  },
  gridCardName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  gridCardSubtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
  },
  gridMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: getSpacing(1.5),
  },
  gridMetaLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  gridMetaValue: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
  },
  listCard: {
    marginBottom: getSpacing(2.5),
    padding: getSpacing(3),
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: 'rgba(15,23,42,0.14)',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 3,
    borderLeftWidth: 3,
  },
  listCardRow: {
    flexDirection: 'row',
    gap: getSpacing(3),
  },
  listImageWrapper: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCardContent: {
    flex: 1,
    gap: getSpacing(1),
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listCardTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    flex: 1,
    marginRight: getSpacing(2),
  },
  listCardSubtitle: {
    marginTop: getSpacing(1),
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  listMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getSpacing(1.5),
  },
  listMetaLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listMetaValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getSpacing(6),
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: getSpacing(6),
    paddingVertical: getSpacing(8),
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    marginTop: getSpacing(4),
    marginBottom: getSpacing(2),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    marginBottom: getSpacing(6),
    lineHeight: typography.fontSize.base * 1.5,
  },
  emptyButton: {
    minWidth: 140,
  },
  skeletonContainer: {
    paddingHorizontal: getSpacing(4),
    paddingTop: getSpacing(4),
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getSpacing(3),
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing(4),
    gap: getSpacing(2),
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  endMessage: {
    alignItems: 'center',
    paddingVertical: getSpacing(4),
    paddingHorizontal: getSpacing(4),
  },
  endMessageText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  scrollToTop: {
    position: 'absolute',
    bottom: getSpacing(20),
    right: getSpacing(4),
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
});
