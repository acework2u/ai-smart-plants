import { Tabs } from 'expo-router';
import { BarChart3, Home, Leaf, Settings } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { hapticService } from '../../core/haptics';
import { colors, getSpacing } from '../../core/theme';
import { useTranslation } from '../../contexts/I18nContext';

function TabLayoutInner() {
  const { t } = useTranslation();

  const handleTabPress = useCallback(() => {
    hapticService.tabSwitch();
  }, []);

  const screenOptions = useMemo(() => ({
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.text.tertiary,
    tabBarStyle: {
      backgroundColor: colors.white,
      borderTopColor: colors.border.light,
      borderTopWidth: 1,
      paddingTop: getSpacing(2),
      paddingBottom: Platform.OS === 'ios' ? getSpacing(6) : getSpacing(3),
      height: Platform.OS === 'ios' ? 90 : 70,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
      marginTop: getSpacing(1),
    },
    headerShown: false,
  }), []);

  const labels = useMemo(
    () => ({
      home: t('tabs.home'),
      garden: t('tabs.garden'),
      insights: t('tabs.insights'),
      settings: t('tabs.settings'),
    }),
    [t]
  );

  return (
    <Tabs screenOptions={screenOptions} screenListeners={{ tabPress: handleTabPress }}>
      <Tabs.Screen
        name="index"
        options={{
          title: labels.home,
          tabBarLabel: labels.home,
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: labels.garden,
          tabBarLabel: labels.garden,
          tabBarIcon: ({ color, size }) => (
            <Leaf size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: labels.insights,
          tabBarLabel: labels.insights,
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: labels.settings,
          tabBarLabel: labels.settings,
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default React.memo(TabLayoutInner);
