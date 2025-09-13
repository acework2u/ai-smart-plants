import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.plantName}>Plant Details</Text>
        <Text style={styles.plantId}>ID: {id}</Text>
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Health Status</Text>
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>Healthy</Text>
        </View>
      </View>

      <View style={styles.careSection}>
        <Text style={styles.sectionTitle}>Care Schedule</Text>
        <Text style={styles.careItem}>💧 Last watered: 2 days ago</Text>
        <Text style={styles.careItem}>🌱 Next fertilizer: In 5 days</Text>
        <Text style={styles.careItem}>☀️ Light: Bright, indirect</Text>
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>AI Tips</Text>
        <Text style={styles.tip}>• Keep soil slightly moist but not soggy</Text>
        <Text style={styles.tip}>• Rotate weekly for even growth</Text>
        <Text style={styles.tip}>• Wipe leaves monthly for better light absorption</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  plantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  plantId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusChip: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  careSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  careItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  tipsSection: {
    padding: 20,
  },
  tip: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    color: '#374151',
  },
});