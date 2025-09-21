import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  Bell,
  Clock,
  CloudDownload,
  Database,
  Droplet,
  Globe2,
  Languages,
  Lock,
  MoonStar,
  RefreshCw,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  SunMoon,
  ThermometerSun,
  Vibrate,
} from 'lucide-react-native';
import { Card } from '../../components/atoms/Card';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { radius, typography } from '../../core/theme';
import { usePreferencesStore } from '../../stores/preferences';
import { useNotificationStore } from '../../stores/notificationStore';
import { useUser } from '../../stores/userStore';
import { useHaptic } from '../../core/haptics';
import type { GlobalNotificationPreferences } from '../../types/notifications';

type ThemeOption = 'light' | 'dark' | 'system';
type LanguageOption = 'th' | 'en';
type VolumeUnit = 'ml' | 'ล.';
type WeightUnit = 'g' | 'kg';
type TemperatureUnit = 'celsius' | 'fahrenheit';

interface SettingOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SettingRowProps {
  title: string;
  description?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  accessory?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  disabled?: boolean;
}

const themeOptions: SettingOption<ThemeOption>[] = [
  { value: 'light', label: 'สว่าง', icon: <Sun size={16} color="currentColor" /> },
  { value: 'dark', label: 'มืด', icon: <MoonStar size={16} color="currentColor" /> },
  { value: 'system', label: 'ตามระบบ', icon: <SunMoon size={16} color="currentColor" /> },
];

const languageOptions: SettingOption<LanguageOption>[] = [
  { value: 'th', label: 'ไทย' },
  { value: 'en', label: 'English' },
];

const preferredTimeOptions: SettingOption<string>[] = [
  { value: '07:00', label: 'เช้า 07:00' },
  { value: '12:00', label: 'กลางวัน 12:00' },
  { value: '18:00', label: 'เย็น 18:00' },
];

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  description,
  icon: Icon,
  accessory,
  onPress,
  isLast = false,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createSettingRowStyles(theme, isLast), [theme, isLast]);

  const content = (
    <View style={styles.rowContent}>
      <View style={styles.iconContainer}>
        <Icon size={20} color={theme.colors.text.primary} />
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={styles.rowTitle}>{title}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      {accessory ? <View style={styles.accessoryContainer}>{accessory}</View> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        style={[styles.rowWrapper, disabled && styles.rowDisabled]}
        onPress={disabled ? undefined : onPress}
        android_ripple={{ color: theme.colors.background.overlayLight }}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.rowWrapper, disabled && styles.rowDisabled]}>{content}</View>;
};

