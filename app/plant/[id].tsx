import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePlantById } from '../../stores/garden';
import { useAITips, useWeatherAI } from '../../hooks/useAI';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams();
  const plantId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const plant = usePlantById(plantId);
  const { tips, loading } = useAITips(plant?.name ?? '');
  const { currentWeather, isLoading: weatherLoading } = useWeatherAI();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.plantName}>{plant?.name || 'Plant Details'}</Text>
        <Text style={styles.plantId}>ID: {plantId}</Text>
      </View>

      <View style={styles.weatherSection}>
        <Text style={styles.sectionTitle}>สภาพอากาศ</Text>
        {weatherLoading || !currentWeather ? (
          <Text style={styles.tip}>กำลังโหลดสภาพอากาศ...</Text>
        ) : (
          <Text style={styles.tip}>
            {`อุณหภูมิ ${Math.round(currentWeather.temperature)}°C  •  ความชื้น ${Math.round(currentWeather.humidity)}%  •  ${currentWeather.conditionDescriptionThai || currentWeather.conditionDescription}`}
          </Text>
        )}
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
        {loading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
            <ActivityIndicator size="small" color="#16a34a" />
            <Text style={[styles.tip, { marginLeft: 8 }]}>กำลังโหลดคำแนะนำ...</Text>
          </View>
        )}
        {!loading && (tips?.length ?? 0) === 0 && (
          <Text style={styles.tip}>ไม่มีคำแนะนำในขณะนี้</Text>
        )}
        {!loading && tips && tips.map((t) => (
          <View key={t.id} style={{ marginBottom: 10 }}>
            <Text style={[styles.tip, { fontWeight: '600', color: '#111827' }]}>
              {(t.category === 'watering' && '💧') || (t.category === 'fertilizing' && '🌱') || (t.category === 'lighting' && '☀️') || '🍃'} {t.title}
            </Text>
            {!!t.description && (
              <Text style={[styles.tip, { color: '#4b5563', marginTop: 2 }]}>{t.description}</Text>
            )}
          </View>
        ))}
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
