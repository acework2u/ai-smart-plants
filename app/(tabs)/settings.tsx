import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Clock,
  CloudDownload,
  Database,
  Droplet,
  Globe2,
  Languages,
  Lock,
  MoonStar,
  Palette,
  RefreshCw,
  Scale,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  SunMoon,
  ThermometerSun,
  User,
  Vibrate,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/atoms/Card';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { useHaptic } from '../../core/haptics';
import { radius, typography } from '../../core/theme';
import { useNotificationStore } from '../../stores/notificationStore';
import { usePreferencesStore } from '../../stores/preferences';
import { useUser } from '../../stores/userStore';

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
  const showChevron = Boolean(onPress && !accessory);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  }, [scaleAnim]);

  const trailing = accessory ? (
    <Animated.View style={[styles.accessoryContainer, { transform: [{ scale: scaleAnim }] }]}>
      {accessory}
    </Animated.View>
  ) : showChevron ? (
    <View style={styles.chevronContainer}>
      <ChevronRight size={20} color={theme.colors.text.tertiary} />
    </View>
  ) : null;

  const content = (
    <View style={styles.rowContent}>
      <View style={styles.iconContainer}>
        <Icon size={22} color={theme.isDark ? theme.colors.primarySoft : theme.colors.primary} />
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={styles.rowTitle}>{title}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      {trailing}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        style={[styles.rowWrapper, disabled && styles.rowDisabled]}
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: theme.colors.background.overlayLight }}
        accessibilityRole="button"
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {content}
        </Animated.View>
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

  // For 3+ options, use vertical layout
  const useVerticalLayout = options.length >= 3;

  return (
    <View style={[styles.groupContainer, useVerticalLayout && styles.groupVertical]}>
      {options.map((option, index) => {
        const isActive = option.value === value;
        const isLast = index === options.length - 1;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.optionButton,
              useVerticalLayout && styles.optionButtonVertical,
              useVerticalLayout && !isLast && styles.optionButtonWithBorder,
              isActive && styles.optionButtonActive,
              disabled && styles.optionButtonDisabled,
            ]}
            onPress={disabled ? undefined : () => onChange(option.value)}
            android_ripple={{ color: theme.colors.background.overlayLight, borderless: true }}
            accessibilityRole="button"
          >
            <View style={styles.optionContent}>
              {option.icon && <View style={styles.optionIcon}>{option.icon}</View>}
              <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                {option.label}
              </Text>
              {isActive && (
                <View style={styles.checkMark}>
                  <Text style={styles.checkMarkText}>✓</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

interface SectionContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SectionContainer: React.FC<SectionContainerProps> = ({ title, description, children }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createSectionStyles(theme), [theme]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 5,
      }),
    ]).start();
  }, [fadeAnim, translateY]);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <Card variant="elevated" style={styles.card} padding={0} shadowLevel="md">
        {children}
      </Card>
    </Animated.View>
  );
};

