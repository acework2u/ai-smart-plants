import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Droplet,
  Sprout,
  Zap,
  ArrowUpDown,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  History
} from 'lucide-react-native';
import { ActivityKind, CreateActivityInput, NPK, Unit, formatQuantityWithUnit } from '@/types/activity';
import { useActivityStore, usePlantActivities } from '@/stores/activity';
import { usePrefsStore } from '@/stores/prefsStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/I18nContext';
import { getSpacing, radius } from '@/core/theme';
import { typography } from '@/core/theme';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { useHaptic } from '@/core/haptics';

const EMPTY_NPK: NPK = { n: '', p: '', k: '' };

export default function ActivityLogScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const haptic = useHaptic();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { id } = useLocalSearchParams();
  const plantId = useMemo(() => {
    if (Array.isArray(id)) {
      return id[0] ?? '';
    }
    return typeof id === 'string' ? id : '';
  }, [id]);

  const addActivity = useActivityStore((state) => state.addActivity);
  const activityHistory = usePlantActivities(plantId);

  const [selectedActivity, setSelectedActivity] = useState<ActivityKind>('รดน้ำ');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('ml');
  const [npk, setNpk] = useState<NPK>(EMPTY_NPK);
  const prefsInitializedRef = useRef(false);

  const activityTypes = useMemo(() => [
    { kind: 'รดน้ำ' as ActivityKind, icon: Droplet, color: theme.colors.info, label: 'รดน้ำ' },
    { kind: 'ใส่ปุ๋ย' as ActivityKind, icon: Sprout, color: theme.colors.success, label: 'ใส่ปุ๋ย' },
    { kind: 'พ่นยา' as ActivityKind, icon: Zap, color: theme.colors.warning, label: 'พ่นยา' },
    { kind: 'ย้ายกระถาง' as ActivityKind, icon: ArrowUpDown, color: theme.colors.primary, label: 'ย้ายกระถาง' },
    { kind: 'ตรวจใบ' as ActivityKind, icon: Eye, color: theme.colors.text.link, label: 'ตรวจใบ' },
  ], [theme.colors]);

  const units: Unit[] = ['ml', 'g', 'pcs', 'ล.'];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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
      setNpk(EMPTY_NPK);
    }
  }, [selectedActivity]);

  const sanitizeNumeric = (value: string) => value.replace(/[^0-9.]/g, '');

  const handleBack = useCallback(() => {
    haptic.trigger('light');
    router.back();
  }, [haptic, router]);

  const handleSave = useCallback(() => {
    if (!plantId) {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลต้นไม้');
      return;
    }

    haptic.trigger('success');

    const now = new Date();
    const entry: CreateActivityInput = {
      plantId,
      kind: selectedActivity,
      unit: unit as Unit,
      dateISO: now.toISOString(),
      time24: now.toTimeString().slice(0, 5),
      source: 'user',
      ...(quantity ? { quantity } : {}),
      ...(selectedActivity === 'ใส่ปุ๋ย' ? { npk } : {}),
    };

    addActivity(entry);

    Alert.alert(
      'บันทึกสำเร็จ',
      'กิจกรรมการดูแลได้รับการบันทึกแล้ว',
      [{ text: 'ตกลง', onPress: () => router.back() }]
    );
  }, [plantId, selectedActivity, unit, quantity, npk, addActivity, haptic, router]);

  const handleActivitySelect = useCallback((activity: ActivityKind) => {
    haptic.trigger('light');
    setSelectedActivity(activity);
  }, [haptic]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primary]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>บันทึกการดูแล</Text>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Activity Type Section */}
          <Card style={styles.section} shadowLevel="sm">
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>เลือกประเภทการดูแล</Text>
            </View>

            <View style={styles.activityGrid}>
              {activityTypes.map((activity) => {
                const Icon = activity.icon;
                const isSelected = selectedActivity === activity.kind;

                return (
                  <TouchableOpacity
                    key={activity.kind}
                    style={[
                      styles.activityCard,
                      isSelected && [styles.activityCardActive, { borderColor: activity.color }]
                    ]}
                    onPress={() => handleActivitySelect(activity.kind)}
                  >
                    <View style={[
                      styles.activityIconContainer,
                      { backgroundColor: isSelected ? activity.color : `${activity.color}20` }
                    ]}>
                      <Icon
                        size={24}
                        color={isSelected ? '#ffffff' : activity.color}
                      />
                    </View>
                    <Text style={[
                      styles.activityLabel,
                      isSelected && styles.activityLabelActive
                    ]}>
                      {activity.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Quantity Section */}
          <Card style={styles.section} shadowLevel="sm">
            <View style={styles.sectionHeader}>
              <Clock size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>ระบุปริมาณ</Text>
            </View>

            <View style={styles.quantityContainer}>
              <View style={styles.quantityInputContainer}>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="ระบุจำนวน"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.text.disabled}
                />
              </View>

              <View style={styles.unitSelector}>
                <Text style={styles.unitLabel}>หน่วย:</Text>
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
          </Card>

          {/* NPK Section - Only for fertilizer */}
          {selectedActivity === 'ใส่ปุ๋ย' && (
            <Card style={styles.section} shadowLevel="sm">
              <View style={styles.sectionHeader}>
                <Sprout size={20} color={theme.colors.success} />
                <Text style={styles.sectionTitle}>ค่า NPK (%)</Text>
              </View>

              <View style={styles.npkContainer}>
                <View style={styles.npkInputGroup}>
                  <View style={styles.npkInputWrapper}>
                    <Text style={styles.npkInputLabel}>N</Text>
                    <TextInput
                      style={styles.npkInput}
                      placeholder="0"
                      value={npk.n}
                      onChangeText={(value) =>
                        setNpk((prev) => ({ ...prev, n: sanitizeNumeric(value) }))
                      }
                      keyboardType="numeric"
                      maxLength={3}
                      placeholderTextColor={theme.colors.text.disabled}
                    />
                  </View>

                  <View style={styles.npkInputWrapper}>
                    <Text style={styles.npkInputLabel}>P</Text>
                    <TextInput
                      style={styles.npkInput}
                      placeholder="0"
                      value={npk.p}
                      onChangeText={(value) =>
                        setNpk((prev) => ({ ...prev, p: sanitizeNumeric(value) }))
                      }
                      keyboardType="numeric"
                      maxLength={3}
                      placeholderTextColor={theme.colors.text.disabled}
                    />
                  </View>

                  <View style={styles.npkInputWrapper}>
                    <Text style={styles.npkInputLabel}>K</Text>
                    <TextInput
                      style={styles.npkInput}
                      placeholder="0"
                      value={npk.k}
                      onChangeText={(value) =>
                        setNpk((prev) => ({ ...prev, k: sanitizeNumeric(value) }))
                      }
                      keyboardType="numeric"
                      maxLength={3}
                      placeholderTextColor={theme.colors.text.disabled}
                    />
                  </View>
                </View>

                <Text style={styles.npkHint}>
                  💡 ค่า NPK ช่วยติดตามคุณภาพของปุ๋ยที่ใช้
                </Text>
              </View>
            </Card>
          )}

          {/* Save Button */}
          <View style={styles.saveButtonContainer}>
            <Button
              title="บันทึกการดูแล"
              onPress={handleSave}
              variant="primary"
              size="lg"
              leftIcon={<CheckCircle size={20} color="#ffffff" />}
              style={styles.saveButton}
            />
          </View>

          {/* Recent Activities */}
          <Card style={[styles.section, styles.historySection]} shadowLevel="sm">
            <View style={styles.sectionHeader}>
              <History size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>กิจกรรมล่าสุด</Text>
            </View>

            <View style={styles.activityHistory}>
              {!plantId && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>ต้องระบุต้นไม้ก่อนบันทึกกิจกรรม</Text>
                </View>
              )}
              {plantId && activityHistory.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>ยังไม่มีประวัติการดูแล</Text>
                  <Text style={styles.emptyStateSubtext}>เริ่มบันทึกการดูแลต้นไม้ของคุณ</Text>
                </View>
              )}
              {plantId && activityHistory.slice(0, 5).map((activity) => {
                const amount = formatQuantityWithUnit(activity.quantity, activity.unit);
                const npkLabel = activity.npk
                  ? ` • NPK ${activity.npk.n}-${activity.npk.p}-${activity.npk.k}`
                  : '';
                const timestamp = activity.time24
                  ? `${activity.dateISO.slice(0, 10)} ${activity.time24}`
                  : activity.dateISO.slice(0, 10);

                const activityType = activityTypes.find(type => type.kind === activity.kind);
                const Icon = activityType?.icon || Calendar;
                const color = activityType?.color || theme.colors.primary;

                return (
                  <View key={activity.id} style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <View style={[styles.historyIcon, { backgroundColor: `${color}20` }]}>
                        <Icon size={16} color={color} />
                      </View>
                      <View style={styles.historyCardContent}>
                        <Text style={styles.historyTitle}>{activity.kind}</Text>
                        <Text style={styles.historySubtitle}>
                          {amount || 'ไม่ระบุปริมาณ'}{npkLabel}
                        </Text>
                      </View>
                      <Text style={styles.historyTimestamp}>{timestamp}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },

    // Header Styles
    header: {
      zIndex: 1000,
    },
    headerGradient: {
      paddingTop: getSpacing(12),
      paddingBottom: getSpacing(4),
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: getSpacing(4),
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      color: '#ffffff',
      fontSize: typography.fontSize.xl,
      fontFamily: typography.fontFamily.semibold,
    },
    headerSpacer: {
      width: 44,
    },

    // Content Styles
    content: {
      flex: 1,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: getSpacing(8),
    },

    // Section Styles
    section: {
      margin: getSpacing(4),
      marginBottom: getSpacing(6),
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: getSpacing(4),
      gap: getSpacing(2),
    },
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
    },

    // Activity Type Styles
    activityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: getSpacing(3),
    },
    activityCard: {
      flex: 1,
      minWidth: '45%',
      padding: getSpacing(4),
      borderRadius: radius.lg,
      backgroundColor: theme.colors.surface.primary,
      borderWidth: 2,
      borderColor: theme.colors.surface.disabled,
      alignItems: 'center',
      gap: getSpacing(2),
    },
    activityCardActive: {
      backgroundColor: theme.colors.surface.elevated,
      borderWidth: 2,
    },
    activityIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityLabel: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    activityLabelActive: {
      color: theme.colors.text.primary,
      fontFamily: typography.fontFamily.semibold,
    },

    // Quantity Styles
    quantityContainer: {
      gap: getSpacing(4),
    },
    quantityInputContainer: {
      marginBottom: getSpacing(3),
    },
    quantityInput: {
      borderWidth: 1,
      borderColor: theme.colors.surface.disabled,
      borderRadius: radius.md,
      paddingHorizontal: getSpacing(4),
      paddingVertical: getSpacing(3),
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.surface.primary,
    },
    unitSelector: {
      gap: getSpacing(2),
    },
    unitLabel: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
    unitButtons: {
      flexDirection: 'row',
      gap: getSpacing(2),
    },
    unitButton: {
      paddingHorizontal: getSpacing(3),
      paddingVertical: getSpacing(2),
      borderRadius: radius.md,
      backgroundColor: theme.colors.surface.secondary,
      borderWidth: 1,
      borderColor: theme.colors.surface.disabled,
      minWidth: 44,
      alignItems: 'center',
    },
    unitButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    unitButtonText: {
      color: theme.colors.text.secondary,
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
    },
    unitButtonTextActive: {
      color: '#ffffff',
      fontFamily: typography.fontFamily.semibold,
    },

    // NPK Styles
    npkContainer: {
      gap: getSpacing(3),
    },
    npkInputGroup: {
      flexDirection: 'row',
      gap: getSpacing(3),
    },
    npkInputWrapper: {
      flex: 1,
      alignItems: 'center',
      gap: getSpacing(1),
    },
    npkInputLabel: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
    },
    npkInput: {
      width: '100%',
      borderWidth: 1,
      borderColor: theme.colors.surface.disabled,
      borderRadius: radius.md,
      paddingHorizontal: getSpacing(3),
      paddingVertical: getSpacing(3),
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.surface.primary,
      textAlign: 'center',
    },
    npkHint: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      paddingTop: getSpacing(2),
    },

    // Save Button Styles
    saveButtonContainer: {
      margin: getSpacing(4),
      marginTop: getSpacing(6),
    },
    saveButton: {
      borderRadius: radius.xl,
    },

    // History Styles
    historySection: {
      marginTop: getSpacing(2),
    },
    activityHistory: {
      gap: getSpacing(3),
    },
    historyCard: {
      borderRadius: radius.lg,
      backgroundColor: theme.colors.surface.primary,
      borderWidth: 1,
      borderColor: theme.colors.surface.disabled,
    },
    historyCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: getSpacing(4),
      gap: getSpacing(3),
    },
    historyIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    historyCardContent: {
      flex: 1,
      gap: getSpacing(1),
    },
    historyTitle: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
    },
    historySubtitle: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.secondary,
    },
    historyTimestamp: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.tertiary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: getSpacing(8),
      gap: getSpacing(2),
    },
    emptyStateText: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    emptyStateSubtext: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
    },

    bottomSpacing: {
      height: getSpacing(4),
    },
  });