import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../types';

export default function SimpleOnboardingScreen() {
  const router = useRouter();

  const handleStart = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
      router.replace('/');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      router.replace('/');
    }
  };

  const goToDebug = () => {
    router.push('/debug');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🌱 AI Smart Plants</Text>
        <Text style={styles.description}>
          ยินดีต้อนรับสู่แอปดูแลต้นไม้ด้วย AI
        </Text>
        <Text style={styles.subtitle}>
          สแกนต้นไม้ วิเคราะห์สุขภาพ และรับคำแนะนำจาก AI
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>เริ่มใช้งาน</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.debugButton} onPress={goToDebug}>
            <Text style={styles.debugButtonText}>Debug Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  startButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});