import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import {
  Leaf,
  Plus,
  Search,
  Columns2,
  Rows3,
  ArrowDownWideNarrow,
} from 'lucide-react-native';
import { Button, Chip } from '../../components/atoms';
import { OptimizedFlatList } from '../../components/atoms/OptimizedFlatList';
import { PlantCardSkeleton, Skeleton } from '../../components/atoms/Skeleton';
import {
  useGardenStore,
  useFilteredPlants,
  useGardenStats,
} from '../../stores/garden';
import { colors, getSpacing, typography, radius } from '../../core/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { MemoryManager } from '../../utils/performance';

export default function GardenScreen() {
  const plants = useFilteredPlants();
  const [searchQuery, setSearchQueryLocal] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<'recent' | 'name' | 'status'>('recent');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
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
      } catch (error) {
        console.error('Failed to load garden data:', error);
        setIsLoading(false);
      }
    };

    loadGardenData();
  }, []);

  const heroStats = useMemo(() => {
    const total = stats?.totalPlants ?? plants.length;
    const healthy = stats?.healthyCount ?? plants.filter((p) => p.status === 'Healthy').length;
    const warning = stats?.warningCount ?? plants.filter((p) => p.status === 'Warning').length;
    const critical = stats?.criticalCount ?? plants.filter((p) => p.status === 'Critical').length;
    return {
      total,
      healthy,
      attention: warning + critical,
    };
  }, [plants, stats]);

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
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQueryLocal(query);

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
    if (sortOption === 'name') {
      return [...plants].sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortOption === 'status') {
      const order = { Healthy: 0, Warning: 1, Critical: 2 } as const;
      return [...plants].sort((a, b) => order[a.status] - order[b.status]);
    }

    return [...plants].sort((a, b) => {
      const aDate = new Date(a.updatedAt ?? a.createdAt).getTime();
      const bDate = new Date(b.updatedAt ?? b.createdAt).getTime();
      return bDate - aDate;
    });
  }, [plants, sortOption]);

  const listCardTheme = useMemo(
    () => ({
      backgroundColor: theme.colors.surface.primary,
      borderColor: theme.colors.border.light,
      shadowColor: theme.isDark ? 'rgba(0,0,0,0.45)' : 'rgba(15,23,42,0.14)',
    }),
    [theme],
  );

  const viewToggleInactiveBg = theme.colors.background.tertiary;
  const viewToggleActiveBg = `${theme.colors.primarySoft}99`;

  const renderPlantCard = useCallback(({ item: plant }: { item: any }) => {
    const statusAccent = plant.status === 'Healthy'
      ? theme.colors.success
      : plant.status === 'Warning'
        ? theme.colors.warning
        : theme.colors.error;

    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          style={[styles.listCard, listCardTheme, { borderLeftColor: statusAccent }]}
          onPress={() => handlePlantPress(plant.id)}
          activeOpacity={0.9}
        >
          <View style={styles.listCardRow}>
            <View style={styles.listImageWrapper}>
              {plant.imageUri ? (
                <Image source={{ uri: plant.imageUri }} style={styles.listImage} resizeMode="cover" />
              ) : (
                <View style={styles.listImagePlaceholder}>
                  <Leaf size={28} color={theme.colors.primary} />
                </View>
              )}
            </View>
            <View style={styles.listContent}>
              <View style={styles.listCardHeader}>
                <Text style={styles.listCardTitle} numberOfLines={1}>{plant.name}</Text>
                <Chip label={plant.status} status={plant.status} size="sm" />
              </View>
              {plant.scientificName ? (
                <Text style={styles.listCardSubtitle} numberOfLines={1}>{plant.scientificName}</Text>
              ) : null}
              <View style={styles.listMetaRow}>
                <Text style={styles.listMetaLabel}>เพิ่มเมื่อ</Text>
                <Text style={styles.listMetaValue}>
                  {new Date(plant.createdAt).toLocaleDateString('th-TH', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
              </View>
              {plant.metadata?.lastActivity && (
                <View style={styles.listMetaRow}>
                  <Text style={styles.listMetaLabel}>กิจกรรมล่าสุด</Text>
                  <Text style={styles.listMetaValue}>{plant.metadata.lastActivity}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.gridCard, { borderTopColor: statusAccent }]}
        onPress={() => handlePlantPress(plant.id)}
        activeOpacity={0.85}
      >
        <View style={styles.gridImageWrapper}>
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
            <Text style={styles.gridCardName} numberOfLines={2}>{plant.name}</Text>
            <Chip label={plant.status} status={plant.status} size="xs" />
          </View>
          {plant.scientificName ? (
            <Text style={styles.gridCardSubtitle} numberOfLines={1}>{plant.scientificName}</Text>
          ) : null}
          <View style={styles.gridMetaRow}>
            <Text style={styles.gridMetaLabel}>เพิ่มเมื่อ</Text>
            <Text style={styles.gridMetaValue}>
              {new Date(plant.createdAt).toLocaleDateString('th-TH', {
                day: 'numeric', month: 'short',
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [handlePlantPress, listCardTheme, theme.colors.error, theme.colors.primary, theme.colors.success, theme.colors.warning, viewMode]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyState}>
        <Leaf size={64} color={colors.gray[400]} />
        <Text style={styles.emptyTitle}>เริ่มต้นสร้างสวน</Text>
        <Text style={styles.emptySubtitle}>
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
  ), [handleAddPlant]);

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

  const listHeader = useMemo(() => (
    <View>
      <View style={styles.header}>
        <View style={styles.heroHeaderRow}>
          <View>
            <Text style={styles.heroTitle}>สวนของฉัน</Text>
            <Text style={styles.heroSubtitle}>
              ต้นไม้ทั้งหมด {heroStats.total} ต้น · ต้องดูแล {heroStats.attention} ต้น
            </Text>
          </View>
          <Button title="เพิ่ม" onPress={handleAddPlant} variant="primary" size="sm" />
        </View>
        <View style={styles.heroMetrics}>
          <View style={styles.heroMetricCard}>
            <Text style={styles.heroMetricValue}>{heroStats.total}</Text>
            <Text style={styles.heroMetricLabel}>ต้นทั้งหมด</Text>
          </View>
          <View style={styles.heroMetricCard}>
            <Text style={styles.heroMetricValue}>{heroStats.healthy}</Text>
            <Text style={styles.heroMetricLabel}>สุขภาพดี</Text>
          </View>
          <View style={styles.heroMetricCard}>
            <Text style={styles.heroMetricValue}>{heroStats.attention}</Text>
            <Text style={styles.heroMetricLabel}>ต้องติดตาม</Text>
          </View>
        </View>
      </View>

      <View style={[styles.controlCard, {
        backgroundColor: theme.colors.surface.primary,
        borderColor: theme.colors.border.light,
        shadowColor: theme.isDark ? 'rgba(0,0,0,0.45)' : 'rgba(15,23,42,0.12)',
      }]}
      >
        <View style={styles.controlRow}>
          <View style={[styles.searchField, { backgroundColor: theme.colors.background.tertiary }]}>
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
            style={[styles.sortButton, { backgroundColor: theme.colors.background.tertiary }]}
            onPress={() => {
              setSortOption((prev) => {
                if (prev === 'recent') return 'name';
                if (prev === 'name') return 'status';
                return 'recent';
              });
              MemoryManager.log('GardenScreen', 'sort-change');
            }}
          >
            <ArrowDownWideNarrow size={18} color={theme.colors.text.secondary} />
            <Text style={styles.sortLabel}>
              {sortOption === 'recent' ? 'ล่าสุด' : sortOption === 'name' ? 'ตามชื่อ' : 'ตามสถานะ'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>สถานะ</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <Chip
              label="ทั้งหมด"
              variant="filter"
              selected={activeFilter === 'all'}
              onPress={() => setFilter('all')}
              style={styles.filterChip}
            />
            <Chip
              label="แข็งแรง"
              variant="filter"
              status="Healthy"
              selected={activeFilter === 'Healthy'}
              onPress={() => setFilter('Healthy')}
              style={styles.filterChip}
            />
            <Chip
              label="เตือน"
              variant="filter"
              status="Warning"
              selected={activeFilter === 'Warning'}
              onPress={() => setFilter('Warning')}
              style={styles.filterChip}
            />
            <Chip
              label="วิกฤต"
              variant="filter"
              status="Critical"
              selected={activeFilter === 'Critical'}
              onPress={() => setFilter('Critical')}
              style={styles.filterChip}
            />
          </ScrollView>
        </View>

        <View style={styles.viewToggleRow}>
          <Text style={styles.viewToggleLabel}>มุมมอง</Text>
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              onPress={() => setViewMode('grid')}
              style={[styles.viewToggleButton, { backgroundColor: viewToggleInactiveBg }, viewMode === 'grid' && { backgroundColor: viewToggleActiveBg }]}
            >
              <Columns2 size={16} color={viewMode === 'grid' ? theme.colors.primary : theme.colors.text.secondary} />
              <Text style={[styles.viewToggleText, viewMode === 'grid' && styles.viewToggleTextActive]}>Grid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              style={[styles.viewToggleButton, { backgroundColor: viewToggleInactiveBg }, viewMode === 'list' && { backgroundColor: viewToggleActiveBg }]}
            >
              <Rows3 size={16} color={viewMode === 'list' ? theme.colors.primary : theme.colors.text.secondary} />
              <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>List</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  ), [activeFilter, handleAddPlant, handleSearch, heroStats.attention, heroStats.healthy, heroStats.total, isSearching, searchQuery, setFilter, sortOption, theme.colors.background.secondary, theme.colors.background.tertiary, theme.colors.border.light, theme.colors.primary, theme.colors.primarySoft, theme.colors.surface.primary, theme.colors.text.secondary, theme.colors.text.tertiary, viewMode, viewToggleActiveBg, viewToggleInactiveBg]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <OptimizedFlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={renderSearchSkeleton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OptimizedFlatList
        key={`${viewMode}-${isSearching ? 'loading' : 'ready'}`}
        data={isSearching ? [] : sortedPlants}
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: getSpacing(4),
    paddingTop: getSpacing(4),
    paddingBottom: getSpacing(3),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  heroSubtitle: {
    marginTop: getSpacing(1),
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
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
    backgroundColor: colors.background.secondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.light,
  },
  heroMetricValue: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  heroMetricLabel: {
    marginTop: getSpacing(1),
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  controlCard: {
    marginHorizontal: getSpacing(4),
    marginTop: getSpacing(3),
    marginBottom: getSpacing(3),
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: getSpacing(3),
    gap: getSpacing(2),
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
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
    color: colors.text.primary,
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
    color: colors.text.secondary,
  },
  filterSection: {
    gap: getSpacing(1),
  },
  filterLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1.5),
    paddingVertical: getSpacing(1),
  },
  filterChip: {
    marginRight: getSpacing(1.5),
  },
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewToggleLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
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
    color: colors.text.secondary,
  },
  viewToggleTextActive: {
    color: colors.primary,
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
    backgroundColor: colors.surface.primary,
    borderRadius: radius.lg,
    borderTopWidth: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.light,
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
    backgroundColor: colors.background.tertiary,
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
    color: colors.text.primary,
  },
  gridCardSubtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
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
    color: colors.text.secondary,
  },
  gridMetaValue: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
  },
  listCard: {
    marginBottom: getSpacing(2.5),
    padding: getSpacing(3),
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.light,
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
    backgroundColor: colors.background.tertiary,
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
  listContent: {
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
    color: colors.text.primary,
    flex: 1,
    marginRight: getSpacing(2),
  },
  listCardSubtitle: {
    marginTop: getSpacing(1),
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  listMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getSpacing(1.5),
  },
  listMetaLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listMetaValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
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
    color: colors.text.primary,
    marginTop: getSpacing(4),
    marginBottom: getSpacing(2),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
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
});
