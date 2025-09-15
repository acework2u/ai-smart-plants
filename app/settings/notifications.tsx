import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Bell, Clock, Moon, Settings2, Smartphone } from 'lucide-react-native';

import { AppHeader, Section, Button } from '../../components';
import { colors, typography, spacing } from '../../core/theme';
import { useHaptic } from '../../core/haptics';
import { useGardenStore } from '../../stores/garden';
import {
  NotificationScheduler,
  NotificationPreferences,
  notificationScheduler
} from '../../services/NotificationScheduler';

export default function NotificationSettingsScreen() {
  const { plantId } = useLocalSearchParams<{ plantId?: string }>();
  const haptic = useHaptic();
  const { plants } = useGardenStore();

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalEnabled, setGlobalEnabled] = useState(true);

  const selectedPlant = plantId ? plants.find(p => p.id === plantId) : null;

  useEffect(() => {
    loadPreferences();
  }, [plantId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      if (plantId) {
        const prefs = await notificationScheduler.getPreferences(plantId);
        setPreferences(prefs);
        setGlobalEnabled(prefs.enabled);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดการตั้งค่าการแจ้งเตือนได้');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    if (!plantId || !preferences) return;

    try {
      await haptic.buttonPress();
      const updatedPrefs = { ...preferences, ...newPrefs };
      setPreferences(updatedPrefs);
      await notificationScheduler.savePreferences(plantId, updatedPrefs);

      // Reschedule notifications with new preferences
      if (selectedPlant) {
        await notificationScheduler.rescheduleAllNotifications(selectedPlant);
      }
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าได้');
    }
  };

  const toggleGlobalNotifications = async (enabled: boolean) => {
    await haptic.buttonPress();
    setGlobalEnabled(enabled);
    await savePreferences({ enabled });
  };

  const toggleWateringReminder = async (enabled: boolean) => {
    await haptic.buttonPress();
    await savePreferences({
      wateringReminder: { ...preferences!.wateringReminder, enabled }
    });
  };

  const toggleFertilizerReminder = async (enabled: boolean) => {
    await haptic.buttonPress();
    await savePreferences({
      fertilizingReminder: { ...preferences!.fertilizingReminder, enabled }
    });
  };

  const toggleHealthCheckReminder = async (enabled: boolean) => {
    await haptic.buttonPress();
    await savePreferences({
      healthCheckReminder: { ...preferences!.healthCheckReminder, enabled }
    });
  };

  const toggleDoNotDisturb = async (enabled: boolean) => {
    await haptic.buttonPress();
    await savePreferences({
      doNotDisturbMode: { ...preferences!.doNotDisturbMode, enabled }
    });
  };

  const toggleWeatherAware = async (enabled: boolean) => {
    await haptic.buttonPress();
    await savePreferences({ weatherAware: enabled });
  };

  const requestNotificationPermissions = async () => {
    try {
      await haptic.buttonPress();
      const granted = await notificationScheduler.requestPermissions();

      if (granted) {
        Alert.alert(
          '✅ สำเร็จ',
          'ได้รับอนุญาตให้ส่งการแจ้งเตือนแล้ว',
          [{ text: 'ตกลง', onPress: loadPreferences }]
        );
      } else {
        Alert.alert(
          '❌ ไม่ได้รับอนุญาต',
          'คุณสามารถเปิดใช้งานการแจ้งเตือนได้ในการตั้งค่าของเครื่อง',
          [
            { text: 'ยกเลิก', style: 'cancel' },
            { text: 'เปิดการตั้งค่า', onPress: () => {
              if (Platform.OS === 'ios') {
                // Linking.openURL('app-settings:');
              } else {
                // Linking.openSettings();
              }
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถขออนุญาตได้');
    }
  };

  const showIntervalOptions = (type: 'watering' | 'fertilizer' | 'health') => {
    const intervals = type === 'watering'
      ? [
          { label: 'ทุกวัน', value: 'daily' },
          { label: 'ทุก 2 วัน', value: 'every2days' },
          { label: 'ทุกสัปดาห์', value: 'weekly' },
          { label: 'กำหนดเอง', value: 'custom' },
        ]
      : type === 'fertilizer'
      ? [
          { label: 'ทุกสัปดาห์', value: 'weekly' },
          { label: 'ทุก 2 สัปดาห์', value: 'biweekly' },
          { label: 'ทุกเดือน', value: 'monthly' },
        ]
      : [
          { label: 'ทุกสัปดาห์', value: 'weekly' },
          { label: 'ทุกเดือน', value: 'monthly' },
        ];

    Alert.alert(
      'เลือกความถี่',
      'เลือกความถี่ที่ต้องการให้แจ้งเตือน',
      [
        ...intervals.map(interval => ({
          text: interval.label,
          onPress: () => updateInterval(type, interval.value)
        })),
        { text: 'ยกเลิก', style: 'cancel' }
      ]
    );
  };

  const updateInterval = async (type: 'watering' | 'fertilizer' | 'health', interval: string) => {
    await haptic.buttonPress();

    if (type === 'watering') {
      await savePreferences({
        wateringReminder: { ...preferences!.wateringReminder, interval: interval as any }
      });
    } else if (type === 'fertilizer') {
      await savePreferences({
        fertilizingReminder: { ...preferences!.fertilizingReminder, interval: interval as any }
      });
    } else {
      await savePreferences({
        healthCheckReminder: { ...preferences!.healthCheckReminder, interval: interval as any }
      });
    }
  };

  const getIntervalLabel = (interval: string): string => {
    switch (interval) {
      case 'daily': return 'ทุกวัน';
      case 'every2days': return 'ทุก 2 วัน';
      case 'weekly': return 'ทุกสัปดาห์';
      case 'biweekly': return 'ทุก 2 สัปดาห์';
      case 'monthly': return 'ทุกเดือน';
      case 'custom': return 'กำหนดเอง';
      default: return interval;
    }
  };

  if (loading || !preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title="การตั้งค่าการแจ้งเตือน"
          back
          onBack={() => router.back()}
        />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={selectedPlant ? `การแจ้งเตือน ${selectedPlant.name}` : "การตั้งค่าการแจ้งเตือน"}
        back
        onBack={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Global Settings */}
        <Section
          title="การตั้งค่าทั่วไป"
          icon={<Bell size={20} color={colors.primary} />}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>เปิดใช้การแจ้งเตือน</Text>
              <Text style={styles.settingDescription}>
                เปิด/ปิดการแจ้งเตือนทั้งหมดสำหรับต้นไม้นี้
              </Text>
            </View>
            <Switch
              value={globalEnabled}
              onValueChange={toggleGlobalNotifications}
              trackColor={{ false: colors.gray200, true: colors.primarySoft }}
              thumbColor={globalEnabled ? colors.primary : colors.gray500}
            />
          </View>

          <Button
            title="ขออนุญาตการแจ้งเตือน"
            variant="secondary"
            onPress={requestNotificationPermissions}
            icon={<Smartphone size={18} color={colors.primary} />}
          />
        </Section>

        {/* Watering Reminders */}
        <Section
          title="เตือนการรดน้ำ"
          icon={<Text style={styles.emoji}>💧</Text>}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>เตือนรดน้ำ</Text>
              <Text style={styles.settingDescription}>
                ความถี่: {getIntervalLabel(preferences.wateringReminder.interval)} เวลา {preferences.wateringReminder.time} น.
              </Text>
            </View>
            <Switch
              value={preferences.wateringReminder.enabled && globalEnabled}
              onValueChange={toggleWateringReminder}
              disabled={!globalEnabled}
              trackColor={{ false: colors.gray200, true: colors.primarySoft }}
              thumbColor={preferences.wateringReminder.enabled ? colors.primary : colors.gray500}
            />
          </View>

          {preferences.wateringReminder.enabled && globalEnabled && (
            <Button
              title={`ความถี่: ${getIntervalLabel(preferences.wateringReminder.interval)}`}
              variant="ghost"
              onPress={() => showIntervalOptions('watering')}
            />
          )}
        </Section>

        {/* Fertilizer Reminders */}
        <Section
          title="เตือนการใส่ปุ๋ย"
          icon={<Text style={styles.emoji}>🌿</Text>}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>เตือนใส่ปุ๋ย</Text>
              <Text style={styles.settingDescription}>
                ความถี่: {getIntervalLabel(preferences.fertilizingReminder.interval)} เวลา {preferences.fertilizingReminder.time} น.
              </Text>
            </View>
            <Switch
              value={preferences.fertilizingReminder.enabled && globalEnabled}
              onValueChange={toggleFertilizerReminder}
              disabled={!globalEnabled}
              trackColor={{ false: colors.gray200, true: colors.primarySoft }}
              thumbColor={preferences.fertilizingReminder.enabled ? colors.primary : colors.gray500}
            />
          </View>

          {preferences.fertilizingReminder.enabled && globalEnabled && (
            <Button
              title={`ความถี่: ${getIntervalLabel(preferences.fertilizingReminder.interval)}`}
              variant="ghost"
              onPress={() => showIntervalOptions('fertilizer')}
            />
          )}
        </Section>

        {/* Health Check Reminders */}
        <Section
          title="เตือนตรวจสุขภาพ"
          icon={<Text style={styles.emoji}>🔍</Text>}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>เตือนตรวจสุขภาพ</Text>
              <Text style={styles.settingDescription}>
                ความถี่: {getIntervalLabel(preferences.healthCheckReminder.interval)} เวลา {preferences.healthCheckReminder.time} น.
              </Text>
            </View>
            <Switch
              value={preferences.healthCheckReminder.enabled && globalEnabled}
              onValueChange={toggleHealthCheckReminder}
              disabled={!globalEnabled}
              trackColor={{ false: colors.gray200, true: colors.primarySoft }}
              thumbColor={preferences.healthCheckReminder.enabled ? colors.primary : colors.gray500}
            />
          </View>

          {preferences.healthCheckReminder.enabled && globalEnabled && (
            <Button
              title={`ความถี่: ${getIntervalLabel(preferences.healthCheckReminder.interval)}`}
              variant="ghost"
              onPress={() => showIntervalOptions('health')}
            />
          )}
        </Section>

        {/* Advanced Settings */}
        <Section
          title="การตั้งค่าขั้นสูง"
          icon={<Settings2 size={20} color={colors.primary} />}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>โหมดห้ามรบกวน</Text>
              <Text style={styles.settingDescription}>
                ไม่แจ้งเตือนระหว่าง {preferences.doNotDisturbMode.startTime} - {preferences.doNotDisturbMode.endTime} น.
              </Text>
            </View>
            <Switch
              value={preferences.doNotDisturbMode.enabled}
              onValueChange={toggleDoNotDisturb}
              trackColor={{ false: colors.gray200, true: colors.primarySoft }}
              thumbColor={preferences.doNotDisturbMode.enabled ? colors.primary : colors.gray500}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>ตรวจสอบสภาพอากาศ</Text>
              <Text style={styles.settingDescription}>
                ปรับการแจ้งเตือนตามสภาพอากาศ (เช่น ไม่เตือนรดน้ำถ้าฝนตก)
              </Text>
            </View>
            <Switch
              value={preferences.weatherAware}
              onValueChange={toggleWeatherAware}
              trackColor={{ false: colors.gray200, true: colors.primarySoft }}
              thumbColor={preferences.weatherAware ? colors.primary : colors.gray500}
            />
          </View>
        </Section>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing(4),
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray600,
    fontFamily: typography.fontFamily,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing(3),
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: colors.gray900,
    fontFamily: typography.fontFamily,
    marginBottom: spacing(1),
  },
  settingDescription: {
    fontSize: 14,
    color: colors.gray600,
    fontFamily: typography.fontFamily,
    lineHeight: 20,
  },
  emoji: {
    fontSize: 20,
  },
  spacer: {
    height: spacing(6),
  },
});