import React, { useCallback, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { usePreferencesStore } from '../../stores/preferences';
import { useNotificationStore } from '../../stores/notificationStore';
import { useHaptic } from '../../core/haptics';
import { Button } from '../../components/atoms/Button';
import { Card } from '../../components/atoms/Card';
import { createDefaultNotificationOverrides } from '../../features/settings/defaults';
import { radius, typography } from '../../core/theme';

type ThemeOption = 'light' | 'dark' | 'system';

export default function ResetPreferencesScreen() {
  const { theme, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resetUserPrefs = usePreferencesStore((state) => state.resetUserPrefs);
  const hapticsEnabled = usePreferencesStore((state) => state.userPrefs.haptics);
  const updateGlobalNotifications = useNotificationStore((state) => state.updateGlobalPreferences);
  const haptic = useHaptic();

  const [confirmReset, setConfirmReset] = useState(false);
  const [lastResetAt, setLastResetAt] = useState<Date | null>(null);

  const performReset = useCallback(async () => {
    resetUserPrefs();
    await updateGlobalNotifications(createDefaultNotificationOverrides());

    const nextTheme = usePreferencesStore.getState().userPrefs.theme as ThemeOption;
    await setThemeMode(nextTheme);

    haptic.enable();
    if (hapticsEnabled) {
      void haptic.success();
    }

    setConfirmReset(false);
    setLastResetAt(new Date());
  }, [haptic, hapticsEnabled, resetUserPrefs, setThemeMode, updateGlobalNotifications]);

  const handleResetPress = useCallback(() => {
    if (!confirmReset) {
      Alert.alert('ต้องการยืนยันเพิ่มเติม', 'กรุณาเปิดสวิตช์ยืนยันก่อนทำการรีเซ็ต');
      return;
    }

    Alert.alert(
      'ยืนยันรีเซ็ตการตั้งค่า',
      'การรีเซ็ตจะคืนค่าทุกการตั้งค่าและการแจ้งเตือนไปเป็นค่าเริ่มต้น',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'รีเซ็ต',
          style: 'destructive',
          onPress: () => {
            void performReset();
          },
        },
      ]
    );
  }, [confirmReset, performReset]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'รีเซ็ตการตั้งค่า' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="flat" style={styles.heroCard} shadowLevel="md">
          <Text style={styles.heroTitle}>รีเซ็ตเพื่อเริ่มต้นใหม่</Text>
          <Text style={styles.heroSubtitle}>
            ฟังก์ชันนี้จะล้างการตั้งค่าส่วนตัวทั้งหมดและคืนค่าระบบแจ้งเตือนเป็นค่าเริ่มต้น
          </Text>
        </Card>

        <Card variant="flat" style={styles.detailsCard} shadowLevel="sm">
          <Text style={styles.sectionTitle}>สิ่งที่จะถูกรีเซ็ต</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• ธีม, ภาษา, หน่วยวัด และการสั่นตอบสนอง</Text>
            <Text style={styles.bulletItem}>• การตั้งค่าความเป็นส่วนตัวและการแจ้งเตือนทั้งหมด</Text>
            <Text style={styles.bulletItem}>• การตั้งค่าการแจ้งเตือนขั้นสูง เช่น Quiet Hours</Text>
          </View>
          <Text style={styles.noteText}>
            ข้อมูลสวนพืช กิจกรรม และประวัติการวิเคราะห์จะไม่ถูกลบ
          </Text>
        </Card>

        <Card variant="flat" style={styles.confirmCard} shadowLevel="sm">
          <View style={styles.confirmRow}>
            <View style={styles.confirmTextContainer}>
              <Text style={styles.confirmTitle}>ยืนยันการรีเซ็ต</Text>
              <Text style={styles.confirmSubtitle}>เปิดเพื่อยืนยันว่าคุณเข้าใจผลของการรีเซ็ต</Text>
            </View>
            <Switch
              value={confirmReset}
              onValueChange={setConfirmReset}
              trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
              thumbColor={theme.colors.white}
            />
          </View>
          {lastResetAt ? (
            <Text style={styles.noteText}>รีเซ็ตล่าสุด: {lastResetAt.toLocaleString('th-TH')}</Text>
          ) : null}
        </Card>

        <Button
          title="รีเซ็ตการตั้งค่าทั้งหมด"
          onPress={handleResetPress}
          variant="danger"
          disabled={!confirmReset}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      paddingHorizontal: theme.spacing(4),
      paddingVertical: theme.spacing(4),
      gap: theme.spacing(4),
    },
    heroCard: {
      borderRadius: radius.xl,
      padding: theme.spacing(4),
      backgroundColor: theme.colors.primarySoft,
    },
    heroTitle: {
      fontSize: typography.fontSize['2xl'],
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
    },
    heroSubtitle: {
      marginTop: theme.spacing(2),
      fontSize: typography.fontSize.base,
      color: theme.colors.text.secondary,
      lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    },
    detailsCard: {
      borderRadius: radius.lg,
      padding: theme.spacing(4),
      gap: theme.spacing(2),
    },
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
    },
    bulletList: {
      gap: theme.spacing(1),
    },
    bulletItem: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.secondary,
    },
    noteText: {
      marginTop: theme.spacing(2),
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    confirmCard: {
      borderRadius: radius.lg,
      padding: theme.spacing(4),
      gap: theme.spacing(2),
    },
    confirmRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    confirmTextContainer: {
      flex: 1,
      marginRight: theme.spacing(3),
    },
    confirmTitle: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.primary,
    },
    confirmSubtitle: {
      marginTop: 4,
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
  });

