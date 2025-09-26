import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../types';

export default function TestTabsScreen() {
  const router = useRouter();

  const handleClearOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_SEEN);
      console.log('Onboarding state cleared');
    } catch (error) {
      console.error('Failed to clear onboarding state:', error);
    }
  };

  const handleSetOnboarding = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
      console.log('Onboarding state set to true');
    } catch (error) {
      console.error('Failed to set onboarding state:', error);
    }
  };

  const goToTabs = () => {
    router.push('/(tabs)');
  };

  const goToOnboarding = () => {
    router.push('/simple-onboarding');
  };

  const goToIndex = () => {
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Navigation Test</Text>

        <TouchableOpacity style={styles.button} onPress={goToTabs}>
          <Text style={styles.buttonText}>Go to Tabs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={goToOnboarding}>
          <Text style={styles.buttonText}>Go to Onboarding</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={goToIndex}>
          <Text style={styles.buttonText}>Go to Index</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleClearOnboarding}>
          <Text style={styles.buttonText}>Clear Onboarding State</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSetOnboarding}>
          <Text style={styles.buttonText}>Set Onboarding Complete</Text>
        </TouchableOpacity>
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
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});