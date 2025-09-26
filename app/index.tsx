import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../types';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN);
        const hasSeen = seen === 'true';

        if (hasSeen) {
          // User has completed onboarding, go to tabs
          router.replace('/(tabs)');
        } else {
          // User hasn't seen onboarding, show it
          router.replace('/simple-onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Fallback to onboarding
        router.replace('/simple-onboarding');
      }
    };

    checkOnboarding();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#16a34a" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: '#6b7280',
  },
});