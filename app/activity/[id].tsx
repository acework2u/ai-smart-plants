import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

export default function ActivityLogScreen() {
  const { id } = useLocalSearchParams();
  const [selectedActivity, setSelectedActivity] = useState('รดน้ำ');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('ml');

  const activities = ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'];
  const units = ['ml', 'g', 'pcs', 'ล.'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Log New Activity</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Activity Type</Text>
          <View style={styles.activityButtons}>
            {activities.map((activity) => (
              <TouchableOpacity
                key={activity}
                style={[
                  styles.activityButton,
                  selectedActivity === activity && styles.activityButtonActive
                ]}
                onPress={() => setSelectedActivity(activity)}
              >
                <Text style={[
                  styles.activityButtonText,
                  selectedActivity === activity && styles.activityButtonTextActive
                ]}>
                  {activity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Quantity</Text>
          <View style={styles.quantityRow}>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Amount"
              keyboardType="numeric"
            />
            <View style={styles.unitButtons}>
              {units.map((unitOption) => (
                <TouchableOpacity
                  key={unitOption}
                  style={[
                    styles.unitButton,
                    unit === unitOption && styles.unitButtonActive
                  ]}
                  onPress={() => setUnit(unitOption)}
                >
                  <Text style={[
                    styles.unitButtonText,
                    unit === unitOption && styles.unitButtonTextActive
                  ]}>
                    {unitOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {selectedActivity === 'ใส่ปุ๋ย' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NPK Values</Text>
            <View style={styles.npkRow}>
              <TextInput
                style={styles.npkInput}
                placeholder="N"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.npkInput}
                placeholder="P"
                keyboardType="numeric"
              />
              <TextInput
                style={styles.npkInput}
                placeholder="K"
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.logButton}>
          <Text style={styles.logButtonText}>Log Activity</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <View style={styles.activityHistory}>
          <Text style={styles.historyItem}>💧 Watered 200ml - 2 days ago</Text>
          <Text style={styles.historyItem}>🌱 Fertilized NPK 10-10-10 - 1 week ago</Text>
          <Text style={styles.historyItem}>🔍 Leaf inspection - 3 days ago</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  activityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activityButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  activityButtonText: {
    color: '#374151',
    fontSize: 14,
  },
  activityButtonTextActive: {
    color: '#fff',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  unitButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  unitButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unitButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  unitButtonText: {
    color: '#374151',
    fontSize: 12,
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  npkRow: {
    flexDirection: 'row',
    gap: 8,
  },
  npkInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  logButton: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historySection: {
    padding: 20,
  },
  activityHistory: {
    gap: 12,
  },
  historyItem: {
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
});