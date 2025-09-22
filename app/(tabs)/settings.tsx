import React, { useCallback, useMemo, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Bell,
  Clock,
  CloudDownload,
  Database,
  Droplet,
  Globe2,
  Languages,
  MoonStar,
  Palette,
  RefreshCw,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  ThermometerSun,
  Vibrate,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { Card } from '../../components/atoms/Card';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { radius, typography } from '../../core/theme';
import { usePreferencesStore } from '../../stores/preferences';
import { useNotificationStore } from '../../stores/notificationStore';
import { useUser } from '../../stores/userStore';
import { useHaptic } from '../../core/haptics';
import { useTranslation } from '../../contexts/I18nContext';

type ThemeOption = 'light' | 'dark' | 'system';
type LanguageOption = 'th' | 'en';
type VolumeUnit = 'ml' | 'ล.';
type WeightUnit = 'g' | 'kg';
type TemperatureUnit = 'celsius' | 'fahrenheit';

type IconComponent = React.ComponentType<{ size?: number; color?: string }>;

interface SettingOption<T extends string> {
  value: T;
  label: string;
}

interface SettingListItem {
  key: string;
  icon: IconComponent;
  title: string;
  subtitle?: string;
  accessory?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

interface OptionGroupProps<T extends string> {
  value: T;
  options: SettingOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onTimeSelect: (time: string) => void;
  initialTime: string;
}

const OptionGroup = <T extends string>({ value, options, onChange, disabled }: OptionGroupProps<T>) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createOptionStyles(theme), [theme]);

  // Use grid layout for 4 options (2x2)
  const useGridLayout = options.length === 4;

  return (
    <View style={[styles.groupContainer, useGridLayout && styles.gridContainer]}>
      {options.map((option, index) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.optionButton,
              useGridLayout && styles.gridOptionButton,
              isActive && styles.optionButtonActive,
              disabled && styles.optionButtonDisabled,
            ]}
            onPress={disabled ? undefined : () => onChange(option.value)}
            android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
            accessibilityRole="button"
          >
            <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

interface SettingRowProps extends SettingListItem {
  isLast: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon: Icon,
  title,
  subtitle,
  accessory,
  onPress,
  disabled = false,
  isLast,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createRowStyles(theme, isLast), [theme, isLast]);
  const showChevron = Boolean(onPress && !accessory);

  const content = (
    <View style={styles.rowContent}>
      <View style={styles.iconWrapper}>
        <Icon size={18} color={theme.colors.text.primary} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {accessory ? <View style={styles.accessoryWrapper}>{accessory}</View> : null}
      {showChevron ? <ChevronRight size={18} color={theme.colors.text.tertiary} /> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        style={[styles.rowContainer, disabled && styles.rowDisabled]}
        onPress={disabled ? undefined : onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.rowContainer, disabled && styles.rowDisabled]}>{content}</View>;
};

interface HeroActionProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}

const HeroAction: React.FC<HeroActionProps> = ({ icon, label, onPress }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createHeroActionStyles(theme), [theme]);

  if (onPress) {
    return (
      <Pressable style={styles.button} onPress={onPress} android_ripple={{ color: 'rgba(255,255,255,0.25)' }}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.button}>
      {icon}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

interface SectionConfig {
  key: string;
  title: string;
  description?: string;
  items: SettingListItem[];
}

interface SettingsSectionProps {
  section: SectionConfig;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ section }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createSectionStyles(theme), [theme]);

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.description ? <Text style={styles.sectionDescription}>{section.description}</Text> : null}
      <Card variant="flat" style={styles.sectionCard} padding={0} shadowLevel="sm">
        {section.items.map((item, index) => {
          const { key, ...itemProps } = item;
          return (
            <SettingRow key={key} {...itemProps} isLast={index === section.items.length - 1} />
          );
        })}
      </Card>
    </View>
  );
};

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onTimeSelect,
  initialTime,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createTimePickerStyles(theme), [theme]);

  const [selectedHour, setSelectedHour] = useState(
    initialTime ? parseInt(initialTime.split(':')[0]) : 8
  );
  const [selectedMinute, setSelectedMinute] = useState(
    initialTime ? parseInt(initialTime.split(':')[1]) : 0
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5-minute intervals

  const handleConfirm = () => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute
      .toString()
      .padStart(2, '0')}`;
    onTimeSelect(timeString);
    onClose();
  };

  const formatTime = (hour: number, minute: number) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
    return timeString;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Animated.View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('settings.timePicker.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.preview}>
            <Clock size={24} color={theme.colors.primary} />
            <Text style={styles.previewTime}>
              {formatTime(selectedHour, selectedMinute)}
            </Text>
          </View>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>{t('settings.timePicker.hour')}</Text>
              <ScrollView
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
                decelerationRate="fast"
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.pickerItem,
                      selectedHour === hour && styles.pickerItemSelected,
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedHour === hour && styles.pickerItemTextSelected,
                      ]}
                    >
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.separator}>:</Text>

            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>{t('settings.timePicker.minute')}</Text>
              <ScrollView
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
                decelerationRate="fast"
              >
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.pickerItem,
                      selectedMinute === minute && styles.pickerItemSelected,
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedMinute === minute && styles.pickerItemTextSelected,
                      ]}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{t('settings.timePicker.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>{t('settings.timePicker.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const { theme, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hapticController = useHaptic();
  const { t, language: currentLanguage, setLanguage } = useTranslation();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState('08:00');

  const user = useUser();

  const themePreference = usePreferencesStore((state) => state.userPrefs.theme);
  const hapticsEnabled = usePreferencesStore((state) => state.userPrefs.haptics);
  const units = usePreferencesStore((state) => state.userPrefs.units);
  const privacy = usePreferencesStore((state) => state.userPrefs.privacy);

  const setUserPrefs = usePreferencesStore((state) => state.setUserPrefs);
  const updateThemePreference = usePreferencesStore((state) => state.updateTheme);
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
      updateThemePreference(next);
      void setThemeMode(next);
    },
    [hapticController, hapticsEnabled, setThemeMode, themePreference, updateThemePreference]
  );

  const handleLanguageChange = useCallback(
    (next: LanguageOption) => {
      if (next === currentLanguage) return;
      if (hapticsEnabled) {
        void hapticController.selection();
      }
      setLanguage(next);
    },
    [currentLanguage, hapticController, hapticsEnabled, setLanguage]
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
      if (next === 'custom') {
        setShowTimePicker(true);
        return;
      }
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
    [globalNotificationPreferences.timing, hapticController, hapticsEnabled, updateGlobalNotifications, setShowTimePicker]
  );

  const handleCustomTimeSelect = useCallback(
    (time: string) => {
      setCustomTime(time);
      if (hapticsEnabled) {
        void hapticController.selection();
      }
      void updateGlobalNotifications({
        timing: {
          ...globalNotificationPreferences.timing,
          preferredTime: time,
        },
      });
    },
    [globalNotificationPreferences.timing, hapticController, hapticsEnabled, updateGlobalNotifications, setCustomTime]
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
    ? new Date(user.joinDate).toLocaleDateString(currentLanguage === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : t('settings.hero.joinedUnknown');

  const heroSubtitleEmail = user?.email ?? t('settings.hero.noEmail');

  const userInitials = useMemo(() => {
    if (!user?.name) return 'SP';
    const segments = user.name.trim().split(/\s+/);
    return segments
      .map((segment) => segment.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SP';
  }, [user?.name]);

  const themeOptions = useMemo<SettingOption<ThemeOption>[]>(
    () => [
      { value: 'light', label: t('settings.options.theme.light') },
      { value: 'dark', label: t('settings.options.theme.dark') },
      { value: 'system', label: t('settings.options.theme.system') },
    ],
    [t]
  );

  const languageOptions = useMemo<SettingOption<LanguageOption>[]>(
    () => [
      { value: 'th', label: t('settings.options.language.th') },
      { value: 'en', label: t('settings.options.language.en') },
    ],
    [t]
  );

  const volumeOptions = useMemo<SettingOption<VolumeUnit>[]>(
    () => [
      { value: 'ml', label: t('settings.options.volume.ml') },
      { value: 'ล.', label: t('settings.options.volume.litre') },
    ],
    [t]
  );

  const weightOptions = useMemo<SettingOption<WeightUnit>[]>(
    () => [
      { value: 'g', label: t('settings.options.weight.g') },
      { value: 'kg', label: t('settings.options.weight.kg') },
    ],
    [t]
  );

  const temperatureOptions = useMemo<SettingOption<TemperatureUnit>[]>(
    () => [
      { value: 'celsius', label: t('settings.options.temperature.celsius') },
      { value: 'fahrenheit', label: t('settings.options.temperature.fahrenheit') },
    ],
    [t]
  );

  const timeOptions = useMemo<SettingOption<string>[]>(
    () => [
      { value: '08:00', label: t('settings.options.notificationTime.morning') },
      { value: '12:00', label: t('settings.options.notificationTime.midday') },
      { value: '18:00', label: t('settings.options.notificationTime.evening') },
      { value: 'custom', label: t('settings.options.notificationTime.custom') },
    ],
    [t]
  );

  const sections: SectionConfig[] = [
    {
      key: 'general',
      title: t('settings.sections.general.title'),
      description: t('settings.sections.general.description'),
      items: [
        {
          key: 'theme',
          icon: Palette,
          title: t('settings.sections.general.items.theme.title'),
          subtitle: t('settings.sections.general.items.theme.subtitle'),
          accessory: (
            <OptionGroup<ThemeOption>
              value={themePreference}
              options={themeOptions}
              onChange={handleThemeChange}
            />
          ),
        },
        {
          key: 'language',
          icon: Languages,
          title: t('settings.sections.general.items.language.title'),
          subtitle: t('settings.sections.general.items.language.subtitle'),
          accessory: (
            <OptionGroup<LanguageOption>
              value={currentLanguage}
              options={languageOptions}
              onChange={handleLanguageChange}
            />
          ),
        },
        {
          key: 'haptics',
          icon: Vibrate,
          title: t('settings.sections.general.items.haptics.title'),
          subtitle: t('settings.sections.general.items.haptics.subtitle'),
          accessory: (
            <Switch
              value={hapticsEnabled}
              onValueChange={handleToggleHaptics}
              trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
              thumbColor={theme.colors.white}
            />
          ),
        },
      ],
    },
    {
      key: 'measurement',
      title: t('settings.sections.measurement.title'),
      description: t('settings.sections.measurement.description'),
      items: [
        {
          key: 'water',
          icon: Droplet,
          title: t('settings.sections.measurement.items.water.title'),
          subtitle: t('settings.sections.measurement.items.water.subtitle'),
         accessory: (
           <OptionGroup<VolumeUnit>
             value={units.volume}
             options={volumeOptions}
              onChange={(next) => handleUnitChange('volume', next as VolumeUnit)}
            />
          ),
        },
        {
          key: 'fertilizer',
          icon: Scale,
          title: t('settings.sections.measurement.items.fertilizer.title'),
          subtitle: t('settings.sections.measurement.items.fertilizer.subtitle'),
          accessory: (
            <OptionGroup<WeightUnit>
              value={units.weight}
              options={weightOptions}
              onChange={(next) => handleUnitChange('weight', next as WeightUnit)}
            />
          ),
        },
        {
          key: 'temperature',
          icon: ThermometerSun,
          title: t('settings.sections.measurement.items.temperature.title'),
          subtitle: t('settings.sections.measurement.items.temperature.subtitle'),
          accessory: (
            <OptionGroup<TemperatureUnit>
              value={units.temperature}
              options={temperatureOptions}
              onChange={(next) => handleUnitChange('temperature', next as TemperatureUnit)}
            />
          ),
        },
      ],
    },
    {
      key: 'notifications',
      title: t('settings.sections.notifications.title'),
      description: t('settings.sections.notifications.description'),
      items: [
        {
          key: 'master',
          icon: Bell,
          title: t('settings.sections.notifications.items.master.title'),
          subtitle: t('settings.sections.notifications.items.master.subtitle'),
          accessory: (
            <Switch
              value={globalNotificationPreferences.enabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
              thumbColor={theme.colors.white}
            />
          ),
        },
        {
          key: 'quietHours',
          icon: MoonStar,
          title: t('settings.sections.notifications.items.quietHours.title'),
          subtitle: `${t('settings.sections.notifications.items.quietHours.subtitlePrefix')}${quietHoursLabel}`,
          accessory: (
            <Switch
              value={globalNotificationPreferences.timing.quietHours.enabled}
              onValueChange={handleQuietHoursToggle}
              trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
              thumbColor={theme.colors.white}
              disabled={!globalNotificationPreferences.enabled}
            />
          ),
          disabled: !globalNotificationPreferences.enabled,
        },
        {
          key: 'preferredTime',
          icon: Clock,
          title: t('settings.sections.notifications.items.preferredTime.title'),
          subtitle: t('settings.sections.notifications.items.preferredTime.subtitle'),
          disabled: !globalNotificationPreferences.enabled,
        },
        {
          key: 'sound',
          icon: SlidersHorizontal,
          title: t('settings.sections.notifications.items.sound.title'),
          subtitle: t('settings.sections.notifications.items.sound.subtitle'),
          accessory: (
            <Switch
              value={globalNotificationPreferences.delivery.sound}
              onValueChange={(value) => handleDeliveryToggle('sound', value)}
              trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
              thumbColor={theme.colors.white}
              disabled={!globalNotificationPreferences.enabled}
            />
          ),
          disabled: !globalNotificationPreferences.enabled,
        },
        {
          key: 'vibration',
          icon: Vibrate,
          title: t('settings.sections.notifications.items.vibration.title'),
          subtitle: t('settings.sections.notifications.items.vibration.subtitle'),
          accessory: (
            <Switch
              value={globalNotificationPreferences.delivery.vibration}
              onValueChange={(value) => handleDeliveryToggle('vibration', value)}
              trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
              thumbColor={theme.colors.white}
              disabled={!globalNotificationPreferences.enabled}
            />
          ),
          disabled: !globalNotificationPreferences.enabled,
        },
      ],
    },
    {
      key: 'notificationTiming',
      title: t('settings.sections.notifications.items.preferredTime.title'),
      description: t('settings.sections.notifications.items.preferredTime.subtitle'),
      items: [
        {
          key: 'timeSelection',
          icon: Clock,
          title: t('settings.timePicker.selectedTime'),
          subtitle: !timeOptions.some(opt => opt.value === (globalNotificationPreferences.timing?.preferredTime || '08:00'))
            ? `${globalNotificationPreferences.timing?.preferredTime || '08:00'}`
            : undefined,
          accessory: (
            <View style={{ alignItems: 'flex-end', width: '100%' }}>
              <OptionGroup<string>
                value={
                  timeOptions.some(opt => opt.value === (globalNotificationPreferences.timing?.preferredTime || '08:00'))
                    ? globalNotificationPreferences.timing?.preferredTime || '08:00'
                    : 'custom'
                }
                options={timeOptions}
                onChange={handlePreferredTimeChange}
                disabled={!globalNotificationPreferences.enabled}
              />
            </View>
          ),
          disabled: !globalNotificationPreferences.enabled,
        },
      ],
    },
    {
      key: 'privacy',
      title: t('settings.sections.privacy.title'),
      description: t('settings.sections.privacy.description'),
      items: [
        {
          key: 'personalised',
          icon: Globe2,
          title: t('settings.sections.privacy.items.personalised.title'),
          subtitle: t('settings.sections.privacy.items.personalised.subtitle'),
          accessory: (
            <Switch
              value={privacy.personalizedTips}
              onValueChange={(value) => handlePrivacyToggle('personalizedTips', value)}
              trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
              thumbColor={theme.colors.white}
            />
          ),
        },
        {
          key: 'analytics',
          icon: ShieldCheck,
          title: t('settings.sections.privacy.items.analytics.title'),
          subtitle: t('settings.sections.privacy.items.analytics.subtitle'),
          accessory: (
            <Switch
              value={privacy.analytics}
              onValueChange={(value) => handlePrivacyToggle('analytics', value)}
              trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
              thumbColor={theme.colors.white}
            />
          ),
        },
        {
          key: 'crash',
          icon: RefreshCw,
          title: t('settings.sections.privacy.items.crash.title'),
          subtitle: t('settings.sections.privacy.items.crash.subtitle'),
          accessory: (
            <Switch
              value={privacy.crashReporting}
              onValueChange={(value) => handlePrivacyToggle('crashReporting', value)}
              trackColor={{ true: theme.colors.primary, false: theme.colors.surface.disabled }}
              thumbColor={theme.colors.white}
            />
          ),
        },
      ],
    },
    {
      key: 'data',
      title: t('settings.sections.data.title'),
      description: t('settings.sections.data.description'),
      items: [
        {
          key: 'backup',
          icon: CloudDownload,
          title: t('settings.sections.data.items.backup.title'),
          subtitle: t('settings.sections.data.items.backup.subtitle'),
          onPress: () => router.push('/settings/data-backup'),
        },
        {
          key: 'reset',
          icon: RefreshCw,
          title: t('settings.sections.data.items.reset.title'),
          subtitle: t('settings.sections.data.items.reset.subtitle'),
          onPress: () => router.push('/settings/reset-preferences'),
        },
        {
          key: 'clearNotifications',
          icon: Bell,
          title: t('settings.sections.data.items.clearNotifications.title'),
          subtitle: t('settings.sections.data.items.clearNotifications.subtitle'),
          onPress: () => router.push('/settings/clear-notifications'),
        },
      ],
    },
  ];

  const gradientColors = theme.isDark
    ? ['#14532d', '#0f172a']
    : ['#16a34a', '#0ea5e9'];

  const heroActions = useMemo(
    () => [
      {
        key: 'preferences',
        icon: <Palette size={16} color="#ffffff" />,
        label: t('settings.hero.actions.preferences'),
      },
      {
        key: 'notifications',
        icon: <Bell size={16} color="#ffffff" />,
        label: t('settings.hero.actions.notifications'),
        onPress: () => router.push('/settings/clear-notifications'),
      },
      {
        key: 'data',
        icon: <Database size={16} color="#ffffff" />,
        label: t('settings.hero.actions.data'),
        onPress: () => router.push('/settings/data-backup'),
      },
    ],
    [router, t]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentColumn}>
          <LinearGradient colors={gradientColors} style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>{t('settings.hero.eyebrow')}</Text>
            <Text style={styles.heroTitle}>{t('settings.hero.title')}</Text>
            <Text style={styles.heroSubtitle}>{t('settings.hero.subtitle')}</Text>
            <View style={styles.heroProfileRow}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarText}>{userInitials}</Text>
              </View>
              <View style={styles.heroProfileText}>
                <Text style={styles.heroName}>{user?.name ?? t('settings.hero.fallbackName')}</Text>
                <Text style={styles.heroEmail}>{heroSubtitleEmail}</Text>
                <View style={styles.heroMetaRow}>
                  <ShieldCheck size={14} color="#ffffff" />
                  <Text style={styles.heroMetaText}>
                    {t('settings.hero.status')} · {t('settings.hero.joinedPrefix')}{joinDate}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.heroActionsRow}>
              {heroActions.map((action) => (
                <HeroAction key={action.key} icon={action.icon} label={action.label} onPress={action.onPress} />
              ))}
            </View>
          </LinearGradient>

          {sections.map((section) => (
            <SettingsSection key={section.key} section={section} />
          ))}
        </View>
      </ScrollView>

      <TimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onTimeSelect={handleCustomTimeSelect}
        initialTime={customTime}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing(4),
      paddingVertical: theme.spacing(4),
      paddingBottom: theme.spacing(6),
    },
    contentColumn: {
      width: '100%',
      maxWidth: 720,
      alignSelf: 'center',
      gap: theme.spacing(3),
    },
    heroCard: {
      borderRadius: radius['2xl'],
      padding: theme.spacing(4),
      gap: theme.spacing(3),
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 18 },
      shadowRadius: 28,
      elevation: 9,
    },
    heroEyebrow: {
      color: '#ecfdf5',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: typography.fontSize.xs,
    },
    heroTitle: {
      color: '#ffffff',
      fontSize: typography.fontSize['2xl'],
      fontFamily: typography.fontFamily.semibold,
      lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
    },
    heroSubtitle: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: typography.fontSize.sm,
      lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    },
    heroProfileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(2),
    },
    heroAvatar: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroAvatarText: {
      color: '#ffffff',
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.semibold,
      textTransform: 'uppercase',
    },
    heroProfileText: {
      flex: 1,
      gap: 4,
    },
    heroName: {
      color: '#ffffff',
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.semibold,
    },
    heroEmail: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: typography.fontSize.sm,
    },
    heroMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    heroMetaText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: typography.fontSize.xs,
    },
    heroActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      flexWrap: 'wrap',
    },
  });

const createOptionStyles = (theme: Theme) =>
  StyleSheet.create({
    groupContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing(0.75),
      alignItems: 'center',
      width: '100%',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
      width: '100%',
    },
    optionButton: {
      flex: 1,
      minWidth: 64,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.divider,
      backgroundColor: theme.colors.background.secondary,
      paddingHorizontal: theme.spacing(1.5),
      paddingVertical: theme.spacing(1.5),
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridOptionButton: {
      flex: 0,
      width: '48%',
      minHeight: 44,
    },
    optionButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      elevation: 1,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    optionButtonDisabled: {
      opacity: 0.4,
    },
    optionLabel: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontFamily: typography.fontFamily.semibold,
      textAlign: 'center',
    },
    optionLabelActive: {
      color: '#ffffff',
      fontFamily: typography.fontFamily.bold,
    },
  });

const createRowStyles = (theme: Theme, isLast: boolean) =>
  StyleSheet.create({
    rowContainer: {
      paddingHorizontal: theme.spacing(2.5),
      backgroundColor: 'transparent',
    },
    rowDisabled: {
      opacity: 0.5,
    },
    rowContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing(2.5),
      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.divider,
      minHeight: 60,
    },
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: radius.lg,
      backgroundColor: theme.isDark ? theme.colors.background.secondary : theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing(2.5),
    },
    textWrapper: {
      flex: 1,
      gap: 2,
      paddingRight: theme.spacing(1),
    },
    rowTitle: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
      lineHeight: 20,
    },
    rowSubtitle: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.tertiary,
      lineHeight: 16,
    },
    accessoryWrapper: {
      marginLeft: theme.spacing(1),
      flexShrink: 0,
      alignItems: 'flex-end',
      maxWidth: '100%',
      minWidth: 200,
    },
    chevronWrapper: {
      marginLeft: theme.spacing(1),
      opacity: 0.6,
    },
  });

const createHeroActionStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: theme.spacing(2),
      paddingVertical: theme.spacing(1.25),
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    label: {
      color: '#ffffff',
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
    },
  });

const createSectionStyles = (theme: Theme) =>
  StyleSheet.create({
    sectionContainer: {
      gap: theme.spacing(1),
      marginTop: theme.spacing(1),
    },
    sectionTitle: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
      letterSpacing: 0.4,
    },
    sectionDescription: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    sectionCard: {
      marginTop: theme.spacing(1.5),
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.divider,
      backgroundColor: theme.colors.surface.primary,
      overflow: 'hidden',
    },
  });

const createTimePickerStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.surface.primary,
      borderTopLeftRadius: radius['2xl'],
      borderTopRightRadius: radius['2xl'],
      paddingBottom: 34,
      elevation: 20,
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing(4),
      paddingVertical: theme.spacing(3),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.divider,
    },
    title: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.text.primary,
    },
    closeButton: {
      padding: theme.spacing(1),
    },
    preview: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing(4),
      gap: theme.spacing(2),
    },
    previewTime: {
      fontSize: typography.fontSize['3xl'],
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.primary,
    },
    pickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing(4),
      paddingVertical: theme.spacing(2),
    },
    pickerColumn: {
      alignItems: 'center',
      flex: 1,
    },
    pickerLabel: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing(2),
    },
    picker: {
      height: 160,
      width: '100%',
    },
    pickerItem: {
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing(3),
      marginVertical: 2,
      borderRadius: radius.md,
    },
    pickerItemSelected: {
      backgroundColor: theme.colors.primarySoft,
    },
    pickerItemText: {
      fontSize: typography.fontSize.lg,
      color: theme.colors.text.secondary,
      fontFamily: typography.fontFamily.medium,
    },
    pickerItemTextSelected: {
      color: theme.colors.primary,
      fontFamily: typography.fontFamily.bold,
    },
    separator: {
      fontSize: typography.fontSize['2xl'],
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginHorizontal: theme.spacing(2),
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing(4),
      paddingTop: theme.spacing(3),
      gap: theme.spacing(3),
    },
    cancelButton: {
      flex: 1,
      paddingVertical: theme.spacing(3),
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.secondary,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: theme.spacing(3),
      borderRadius: radius.lg,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    confirmButtonText: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.white,
    },
  });

export default SettingsScreen;