const SettingsScreen: React.FC = () => {
  const router = useRouter();
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

  const globalNotificationPreferences = useNotificationStore((state) => state.globalPreferences);
  const updateGlobalNotifications = useNotificationStore((state) => state.updateGlobalPreferences);

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

  const quietHoursLabel = `${globalNotificationPreferences.timing.quietHours.start} - ${globalNotificationPreferences.timing.quietHours.end}`;

  const joinDate = user?.joinDate
    ? new Date(user.joinDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'ยังไม่ระบุ';

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
        <View style={styles.header}>
          <Settings2 size={24} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>การตั้งค่า</Text>
          <View style={styles.headerBadge}>
            <Sparkles size={16} color={theme.colors.warning} />
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Card variant="elevated" style={styles.profileCard} shadowLevel="lg">
          <View style={styles.profileGradient}>
            <View style={styles.profilePattern} />
          </View>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <User size={32} color={theme.colors.white} />
              </View>
              <View style={styles.avatarBadge}>
                <ShieldCheck size={14} color={theme.colors.white} />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name ?? 'นักปลูกต้นไม้'}</Text>
              <Text style={styles.profileEmail}>{user?.email ?? 'ยังไม่ได้ตั้งค่าอีเมล'}</Text>
              <View style={styles.profileStats}>
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatValue}>12</Text>
                  <Text style={styles.profileStatLabel}>ต้นไม้</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatValue}>45</Text>
                  <Text style={styles.profileStatLabel}>วันดูแล</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStat}>
                  <Text style={styles.profileStatValue}>89%</Text>
                  <Text style={styles.profileStatLabel}>สุขภาพ</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.profileFooter}>
            <View style={styles.profileBadge}>
              <Lock size={14} color={theme.colors.success} />
              <Text style={styles.profileBadgeText}>ข้อมูลปลอดภัย</Text>
            </View>
            <Text style={styles.profileJoinDate}>เข้าร่วม {joinDate}</Text>
          </View>
        </Card>

        <SectionContainer
          title="✨ การตั้งค่าทั่วไป"
          description="ปรับแต่งแอปให้เป็นสไตล์ของคุณ"
        >
          <SettingRow
            title="ธีมแอป"
            description="เลือกโหมดแสงสว่างหรือมืด"
            icon={Palette}
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
        </SectionContainer>

        <SectionContainer
          title="📏 หน่วยวัด"
          description="เลือกหน่วยที่คุณถนัดเพื่อความแม่นยำ"
        >
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
        </SectionContainer>

        <SectionContainer
          title="🔔 การแจ้งเตือน"
          description="จัดการการแจ้งเตือนให้ตรงใจคุณ"
        >
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
                value={globalNotificationPreferences.timing?.preferredTime || '07:00'}
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
        </SectionContainer>

        <SectionContainer
          title="🤖 AI & ความเป็นส่วนตัว"
          description="จัดการข้อมูลและคำแนะนำอัจฉริยะ"
        >
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
        </SectionContainer>

        <SectionContainer
          title="💾 ข้อมูลและบำรุงรักษา"
          description="จัดการข้อมูลบนอุปกรณ์ของคุณ"
        >
          <SettingRow
            title="สำรองข้อมูลผู้ใช้"
            description="ส่งออกข้อมูลโปรไฟล์และสถิติการดูแล"
            icon={Database}
            onPress={() => router.push('/settings/data-backup')}
          />
          <SettingRow
            title="รีเซ็ตการตั้งค่า"
            description="คืนค่าการตั้งค่ามาตรฐานทั้งหมด"
            icon={RefreshCw}
            onPress={() => router.push('/settings/reset-preferences')}
          />
          <SettingRow
            title="ล้างการแจ้งเตือน"
            description="ลบประวัติการแจ้งเตือนทั้งหมด"
            icon={Bell}
            onPress={() => router.push('/settings/clear-notifications')}
            isLast
          />
        </SectionContainer>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Smart Plant Care v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with 💚 for plant lovers</Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    headerContainer: {
      paddingHorizontal: theme.spacing(4),
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(1),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: typography.fontSize.xl,
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginHorizontal: theme.spacing(2),
    },
    headerBadge: {
      padding: theme.spacing(1),
    },
    scrollContent: {
      paddingHorizontal: theme.spacing(3),
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(10),
    },
    profileCard: {
      borderRadius: radius['2xl'],
      marginBottom: theme.spacing(5),
      overflow: 'hidden',
    },
    profileGradient: {
      height: 60,
      backgroundColor: theme.isDark ? theme.colors.primary : theme.colors.primarySoft,
      position: 'relative' as const,
    },
    profilePattern: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      width: 100,
      height: 60,
      backgroundColor: theme.colors.white,
      opacity: 0.05,
      transform: [{ rotate: '45deg' }],
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: theme.spacing(4),
      paddingTop: theme.spacing(3),
      marginTop: -30,
    },
    avatarContainer: {
      position: 'relative' as const,
    },
    avatarPlaceholder: {
      width: 72,
      height: 72,
      borderRadius: radius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: theme.colors.surface.primary,
      elevation: 4,
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    avatarBadge: {
      position: 'absolute' as const,
      bottom: 0,
      right: 0,
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: theme.colors.success,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface.primary,
    },
    profileInfo: {
      flex: 1,
      marginLeft: theme.spacing(3),
      paddingTop: theme.spacing(2),
    },
    profileName: {
      fontFamily: typography.fontFamily.bold,
      fontSize: typography.fontSize['2xl'],
      color: theme.colors.text.primary,
      marginBottom: theme.spacing(0.5),
    },
    profileEmail: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing(2),
    },
    profileStats: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileStat: {
      alignItems: 'center',
    },
    profileStatValue: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.primary,
    },
    profileStatLabel: {
      fontSize: typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    profileStatDivider: {
      width: 1,
      height: 30,
      backgroundColor: theme.colors.divider,
      marginHorizontal: theme.spacing(3),
    },
    profileMeta: {
      marginTop: 2,
      fontSize: typography.fontSize.xs,
      color: theme.colors.text.tertiary,
    },
    profileFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing(2),
      paddingTop: theme.spacing(3),
      paddingHorizontal: theme.spacing(4),
      paddingBottom: theme.spacing(3),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.divider,
    },
    profileBadge: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileBadgeText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginLeft: theme.spacing(1),
    },
    profileJoinDate: {
      fontSize: typography.fontSize.xs,
      color: theme.colors.text.tertiary,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: theme.spacing(4),
      marginTop: theme.spacing(2),
    },
    footerText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
    footerSubtext: {
      fontSize: typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      marginTop: theme.spacing(1),
    },
  });

const createSectionStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: theme.spacing(5),
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing(1),
    },
    description: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing(3),
    },
    card: {
      borderRadius: radius.xl,
      backgroundColor: theme.colors.surface.primary,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
  });

const createSettingRowStyles = (theme: Theme, isLast: boolean) =>
  StyleSheet.create({
    rowWrapper: {
      paddingHorizontal: theme.spacing(4),
      backgroundColor: theme.colors.surface.primary,
    },
    rowDisabled: {
      opacity: 0.5,
    },
    rowContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: theme.spacing(3.5),
      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.divider,
      minHeight: 60,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      backgroundColor: theme.isDark
        ? theme.colors.background.secondary
        : theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing(3),
    },
    rowTextContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingRight: theme.spacing(2),
    },
    rowTitle: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.primary,
      fontFamily: typography.fontFamily.semibold,
      marginBottom: 2,
    },
    rowDescription: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.tertiary,
      lineHeight: 18,
    },
    accessoryContainer: {
      marginLeft: theme.spacing(2),
      flexShrink: 0,
      maxWidth: '50%',
      minWidth: 120,
    },
    chevronContainer: {
      marginLeft: theme.spacing(2),
      opacity: 0.5,
    },
  });

const createOptionStyles = (theme: Theme) =>
  StyleSheet.create({
    groupContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: theme.spacing(1.5),
    },
    groupVertical: {
      flexDirection: 'column',
      gap: 0,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      backgroundColor: theme.colors.background.secondary,
      overflow: 'hidden',
    },
    optionButton: {
      paddingHorizontal: theme.spacing(3),
      paddingVertical: theme.spacing(2),
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: theme.colors.divider,
      backgroundColor: theme.colors.background.secondary,
      minWidth: 80,
    },
    optionButtonVertical: {
      paddingHorizontal: theme.spacing(4),
      paddingVertical: theme.spacing(3),
      borderRadius: 0,
      borderWidth: 0,
      backgroundColor: 'transparent',
      minWidth: 0,
      width: '100%',
    },
    optionButtonWithBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.divider,
    },
    optionButtonActive: {
      backgroundColor: theme.isDark ? theme.colors.primary : theme.colors.primarySoft,
      borderColor: theme.colors.primary,
      elevation: 1,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    optionButtonDisabled: {
      opacity: 0.4,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
    },
    optionIcon: {
      marginRight: theme.spacing(2),
    },
    optionLabel: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontFamily: typography.fontFamily.semibold,
      flex: 1,
    },
    optionLabelActive: {
      color: theme.isDark ? theme.colors.white : theme.colors.primary,
      fontFamily: typography.fontFamily.bold,
    },
    checkMark: {
      width: 20,
      height: 20,
      borderRadius: radius.full,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: theme.spacing(2),
    },
    checkMarkText: {
      color: theme.colors.white,
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.bold,
    },
  });

export default SettingsScreen;
