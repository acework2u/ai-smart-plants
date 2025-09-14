import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../core/theme';
import { useHaptic } from '../core/haptics';
import { AppHeader } from '../components/organisms';
import { NotificationCenter } from '../components/organisms';
import { useNotificationStore } from '../stores/notificationStore';
import { NotiItem } from '../types/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const {
    notifications,
    getFilteredNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    getUnreadCount,
  } = useNotificationStore();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    haptic.pullToRefresh();

    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    haptic.trigger('success');
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    haptic.trigger('success');
  };

  const handleDismiss = (id: string) => {
    removeNotification(id);
    haptic.trigger('warning');
  };

  const handleNotificationPress = (notification: NotiItem) => {
    // Mark as read when tapped
    if (!notification.read) {
      markAsRead(notification.id);
    }

    haptic.trigger('light');

    // Handle different notification types
    switch (notification.type) {
      case 'reminder':
        if (notification.plantId) {
          router.push(`/plant/${notification.plantId}`);
        }
        break;

      case 'ai':
        if (notification.plantId) {
          router.push(`/plant/${notification.plantId}`);
        } else {
          // Navigate to tips or general AI advice
          router.push('/(tabs)/insights');
        }
        break;

      case 'alert':
        if (notification.plantId) {
          router.push(`/activity/${notification.plantId}`);
        }
        break;

      case 'achievement':
        // Show achievement detail or navigate to achievements
        Alert.alert(
          'ความสำเร็จ',
          notification.detail || notification.title,
          [
            {
              text: 'เยี่ยมมาก!',
              style: 'default',
              onPress: () => haptic.achievement(),
            },
          ]
        );
        break;

      case 'system':
        // Handle system notifications
        if (notification.actionUrl) {
          // Handle deep links or specific actions
          console.log('Navigate to:', notification.actionUrl);
        }
        break;

      default:
        console.log('Unknown notification type:', notification.type);
        break;
    }
  };

  const handleBack = () => {
    haptic.trigger('light');
    router.back();
  };

  const unreadCount = getUnreadCount();

  return (
    <View style={styles.container}>
      <AppHeader
        title={`การแจ้งเตือน${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
        showBack
        onBack={handleBack}
        backgroundColor={colors.white}
      />

      <NotificationCenter
        notifications={notifications}
        onRefresh={handleRefresh}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDismiss={handleDismiss}
        onNotificationPress={handleNotificationPress}
        refreshing={refreshing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});