interface OptionGroupProps<T extends string> {
  value: T;
  options: SettingOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

const OptionGroup = <T extends string>({ value, options, onChange, disabled }: OptionGroupProps<T>) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createOptionStyles(theme), [theme]);

  return (
    <View style={styles.groupContainer}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.optionButton, isActive && styles.optionButtonActive, disabled && styles.optionButtonDisabled]}
            onPress={disabled ? undefined : () => onChange(option.value)}
            android_ripple={{ color: theme.colors.background.overlayLight, borderless: true }}
            accessibilityRole="button"
          >
            <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
              {option.icon}
              {option.icon ? ' ' : ''}
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const SettingsScreen: React.FC = () => {
  const { theme, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hapticController = useHaptic();

  const user = useUser();

  const language = usePreferencesStore((state) => state.userPrefs.language);
  const themePreference = usePreferencesStore((state) => state.userPrefs.theme);
  const hapticsEnabled = usePreferencesStore((state) => state.userPrefs.haptics);
  const units = usePreferencesStore((state) => state.userPrefs.units);
  const privacy = usePreferencesStore((state) => state.userPrefs.privacy);

  const setUserPrefs = usePreferencesStore((state) => state.setUserPrefs);
  const updateTheme = usePreferencesStore((state) => state.updateTheme);
  const updateLanguage = usePreferencesStore((state) => state.updateLanguage);
  const updateUnits = usePreferencesStore((state) => state.updateUnits);
  const updatePrivacy = usePreferencesStore((state) => state.updatePrivacySettings);
  const resetUserPrefs = usePreferencesStore((state) => state.resetUserPrefs);

  const globalNotificationPreferences = useNotificationStore((state) => state.globalPreferences);
  const updateGlobalNotifications = useNotificationStore((state) => state.updateGlobalPreferences);
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);

  const handleThemeChange = useCallback(
    (next: ThemeOption) => {
      if (next === themePreference) return;
      if (hapticsEnabled) {
        void hapticController.selection();
      }
      updateTheme(next);
      void setThemeMode(next);
    },
    [hapticController, hapticsEnabled, setThemeMode, themePreference, updateTheme]
  );

  const handleLanguageChange = useCallback(
    (next: LanguageOption) => {
      if (next === language) return;
      if (hapticsEnabled) {
        void hapticController.selection();
      }
      updateLanguage(next);
    },
    [hapticController, hapticsEnabled, language, updateLanguage]
  );

  const handleToggleNotifications = useCallback(
    (value: boolean) => {
      if (value === globalNotificationPreferences.enabled) return;
      if (hapticsEnabled) {
        void hapticController.selection();
      }
      setUserPrefs({ notifications: value });
      void updateGlobalNotifications({ enabled: value });
    },
    [
      globalNotificationPreferences.enabled,
      hapticController,
      hapticsEnabled,
      setUserPrefs,
      updateGlobalNotifications,
    ]
  );

  const handleToggleHaptics = useCallback(
    (value: boolean) => {
      if (hapticsEnabled) {
        void hapticController.selection();
      }
      setUserPrefs({ haptics: value });
      if (value) {
        hapticController.enable();
      } else {
        hapticController.disable();
      }
    },
    [hapticController, hapticsEnabled, setUserPrefs]
  );

  const handleUnitChange = useCallback(
    (
      key: 'volume' | 'weight' | 'temperature',
      next: VolumeUnit | WeightUnit | TemperatureUnit
    ) => {
      if (hapticsEnabled) {
        void hapticController.selection();
      }
      updateUnits({ [key]: next } as Partial<typeof units>);
    },
    [hapticController, hapticsEnabled, updateUnits]
  );

  const handlePrivacyToggle = useCallback(
    (key: keyof typeof privacy, value: boolean) => {
      if (hapticsEnabled) {
        void hapticController.selection();
      }
      updatePrivacy({ [key]: value });
    },
    [hapticController, hapticsEnabled, updatePrivacy]
  );

  const handleSmartSchedulingToggle = useCallback(
    (key: keyof typeof globalNotificationPreferences.smartScheduling, value: boolean) => {
      if (hapticsEnabled) {
        void hapticController.selection();
      }
      void updateGlobalNotifications({
        smartScheduling: {
          ...globalNotificationPreferences.smartScheduling,
          [key]: value,
        },
      });
    },
    [
      globalNotificationPreferences,
      hapticController,
      hapticsEnabled,
      updateGlobalNotifications,
    ]
  );

  const handleDeliveryToggle = useCallback(
    (key: keyof typeof globalNotificationPreferences.delivery, value: boolean) => {
      if (hapticsEnabled) {
        void hapticController.selection();
      }
      void updateGlobalNotifications({
        delivery: {
          ...globalNotificationPreferences.delivery,
          [key]: value,
        },
      });
    },
    [
      globalNotificationPreferences,
      hapticController,
      hapticsEnabled,
      updateGlobalNotifications,
    ]
  );

  const handlePreferredTimeChange = useCallback(
    (next: string) => {
      if (next === globalNotificationPreferences.timing.preferredTime) return;
      if (hapticsEnabled) {
        void hapticController.selection();
      }
      void updateGlobalNotifications({
        timing: {
          ...globalNotificationPreferences.timing,
          preferredTime: next,
        },
      });
    },
    [globalNotificationPreferences.timing, hapticController, hapticsEnabled, updateGlobalNotifications]
  );

  const handleQuietHoursToggle = useCallback(
    (value: boolean) => {
      if (hapticsEnabled) {
        void hapticController.selection();
      }
      void updateGlobalNotifications({
        timing: {
          ...globalNotificationPreferences.timing,
          quietHours: {
            ...globalNotificationPreferences.timing.quietHours,
            enabled: value,
          },
        },
      });
    },
    [globalNotificationPreferences.timing, hapticController, hapticsEnabled, updateGlobalNotifications]
  );

  const handleResetPreferences = useCallback(() => {
    Alert.alert(
      'รีเซ็ตการตั้งค่า',
      'ต้องการคืนค่าการตั้งค่าเริ่มต้นทั้งหมดหรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ยืนยัน',
          style: 'destructive',
          onPress: () => {
            resetUserPrefs();
            void updateGlobalNotifications(createDefaultNotificationOverrides());
            const nextTheme = usePreferencesStore.getState().userPrefs.theme as ThemeOption;
            void setThemeMode(nextTheme);
            hapticController.enable();
            if (hapticsEnabled) {
              void hapticController.success();
            }
          },
        },
      ]
    );
  }, [
    hapticController,
    hapticsEnabled,
    resetUserPrefs,
    setThemeMode,
    updateGlobalNotifications,
  ]);

  const handleClearNotifications = useCallback(() => {
    Alert.alert(
      'ล้างการแจ้งเตือน',
      'ต้องการลบประวัติการแจ้งเตือนทั้งหมดหรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: () => {
            clearNotifications();
            if (hapticsEnabled) {
              void hapticController.warning();
            }
          },
        },
      ]
    );
  }, [clearNotifications, hapticController, hapticsEnabled]);

  const handleExportData = useCallback(async () => {
    try {
      const payload = user ? JSON.stringify(user, null, 2) : 'ไม่มีข้อมูลผู้ใช้';
      await Share.share({
        title: 'ข้อมูลผู้ใช้ Smart Plant',
        message: payload,
      });
      if (hapticsEnabled) {
        void hapticController.success();
      }
    } catch (error) {
      console.error('Failed to export user data:', error);
      Alert.alert('ไม่สามารถส่งออกข้อมูลได้', 'กรุณาลองใหม่ในภายหลัง');
      if (hapticsEnabled) {
        void hapticController.error();
      }
    }
  }, [hapticController, hapticsEnabled, user]);

  const quietHoursLabel = `${globalNotificationPreferences.timing.quietHours.start} - ${globalNotificationPreferences.timing.quietHours.end}`;

  const joinDate = user?.joinDate
    ? new Date(user.joinDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'ยังไม่ระบุ';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={styles.profileCard} shadowLevel="md">
          <View style={styles.profileHeader}>
            <View style={styles.avatarPlaceholder}>
              <ShieldCheck size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name ?? 'นักปลูกต้นไม้'}</Text>
              <Text style={styles.profileEmail}>{user?.email ?? 'ยังไม่ได้ตั้งค่าอีเมล'}</Text>
              <Text style={styles.profileMeta}>เข้าร่วมเมื่อ {joinDate}</Text>
            </View>
          </View>
          <View style={styles.profileFooter}>
            <View style={styles.profileBadge}>
              <Lock size={16} color={theme.colors.text.secondary} />
              <Text style={styles.profileBadgeText}>ข้อมูลของคุณถูกเข้ารหัส</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>การตั้งค่าทั่วไป</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              title="ธีมแอป"
              description="เลือกโหมดการแสดงผลที่เหมาะกับคุณ"
              icon={SunMoon}
              accessory={
                <OptionGroup<ThemeOption>
                  value={themePreference}
                  options={themeOptions}
                  onChange={handleThemeChange}
                />
              }
            />
            <SettingRow
              title="ภาษา"
              description="สลับภาษาในการใช้งานแอป"
              icon={Languages}
              accessory={
                <OptionGroup<LanguageOption>
                  value={language}
                  options={languageOptions}
                  onChange={handleLanguageChange}
                />
              }
            />
            <SettingRow
              title="การสั่นตอบสนอง"
              description="ให้แอปตอบสนองเมื่อมีการแตะหรือเลือก"
              icon={Vibrate}
              accessory={
                <Switch
                  value={hapticsEnabled}
                  onValueChange={handleToggleHaptics}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
                  thumbColor={theme.colors.white}
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>หน่วยวัด</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              title="ปริมาณน้ำ"
              description="เลือกหน่วยสำหรับการรดน้ำ"
              icon={Droplet}
              accessory={
                <OptionGroup<VolumeUnit>
                  value={units.volume}
                  options={[
                    { value: 'ml', label: 'มล.' },
                    { value: 'ล.', label: 'ลิตร' },
                  ]}
                  onChange={(next) => handleUnitChange('volume', next)}
                />
              }
            />
            <SettingRow
              title="น้ำหนักปุ๋ย"
              description="ชุดหน่วยสำหรับการใส่ปุ๋ย"
              icon={Scale}
              accessory={
                <OptionGroup<WeightUnit>
                  value={units.weight}
                  options={[
                    { value: 'g', label: 'กรัม' },
                    { value: 'kg', label: 'กิโลกรัม' },
                  ]}
                  onChange={(next) => handleUnitChange('weight', next)}
                />
              }
            />
            <SettingRow
              title="อุณหภูมิ"
              description="ปรับหน่วยการแสดงผลอุณหภูมิ"
              icon={ThermometerSun}
              accessory={
                <OptionGroup<TemperatureUnit>
                  value={units.temperature}
                  options={[
                    { value: 'celsius', label: '°C' },
                    { value: 'fahrenheit', label: '°F' },
                  ]}
                  onChange={(next) => handleUnitChange('temperature', next)}
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>การแจ้งเตือน</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              title="เปิดใช้งานการแจ้งเตือน"
              description="รับการแจ้งเตือนการดูแลต้นไม้และคำแนะนำ AI"
              icon={Bell}
              accessory={
                <Switch
                  value={globalNotificationPreferences.enabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
                  thumbColor={theme.colors.white}
                />
              }
            />
            <SettingRow
              title="เงียบตอนกลางคืน"
              description={`เปิด/ปิดโหมดห้ามรบกวน ${quietHoursLabel}`}
              icon={MoonStar}
              accessory={
                <Switch
                  value={globalNotificationPreferences.timing.quietHours.enabled}
                  onValueChange={handleQuietHoursToggle}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
                  thumbColor={theme.colors.white}
                  disabled={!globalNotificationPreferences.enabled}
                />
              }
            />
            <SettingRow
              title="เวลาที่แจ้งเตือน"
              description="เลือกช่วงเวลาที่เหมาะกับคุณ"
              icon={Clock}
              accessory={
                <OptionGroup<string>
                  value={globalNotificationPreferences.timing.preferredTime}
                  options={preferredTimeOptions}
                  onChange={handlePreferredTimeChange}
                  disabled={!globalNotificationPreferences.enabled}
                />
              }
              disabled={!globalNotificationPreferences.enabled}
            />
            <SettingRow
              title="เสียงแจ้งเตือน"
              description="เปิดเสียงเมื่อมีการเตือน"
              icon={SlidersHorizontal}
              accessory={
                <Switch
                  value={globalNotificationPreferences.delivery.sound}
                  onValueChange={(value) => handleDeliveryToggle('sound', value)}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
                  thumbColor={theme.colors.white}
                  disabled={!globalNotificationPreferences.enabled}
                />
              }
            />
            <SettingRow
              title="การสั่นเตือน"
              description="สั่นเมื่อมีการแจ้งเตือนสำคัญ"
              icon={Vibrate}
              accessory={
                <Switch
                  value={globalNotificationPreferences.delivery.vibration}
                  onValueChange={(value) => handleDeliveryToggle('vibration', value)}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
                  thumbColor={theme.colors.white}
                  disabled={!globalNotificationPreferences.enabled}
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI & ความเป็นส่วนตัว</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              title="คำแนะนำ AI ส่วนบุคคล"
              description="รับคำแนะนำตามพฤติกรรมการดูแลของคุณ"
              icon={Globe2}
              accessory={
                <Switch
                  value={privacy.personalizedTips}
                  onValueChange={(value) => handlePrivacyToggle('personalizedTips', value)}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
                  thumbColor={theme.colors.white}
                />
              }
            />
            <SettingRow
              title="การเก็บข้อมูลการใช้งาน"
              description="ช่วยพัฒนาแอปด้วยข้อมูลการใช้งานแบบไม่ระบุตัวตน"
              icon={ShieldCheck}
              accessory={
                <Switch
                  value={privacy.analytics}
                  onValueChange={(value) => handlePrivacyToggle('analytics', value)}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
                  thumbColor={theme.colors.white}
                />
              }
            />
            <SettingRow
              title="รายงานข้อผิดพลาด"
              description="ส่งข้อมูล log เมื่อเกิดปัญหาเพื่อช่วยแก้ไข"
              icon={CloudDownload}
              accessory={
                <Switch
                  value={privacy.crashReporting}
                  onValueChange={(value) => handlePrivacyToggle('crashReporting', value)}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
                  thumbColor={theme.colors.white}
                />
              }
            />
            <SettingRow
              title="ปรับการแจ้งเตือนอัจฉริยะตามสภาพอากาศ"
              description="รับการแจ้งเตือนตามสภาพอากาศและฤดูกาล"
              icon={Sun}
              accessory={
                <Switch
                  value={globalNotificationPreferences.smartScheduling.weatherIntegration}
                  onValueChange={(value) => handleSmartSchedulingToggle('weatherIntegration', value)}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
                  thumbColor={theme.colors.white}
                  disabled={!globalNotificationPreferences.enabled}
                />
              }
            />
            <SettingRow
              title="จัดกลุ่มแจ้งเตือนที่คล้ายกัน"
              description="ลดการแจ้งเตือนรัว ๆ ด้วยการจัดกลุ่ม"
              icon={Bell}
              accessory={
                <Switch
                  value={globalNotificationPreferences.smartScheduling.batchSimilarNotifications}
                  onValueChange={(value) => handleSmartSchedulingToggle('batchSimilarNotifications', value)}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
                  thumbColor={theme.colors.white}
                  disabled={!globalNotificationPreferences.enabled}
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ข้อมูลและการบำรุงรักษา</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              title="สำรองข้อมูลผู้ใช้"
              description="ส่งออกข้อมูลโปรไฟล์และสถิติการดูแล"
              icon={Database}
              onPress={handleExportData}
            />
            <SettingRow
              title="รีเซ็ตการตั้งค่า"
              description="คืนค่าการตั้งค่ามาตรฐานทั้งหมด"
              icon={RefreshCw}
              onPress={handleResetPreferences}
            />
            <SettingRow
              title="ล้างการแจ้งเตือน"
              description="ลบประวัติการแจ้งเตือนทั้งหมด"
              icon={Bell}
              onPress={handleClearNotifications}
              isLast
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createDefaultNotificationOverrides = (): Partial<GlobalNotificationPreferences> => ({
  enabled: true,
  delivery: {
    push: true,
    sound: true,
    vibration: true,
    badge: true,
  },
  smartScheduling: {
    enabled: true,
    weatherIntegration: true,
    seasonalAdjustments: true,
    batchSimilarNotifications: true,
    priorityBasedDelivery: true,
  },
  timing: {
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '06:00',
    },
    preferredTime: '08:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing(4),
      paddingVertical: theme.spacing(4),
      gap: theme.spacing(4),
    },
    profileCard: {
      borderRadius: radius.xl,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(3),
    },
    avatarPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: theme.colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontFamily: typography.fontFamily.bold,
      fontSize: typography.fontSize['2xl'],
      color: theme.colors.text.primary,
    },
    profileEmail: {
      marginTop: 4,
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    profileMeta: {
      marginTop: 2,
      fontSize: typography.fontSize.xs,
      color: theme.colors.text.tertiary,
    },
    profileFooter: {
      marginTop: theme.spacing(3),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.divider,
      paddingTop: theme.spacing(3),
    },
    profileBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(1.5),
    },
    profileBadgeText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    section: {
      gap: theme.spacing(2),
    },
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.divider,
      overflow: 'hidden',
    },
  });

const createSettingRowStyles = (theme: Theme, isLast: boolean) =>
  StyleSheet.create({
    rowWrapper: {
      paddingHorizontal: theme.spacing(3),
      backgroundColor: theme.colors.surface.primary,
    },
    rowDisabled: {
      opacity: 0.6,
    },
    rowContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing(3),
      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.divider,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: theme.colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing(3),
    },
    rowTextContainer: {
      flex: 1,
    },
    rowTitle: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.primary,
      fontFamily: typography.fontFamily.medium,
    },
    rowDescription: {
      marginTop: 4,
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    accessoryContainer: {
      marginLeft: theme.spacing(3),
    },
  });

const createOptionStyles = (theme: Theme) =>
  StyleSheet.create({
    groupContainer: {
      flexDirection: 'row',
      gap: theme.spacing(1),
      alignItems: 'center',
    },
    optionButton: {
      paddingHorizontal: theme.spacing(2),
      paddingVertical: theme.spacing(1.5),
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.divider,
      backgroundColor: theme.colors.surface.primary,
    },
    optionButtonActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    optionButtonDisabled: {
      opacity: 0.5,
    },
    optionLabel: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontFamily: typography.fontFamily.medium,
    },
    optionLabelActive: {
      color: theme.colors.primary,
    },
  });

export default SettingsScreen;
