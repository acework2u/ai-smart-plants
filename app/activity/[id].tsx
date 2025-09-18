import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityKind, CreateActivityInput, NPK, Unit, formatQuantityWithUnit } from '@/types/activity';
import { useActivityStore } from '@/stores/activity';
import { usePrefsStore } from '@/stores/prefsStore';

export default function ActivityLogScreen() {
  const { id } = useLocalSearchParams();
  const plantId = useMemo(() => {
    if (Array.isArray(id)) {
      return id[0] ?? '';
    }
    return typeof id === 'string' ? id : '';
  }, [id]);

  const addActivity = useActivityStore((state) => state.addActivity);
  const activityHistory = useActivityStore((state) =>
    plantId ? state.activities[plantId] || [] : []
  );

  const [selectedActivity, setSelectedActivity] = useState<ActivityKind>('รดน้ำ');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('ml');
  const [npk, setNpk] = useState<NPK>({ n: '', p: '', k: '' });
  const prefsInitializedRef = useRef(false);

  const activities: ActivityKind[] = ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'];
  const units: Unit[] = ['ml', 'g', 'pcs', 'ล.'];

  useEffect(() => {
    if (!plantId || prefsInitializedRef.current) {
      return;
    }

    const prefs = usePrefsStore.getState().getPlantPrefs(plantId);
    if (prefs) {
      if (prefs.lastKind) setSelectedActivity(prefs.lastKind);
      if (prefs.lastUnit) setUnit(prefs.lastUnit);
      if (prefs.lastQty) setQuantity(prefs.lastQty);
      if (prefs.lastNPK && prefs.lastKind === 'ใส่ปุ๋ย') {
        setNpk(prefs.lastNPK);
      }
    }

    prefsInitializedRef.current = true;
  }, [plantId]);

  useEffect(() => {
    if (selectedActivity !== 'ใส่ปุ๋ย') {
      setNpk({ n: '', p: '', k: '' });
    }
  }, [selectedActivity]);

  const sanitizeNumeric = (value: string) => value.replace(/[^0-9.]/g, '');

  const handleSave = () => {
    if (!plantId) {
      console.warn('No plantId provided for activity logging');
      return;
    }

    const now = new Date();
    const entry: CreateActivityInput = {
      plantId,
      kind: selectedActivity,
      unit,
      dateISO: now.toISOString(),
      time24: now.toTimeString().slice(0, 5),
      ...(quantity ? { quantity } : {}),
      ...(selectedActivity === 'ใส่ปุ๋ย' ? { npk } : {}),
    };

    addActivity(entry);
  };

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
          <View style={[styles.fieldGroup, styles.npkContainer]}>
            <Text style={styles.npkLabel}>ค่า NPK (%)</Text>
            <View style={styles.npkRow}>
              <TextInput
                style={styles.npkInput}
                placeholder="N"
                value={npk.n}
                onChangeText={(value) =>
                  setNpk((prev) => ({ ...prev, n: sanitizeNumeric(value) }))
                }
                keyboardType="numeric"
                maxLength={3}
              />
              <TextInput
                style={styles.npkInput}
                placeholder="P"
                value={npk.p}
                onChangeText={(value) =>
                  setNpk((prev) => ({ ...prev, p: sanitizeNumeric(value) }))
                }
                keyboardType="numeric"
                maxLength={3}
              />
              <TextInput
                style={styles.npkInput}
                placeholder="K"
                value={npk.k}
                onChangeText={(value) =>
                  setNpk((prev) => ({ ...prev, k: sanitizeNumeric(value) }))
                }
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.logButton} onPress={handleSave}>
          <Text style={styles.logButtonText}>Log Activity</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <View style={styles.activityHistory}>
          {!plantId && (
            <Text style={styles.historyEmpty}>ต้องระบุต้นไม้ก่อนบันทึกกิจกรรม</Text>
          )}
          {plantId && activityHistory.length === 0 && (
            <Text style={styles.historyEmpty}>ยังไม่มีประวัติการดูแล</Text>
          )}
          {plantId &&
            activityHistory.map((activity) => {
              const amount = formatQuantityWithUnit(activity.quantity, activity.unit);
              const npkLabel = activity.npk
                ? ` • NPK ${activity.npk.n}-${activity.npk.p}-${activity.npk.k}`
                : '';
              const timestamp = activity.time24
                ? `${activity.dateISO.slice(0, 10)} ${activity.time24}`
                : activity.dateISO.slice(0, 10);

              return (
                <View key={activity.id} style={styles.historyCard}>
                  <Text style={styles.historyTitle}>{activity.kind}</Text>
                  <Text style={styles.historySubtitle}>
                    {amount || 'ไม่ระบุปริมาณ'}{npkLabel}
                  </Text>
                  <Text style={styles.historyTimestamp}>{timestamp}</Text>
                </View>
              );
            })}
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
  npkContainer: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  npkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  historyCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  historySubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#374151',
  },
  historyTimestamp: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b7280',
  },
  historyEmpty: {
    fontSize: 14,
    color: '#6b7280',
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
