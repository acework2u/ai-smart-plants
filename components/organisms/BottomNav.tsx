import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Home,
  Leaf,
  BarChart3,
  Settings,
  LucideIcon,
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../core/theme';
import { useHaptic } from '../../core/haptics';

export type TabName = 'home' | 'garden' | 'insights' | 'settings';

interface TabConfig {
  id: TabName;
  label: string;
  icon: LucideIcon;
  route: string;
}

interface BottomNavProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  badge?: Partial<Record<TabName, number>>;
}

const TABS: TabConfig[] = [
  {
    id: 'home',
    label: 'หน้าหลัก',
    icon: Home,
    route: '/',
  },
  {
    id: 'garden',
    label: 'สวนของฉัน',
    icon: Leaf,
    route: '/(tabs)/garden',
  },
  {
    id: 'insights',
    label: 'ข้อมูลเชิงลึก',
    icon: BarChart3,
    route: '/(tabs)/insights',
  },
  {
    id: 'settings',
    label: 'ตั้งค่า',
    icon: Settings,
    route: '/(tabs)/settings',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = SCREEN_WIDTH / TABS.length;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface TabItemProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
  badge?: number;
}

const TabItem: React.FC<TabItemProps> = ({ tab, isActive, onPress, badge }) => {
  const haptic = useHaptic();
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);

  const handlePress = () => {
    haptic.tabSwitch();

    // Button press animation
    scale.value = withSpring(0.95, { duration: 150 }, () => {
      scale.value = withSpring(1, { duration: 150 });
    });

    // Icon scale animation for active state
    if (!isActive) {
      iconScale.value = withSpring(1.2, { duration: 200 }, () => {
        iconScale.value = withSpring(1, { duration: 200 });
      });
    }

    onPress();
  };

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: isActive ? 1.1 : iconScale.value }],
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isActive ? 1 : 0.6, { duration: 200 }),
      transform: [
        {
          scale: withTiming(isActive ? 1 : 0.9, { duration: 200 }),
        },
      ],
    };
  });

  const Icon = tab.icon;

  return (
    <AnimatedTouchableOpacity
      style={[styles.tabItem, animatedButtonStyle]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Background indicator for active tab */}
      {isActive && (
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              opacity: withTiming(1, { duration: 200 }),
              transform: [
                {
                  scale: withTiming(1, { duration: 200 }),
                },
              ],
            },
          ]}
        />
      )}

      {/* Icon container with badge */}
      <View style={styles.iconContainer}>
        <Animated.View style={animatedIconStyle}>
          <Icon
            size={24}
            color={isActive ? colors.primary : colors.gray[500]}
            strokeWidth={isActive ? 2.5 : 2}
          />
        </Animated.View>

        {/* Badge */}
        {badge && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge.toString()}
            </Text>
          </View>
        )}
      </View>

      {/* Label */}
      <Animated.Text
        style={[
          styles.tabLabel,
          {
            color: isActive ? colors.primary : colors.gray[500],
          },
          animatedLabelStyle,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Animated.Text>
    </AnimatedTouchableOpacity>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, badge }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, spacing[4]),
        },
      ]}
    >
      {TABS.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onPress={() => onTabChange(tab.id)}
          badge={badge?.[tab.id]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    paddingTop: spacing[2],
    paddingHorizontal: spacing[2],
    ...shadows.lg,
    // iOS specific shadow
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: spacing[1],
    left: '20%',
    right: '20%',
    height: 32,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium as any,
    textAlign: 'center',
    lineHeight: typography.fontSize.xs * 1.2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold as any,
    lineHeight: 12,
  },
});

export default BottomNav;