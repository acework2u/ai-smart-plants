import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Leaf, Plus, Search } from 'lucide-react-native';
import { Button, Chip, Section } from '../../components/atoms';
import { OptimizedFlatList } from '../../components/atoms/OptimizedFlatList';
import { OptimizedPlantCard } from '../../components/atoms/OptimizedComponents';
import { PlantCardSkeleton, Skeleton } from '../../components/atoms/Skeleton';
import { useGardenStore, useFilteredPlants } from '../../stores/garden';
import { colors, getSpacing, typography, radius } from '../../core/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { MemoryManager } from '../../utils/performance';

export default function GardenScreen() {
  const plants = useFilteredPlants(); // Use optimized selector
  const [searchQuery, setSearchQueryLocal] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
  const { theme } = useTheme();
  const setSearchQuery = useGardenStore((s) => s.setSearchQuery);
  const setFilter = useGardenStore((s) => s.setFilter);

  // Simulate initial loading
  React.useEffect(() => {
    const loadGardenData = async () => {
      try {
        // Simulate API call to load garden data
        await new Promise(resolve => setTimeout(resolve, 1200));
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load garden data:', error);
        setIsLoading(false);
      }
    };

    loadGardenData();
  }, []);

  // Memoize plant press handler
  const handlePlantPress = useCallback((plantId: string) => {
    router.push(`/plant/${plantId}`);
  }, []);

  // Memoize add plant handler
  const handleAddPlant = useCallback(() => {
    router.push('/');
  }, []);

  // Memoize refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Simulate refresh - in real app, this would sync with backend
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Handle search with loading state
  const handleSearch = useCallback((query: string) => {
    setSearchQueryLocal(query);

    if (query.length > 0) {
      setIsSearching(true);
      // Simulate search delay
      const searchTimeout = setTimeout(() => {
        setSearchQuery(query);
        setIsSearching(false);
      }, 300);

      return () => clearTimeout(searchTimeout);
    } else {
      setSearchQuery(query);
      setIsSearching(false);
    }
  }, [setSearchQuery]);

  // Memoized render function for optimized performance
  const renderPlantCard = useCallback(({ item: plant }: { item: any }) => (
    <OptimizedPlantCard
      plant={plant}
      onPress={handlePlantPress}
      size="medium"
      style={styles.plantCard}
    />
  ), [handlePlantPress]);

  const renderEmptyState = () => (
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
  );

  // Loading screen
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Skeleton width={120} height={24} borderRadius={6} style={{ marginBottom: 4 }} />
                <Skeleton width={80} height={16} borderRadius={4} />
              </View>
              <Skeleton width={60} height={32} borderRadius={8} />
            </View>
          </View>
        </View>

        {/* Search Bar Skeleton */}
        <View style={styles.searchBar}>
          <Skeleton width="100%" height={40} borderRadius={20} />
        </View>

        {/* Filter Row Skeleton */}
        <View style={styles.filterRow}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} width={60} height={28} borderRadius={14} />
          ))}
        </View>

        {/* Plants Grid Skeleton */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
          <View style={styles.row}>
            <PlantCardSkeleton delay={0} />
            <PlantCardSkeleton delay={100} />
          </View>
          <View style={styles.row}>
            <PlantCardSkeleton delay={200} />
            <PlantCardSkeleton delay={300} />
          </View>
          <View style={styles.row}>
            <PlantCardSkeleton delay={400} />
            <PlantCardSkeleton delay={500} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Section
          title="สวนของฉัน"
          subtitle={`${plants.length} ต้น`}
          rightElement={
            <Button
              title="เพิ่ม"
              onPress={handleAddPlant}
              variant="ghost"
              size="sm"
            />
          }
          style={styles.headerSection}
        />
      </View>

      {/* Search & Filters */}
      <View style={styles.searchBar}>
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
          <View style={{ marginLeft: 8 }}>
            <Skeleton width={16} height={16} borderRadius={8} animated={true} />
          </View>
        )}
      </View>
      <View style={styles.filterRow}>
        <Chip label="ทั้งหมด" variant="filter" onPress={() => setFilter('all')} />
        <Chip label="แข็งแรง" variant="filter" status="Healthy" onPress={() => setFilter('Healthy')} />
        <Chip label="เตือน" variant="filter" status="Warning" onPress={() => setFilter('Warning')} />
        <Chip label="วิกฤต" variant="filter" status="Critical" onPress={() => setFilter('Critical')} />
      </View>

      {plants.length === 0 ? (
        renderEmptyState()
      ) : isSearching ? (
        // Show skeleton during search
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
          <View style={styles.row}>
            <PlantCardSkeleton delay={0} />
            <PlantCardSkeleton delay={50} />
          </View>
          <View style={styles.row}>
            <PlantCardSkeleton delay={100} />
            <PlantCardSkeleton delay={150} />
          </View>
        </ScrollView>
      ) : (
        <OptimizedFlatList
          data={plants}
          renderItem={renderPlantCard}
          numColumns={2}
          itemHeight={180}
          enableVirtualization={true}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          emptyTitle="ไม่พบต้นไม้"
          emptySubtitle="เริ่มต้นด้วยการเพิ่มต้นไม้แรกของคุณ"
        />
      )}
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
    paddingTop: getSpacing(2),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getSpacing(2),
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.lg,
    paddingHorizontal: getSpacing(3),
    paddingVertical: getSpacing(2),
    margin: getSpacing(4),
    marginTop: getSpacing(3),
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    marginLeft: 8,
    color: colors.text.primary,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(2),
    paddingHorizontal: getSpacing(4),
    paddingBottom: getSpacing(2),
  },
  headerSection: {
    marginBottom: getSpacing(2),
  },

  // List
  listContent: {
    padding: getSpacing(4),
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },

  // Plant Cards (simplified since we're using OptimizedPlantCard)
  plantCard: {
    width: '47%', // 2 columns with spacing
    marginBottom: getSpacing(4),
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: getSpacing(6),
    paddingVertical: getSpacing(8),
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: '600',
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
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
  emptyButton: {
    minWidth: 140,
  },

  // No Results
  noResults: {
    alignItems: 'center',
    paddingVertical: getSpacing(8),
  },
  noResultsText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    marginTop: getSpacing(3),
    textAlign: 'center',
  },
});
