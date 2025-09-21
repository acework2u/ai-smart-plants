import React, { useCallback, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { useUser } from '../../stores/userStore';
import { usePreferencesStore } from '../../stores/preferences';
import { useHaptic } from '../../core/haptics';
import { Button } from '../../components/atoms/Button';
import { Card } from '../../components/atoms/Card';
import { radius, typography } from '../../core/theme';

export default function DataBackupScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const user = useUser();
  const haptic = useHaptic();
  const hapticsEnabled = usePreferencesStore((state) => state.userPrefs.haptics);
  const [lastExportedAt, setLastExportedAt] = useState<Date | null>(null);

  const handleExport = useCallback(async () => {
    try {
      const payload = user
        ? JSON.stringify(
            {
              profile: {
                id: user.id,
                name: user.name,
                email: user.email,
                joinDate: user.joinDate,
              },
              statistics: user.statistics,
              preferences: user.preferences,
              badges: user.badges,
              milestones: user.milestones,
            },
            null,
            2
          )
        : 'ไม่มีข้อมูลผู้ใช้';

      const result = await Share.share({
        title: 'ข้อมูลผู้ใช้ Smart Plant',
        message: payload,
      });

      if (result.action === Share.sharedAction) {
        setLastExportedAt(new Date());
        if (hapticsEnabled) {
          void haptic.success();
        }
      }
    } catch (error) {
      console.error('Failed to export user data:', error);
      Alert.alert('ไม่สามารถส่งออกข้อมูลได้', 'กรุณาลองใหม่ในภายหลัง');
      if (hapticsEnabled) {
        void haptic.error();
      }
    }
  }, [haptic, hapticsEnabled, user]);

  const profileSummary = useMemo(() => {
    if (!user) {
      return {
        name: 'ไม่พบข้อมูลผู้ใช้',
        email: '-',
        plantCount: 0,
        activityCount: 0,
      };
    }

    return {
      name: user.name,
      email: user.email,
      plantCount: user.statistics.totalPlants,
      activityCount: user.statistics.totalActivities,
    };
  }, [user]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'สำรองข้อมูลผู้ใช้' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="flat" style={styles.heroCard} shadowLevel="md">
          <Text style={styles.heroTitle}>สำรองข้อมูลเพื่อความอุ่นใจ</Text>
          <Text style={styles.heroSubtitle}>
            ส่งออกข้อมูลผู้ใช้ของคุณเป็นไฟล์ข้อความ เพื่อเก็บไว้หรือแชร์ต่อให้ผู้เชี่ยวชาญ
          </Text>
        </Card>

        <Card variant="flat" style={styles.summaryCard} shadowLevel="sm">
          <Text style={styles.sectionTitle}>ภาพรวมบัญชี</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>ชื่อ</Text>
              <Text style={styles.summaryValue}>{profileSummary.name}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>อีเมล</Text>
              <Text style={styles.summaryValue}>{profileSummary.email || '-'}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>จำนวนต้นไม้</Text>
              <Text style={styles.summaryValue}>{profileSummary.plantCount}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>กิจกรรมที่บันทึก</Text>
              <Text style={styles.summaryValue}>{profileSummary.activityCount}</Text>
            </View>
          </View>
          {lastExportedAt ? (
            <Text style={styles.noteText}>
              ส่งออกล่าสุด: {lastExportedAt.toLocaleString('th-TH')}
            </Text>
          ) : (
            <Text style={styles.noteText}>
              ยังไม่เคยสำรองข้อมูลจากอุปกรณ์นี้
            </Text>
          )}
        </Card>

        <Card variant="flat" style={styles.instructionsCard} shadowLevel="sm">
          <Text style={styles.sectionTitle}>รายละเอียดไฟล์สำรอง</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• โปรไฟล์และการตั้งค่าผู้ใช้</Text>
            <Text style={styles.bulletItem}>• สถิติการดูแลและความสำเร็จ</Text>
            <Text style={styles.bulletItem}>• รายการเหรียญและไมล์สโตน</Text>
          </View>
          <Text style={styles.noteText}>
            ไฟล์จะอยู่ในรูปแบบ JSON เพื่อให้ตรวจสอบหรือย้ายข้อมูลได้สะดวก
          </Text>
        </Card>

        <Button title="ส่งออกข้อมูล" onPress={handleExport} variant="primary" />
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
    summaryItem: {
      flex: 1,
    },
    summaryLabel: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.tertiary,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.primary,
    },
    noteText: {
      marginTop: theme.spacing(2),
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    instructionsCard: {
      borderRadius: radius.lg,
      padding: theme.spacing(4),
      gap: theme.spacing(2),
    },
    bulletList: {
      gap: theme.spacing(1),
    },
    bulletItem: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.secondary,
    },
  });

