import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function ResultScreen() {
  const router = useRouter();

  const handleSaveToGarden = () => {
    // Save plant logic will be implemented later
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.resultCard}>
        <Text style={styles.plantName}>Monstera Deliciosa</Text>
        <Text style={styles.confidence}>Confidence: 94%</Text>
        <Text style={styles.status}>Status: Healthy</Text>
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>AI Recommendations:</Text>
        <Text style={styles.tip}>• Water when soil is dry 2-3 inches deep</Text>
        <Text style={styles.tip}>• Provide bright, indirect sunlight</Text>
        <Text style={styles.tip}>• Support with moss pole when mature</Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveToGarden}>
        <Text style={styles.saveButtonText}>Save to Garden</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginTop: 40,
    marginBottom: 24,
  },
  plantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  confidence: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  status: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  tipsSection: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  tip: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});