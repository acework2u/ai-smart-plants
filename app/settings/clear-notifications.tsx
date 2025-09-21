import React, { useCallback, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { useNotificationStore } from '../../stores/notificationStore';
import { useHaptic } from '../../core/haptics';
import { Button } from '../../components/atoms/Button';
import { Card } from '../../components/atoms/Card';
import { radius, typography } from '../../core/theme';

export default function ClearNotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const stats = useNotificationStore((state) => state.getNotificationStats());
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);
  const haptic = useHaptic();

  const [lastClearedAt, setLastClearedAt] = useState<Date | null>(null);

  const handleClear = useCallback(() => {
    Alert.alert(
      'ยืนยันการล้างการแจ้งเตือน',
      'การล้างจะลบประวัติการแจ้งเตือนทั้งหมดออกจากอุปกรณ์',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบทั้งหมด',
          style: 'destructive',
          onPress: () => {
            clearNotifications();
            setLastClearedAt(new Date());
            void haptic.warning();
          },
        },
      ]
    );
  }, [clearNotifications, haptic]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'ล้างการแจ้งเตือน' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="flat" style={styles.heroCard} shadowLevel="md">
          <Text style={styles.heroTitle}>จัดระเบียบกล่องแจ้งเตือน</Text>
          <Text style={styles.heroSubtitle}>
            ล้างการแจ้งเตือนที่สะสมไว้ เพื่อให้คุณเห็นเฉพาะข้อมูลสำคัญล่าสุด
          </Text>
        </Card>

        <Card variant="flat" style={styles.summaryCard} shadowLevel="sm">
          <Text style={styles.sectionTitle}>สถานะปัจจุบัน</Text>
          <View style={styles.summaryRow}>
            <SummaryItem label="ทั้งหมด" value={stats.total} />
            <SummaryItem label="ยังไม่อ่าน" value={stats.unread} />
          </View>
          <View style={styles.summaryRow}>
            <SummaryItem label="วันนี้" value={stats.todayCount} />
            <SummaryItem label="7 วันที่ผ่านมา" value={stats.weekCount} />
          </View>
          {lastClearedAt ? (
            <Text style={styles.noteText}>
              ล้างล่าสุด: {lastClearedAt.toLocaleString('th-TH')}
            </Text>
          ) : (
            <Text style={styles.noteText}>
              ยังไม่เคยล้างการแจ้งเตือนจากอุปกรณ์นี้
            </Text>
          )}
        </Card>

        <Card variant="flat" style={styles.helpCard} shadowLevel="sm">
          <Text style={styles.sectionTitle}>เคล็ดลับ</Text>
          <Text style={styles.tipText}>
            คุณยังสามารถจัดการการแจ้งเตือนรายประเภทจากแท็บการแจ้งเตือน หรือปรับตั้งค่าแบบละเอียดในหน้าการตั้งค่าหลัก
          </Text>
          <Button
            title="เปิดศูนย์การแจ้งเตือน"
            variant="secondary"
            onPress={() => router.push('/notifications')}
          />
        </Card>

        <Button title="ล้างการแจ้งเตือนทั้งหมด" onPress={handleClear} variant="danger" />
      </ScrollView>
    </SafeAreaView>
  );
}

interface SummaryItemProps {
  label: string;
  value: number;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createSummaryItemStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

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
    summaryCard: {
      borderRadius: radius.lg,
      padding: theme.spacing(4),
      gap: theme.spacing(3),
    },
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: theme.spacing(3),
    },
    noteText: {
      marginTop: theme.spacing(2),
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    helpCard: {
      borderRadius: radius.lg,
      padding: theme.spacing(4),
      gap: theme.spacing(2),
    },
    tipText: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.secondary,
      lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    },
  });

const createSummaryItemStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: theme.spacing(2),
    },
    label: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.tertiary,
      marginBottom: 4,
    },
    value: {
      fontSize: typography.fontSize['2xl'],
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
    },
  });
