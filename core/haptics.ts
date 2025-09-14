import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptic feedback types for the app
export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

// Haptic feedback configuration
interface HapticConfig {
  enabled: boolean;
  intensity: 'low' | 'medium' | 'high';
}

class HapticService {
  private static instance: HapticService;
  private config: HapticConfig = {
    enabled: true,
    intensity: 'medium',
  };

  static getInstance(): HapticService {
    if (!HapticService.instance) {
      HapticService.instance = new HapticService();
    }
    return HapticService.instance;
  }

  // Configure haptic settings
  configure(config: Partial<HapticConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get current configuration
  getConfig(): HapticConfig {
    return { ...this.config };
  }

  // Check if haptics are supported
  isSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  // Main haptic feedback function
  async trigger(type: HapticType = 'light'): Promise<void> {
    if (!this.config.enabled || !this.isSupported()) {
      return;
    }

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;

        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;

        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;

        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;

        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;

        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;

        case 'selection':
          await Haptics.selectionAsync();
          break;

        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
      }
    } catch (error) {
      // Haptic feedback failed - this is non-critical
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Context-specific haptic methods
  async buttonPress(buttonType: 'primary' | 'secondary' | 'ghost' = 'primary'): Promise<void> {
    const hapticMap = {
      primary: 'medium' as HapticType,
      secondary: 'light' as HapticType,
      ghost: 'light' as HapticType,
    };

    await this.trigger(hapticMap[buttonType]);
  }

  async tabSwitch(): Promise<void> {
    await this.trigger('selection');
  }

  async plantAnalysisComplete(): Promise<void> {
    await this.trigger('success');
  }

  async activityLogged(): Promise<void> {
    await this.trigger('success');
  }

  async errorOccurred(): Promise<void> {
    await this.trigger('error');
  }

  async warningShown(): Promise<void> {
    await this.trigger('warning');
  }

  async itemSelected(): Promise<void> {
    await this.trigger('selection');
  }

  async swipeAction(): Promise<void> {
    await this.trigger('light');
  }

  async longPress(): Promise<void> {
    await this.trigger('medium');
  }

  async pullToRefresh(): Promise<void> {
    await this.trigger('light');
  }

  async modalPresented(): Promise<void> {
    await this.trigger('light');
  }

  async modalDismissed(): Promise<void> {
    await this.trigger('light');
  }

  // Plant-specific haptics
  async plantHealthGood(): Promise<void> {
    await this.trigger('success');
  }

  async plantHealthWarning(): Promise<void> {
    await this.trigger('warning');
  }

  async plantHealthCritical(): Promise<void> {
    await this.trigger('error');
  }

  async photoCapture(): Promise<void> {
    await this.trigger('medium');
  }

  async aiAnalysisStart(): Promise<void> {
    await this.trigger('light');
  }

  // Activity-specific haptics
  async wateringLogged(): Promise<void> {
    await this.trigger('success');
  }

  async fertilizingLogged(): Promise<void> {
    await this.trigger('success');
  }

  async diseaseDetected(): Promise<void> {
    await this.trigger('warning');
  }

  // Notification haptics
  async reminderNotification(): Promise<void> {
    await this.trigger('medium');
  }

  async urgentNotification(): Promise<void> {
    await this.trigger('heavy');
  }

  // Achievement haptics
  async achievementUnlocked(): Promise<void> {
    // Double success haptic for achievements
    await this.trigger('success');
    setTimeout(() => this.trigger('success'), 150);
  }

  // Pattern-based haptics for complex interactions
  async patternSuccess(): Promise<void> {
    await this.trigger('light');
    setTimeout(() => this.trigger('success'), 100);
  }

  async patternError(): Promise<void> {
    await this.trigger('error');
    setTimeout(() => this.trigger('light'), 100);
    setTimeout(() => this.trigger('error'), 200);
  }

  async patternLoading(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      await this.trigger('light');
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Bulk operation for rapid feedback
  async rapidFeedback(count: number = 3, interval: number = 100): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.trigger('light');
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  // Disable haptics (useful for accessibility)
  disable(): void {
    this.config.enabled = false;
  }

  // Enable haptics
  enable(): void {
    this.config.enabled = true;
  }

  // Toggle haptics
  toggle(): boolean {
    this.config.enabled = !this.config.enabled;
    return this.config.enabled;
  }

  // Test all haptic types (for settings/debugging)
  async testAllHaptics(): Promise<void> {
    const types: HapticType[] = ['light', 'medium', 'heavy', 'success', 'warning', 'error', 'selection'];

    for (const type of types) {
      console.log(`Testing haptic: ${type}`);
      await this.trigger(type);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Export singleton instance
export const hapticService = HapticService.getInstance();

// Convenience function for quick haptic feedback
export const haptic = (type: HapticType = 'light'): Promise<void> => {
  return hapticService.trigger(type);
};

// React hook for haptic feedback (to be used in components)
export const useHaptic = () => {
  return {
    trigger: hapticService.trigger.bind(hapticService),
    buttonPress: hapticService.buttonPress.bind(hapticService),
    tabSwitch: hapticService.tabSwitch.bind(hapticService),
    pullToRefresh: hapticService.pullToRefresh.bind(hapticService),
    success: () => hapticService.trigger('success'),
    error: () => hapticService.trigger('error'),
    warning: () => hapticService.trigger('warning'),
    selection: () => hapticService.trigger('selection'),
    light: () => hapticService.trigger('light'),
    medium: () => hapticService.trigger('medium'),
    heavy: () => hapticService.trigger('heavy'),

    // Plant-specific shortcuts
    plantHealth: {
      good: hapticService.plantHealthGood.bind(hapticService),
      warning: hapticService.plantHealthWarning.bind(hapticService),
      critical: hapticService.plantHealthCritical.bind(hapticService),
    },

    // Activity shortcuts
    activity: {
      logged: hapticService.activityLogged.bind(hapticService),
      watering: hapticService.wateringLogged.bind(hapticService),
      fertilizing: hapticService.fertilizingLogged.bind(hapticService),
    },

    // Camera shortcuts
    camera: {
      capture: hapticService.photoCapture.bind(hapticService),
      analysisStart: hapticService.aiAnalysisStart.bind(hapticService),
      analysisComplete: hapticService.plantAnalysisComplete.bind(hapticService),
    },

    // Achievement shortcut
    achievement: hapticService.achievementUnlocked.bind(hapticService),

    // Settings
    config: hapticService.getConfig.bind(hapticService),
    configure: hapticService.configure.bind(hapticService),
    enable: hapticService.enable.bind(hapticService),
    disable: hapticService.disable.bind(hapticService),
    toggle: hapticService.toggle.bind(hapticService),
    isSupported: hapticService.isSupported.bind(hapticService),
  };
};

// Pre-defined haptic patterns for common UI interactions
export const hapticPatterns = {
  // UI Interactions
  buttonPress: (type: 'primary' | 'secondary' | 'ghost' = 'primary') =>
    hapticService.buttonPress(type),

  tabSwitch: () => hapticService.tabSwitch(),

  modalOpen: () => hapticService.modalPresented(),

  modalClose: () => hapticService.modalDismissed(),

  swipe: () => hapticService.swipeAction(),

  longPress: () => hapticService.longPress(),

  pullRefresh: () => hapticService.pullToRefresh(),

  // Plant Care Interactions
  plantScanned: () => hapticService.photoCapture(),

  analysisComplete: (status: 'Healthy' | 'Warning' | 'Critical') => {
    switch (status) {
      case 'Healthy':
        return hapticService.plantHealthGood();
      case 'Warning':
        return hapticService.plantHealthWarning();
      case 'Critical':
        return hapticService.plantHealthCritical();
    }
  },

  activitySaved: () => hapticService.activityLogged(),

  reminderReceived: () => hapticService.reminderNotification(),

  // Achievement patterns
  milestone: () => hapticService.achievementUnlocked(),

  // Error patterns
  formError: () => hapticService.errorOccurred(),

  networkError: () => hapticService.patternError(),

  // Success patterns
  dataSync: () => hapticService.patternSuccess(),

  // Loading patterns
  processing: () => hapticService.patternLoading(),
};

export default hapticService;