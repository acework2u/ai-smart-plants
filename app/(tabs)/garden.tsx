import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Leaf, Plus, Search } from 'lucide-react-native';
import { Button, Section } from '../../components/atoms';
import { OptimizedFlatList } from '../../components/atoms/OptimizedFlatList';
import { OptimizedPlantCard } from '../../components/atoms/OptimizedComponents';
import { useGardenStore, useFilteredPlants } from '../../stores/garden';
import { colors, getSpacing, typography, radius } from '../../core/theme';
import { MemoryManager } from '../../utils/performance';

export default function GardenScreen() {
  const plants = useFilteredPlants(); // Use optimized selector
  const [searchQuery, setSearchQuery] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);

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
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setRefreshing(false);
    }
  }, []);

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
        <Text style={styles.emptyTitle}>&quot;เริ่มต้นสร้างสวน&apos;</Text>
        <Text style={styles.emptySubtitle}>
          เพิ่มต้นไม้แรกของคุณเพื่อเริ่มต้นการดูแล
        </Text>
        <Button
          title="@4H!ID!I"
          onPress={handleAddPlant}
          variant="primary"
          style={styles.emptyButton}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Section
          title="*'-	1"
          subtitle={`${plants.length} I`}
          rightElement={
            <Button
              title="@4H!"
              onPress={handleAddPlant}
              variant="ghost"
              size="sm"
            />
          }
          style={styles.headerSection}
        />
      </View>

      {plants.length === 0 ? (
        renderEmptyState()
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