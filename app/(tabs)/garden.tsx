import React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Leaf, Plus, Search } from 'lucide-react-native';
import { Button, Card, Chip, Section } from '../../components/atoms';
import { useGardenStore } from '../../stores/garden';
import { colors, getSpacing, typography, radius } from '../../core/theme';

export default function GardenScreen() {
  const { plants, searchPlants } = useGardenStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredPlants = React.useMemo(() => {
    return searchQuery ? searchPlants(searchQuery) : plants;
  }, [plants, searchQuery, searchPlants]);

  const handlePlantPress = (plantId: string) => {
    router.push(`/plant/${plantId}`);
  };

  const handleAddPlant = () => {
    router.push('/');
  };

  const renderPlantCard = ({ item: plant }: { item: any }) => (
    <Card
      style={styles.plantCard}
      onPress={() => handlePlantPress(plant.id)}
      variant="default"
    >
      <View style={styles.plantImagePlaceholder}>
        <Leaf size={32} color={colors.primary} />
      </View>

      <View style={styles.plantInfo}>
        <Text style={styles.plantName} numberOfLines={1}>
          {plant.name}
        </Text>
        {plant.scientificName && (
          <Text style={styles.scientificName} numberOfLines={1}>
            {plant.scientificName}
          </Text>
        )}

        <View style={styles.plantMeta}>
          <Chip
            label={plant.status}
            status={plant.status}
            variant="status"
            size="sm"
          />
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyState}>
        <Leaf size={64} color={colors.gray[400]} />
        <Text style={styles.emptyTitle}>"1D!H!5ID!IC*'</Text>
        <Text style={styles.emptySubtitle}>
          @#4H!II'"2#*AID!IA#-8
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
        <FlatList
          data={filteredPlants}
          renderItem={renderPlantCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.noResults}>
                <Search size={32} color={colors.gray[400]} />
                <Text style={styles.noResultsText}>
                  D!HID!I5H#1 "{searchQuery}"
                </Text>
              </View>
            ) : null
          }
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

  // Plant Cards
  plantCard: {
    width: '47%', // 2 columns with getSpacing
    aspectRatio: 0.8,
    marginBottom: getSpacing(4),
    padding: getSpacing(3),
  },
  plantImagePlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(3),
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: getSpacing(1),
  },
  scientificName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: getSpacing(2),
  },
  plantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: typography.fontWeight.semibold,
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