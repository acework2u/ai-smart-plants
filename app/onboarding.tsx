import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../components/atoms';
import { colors, typography, getSpacing } from '../core/theme';
import { STORAGE_KEYS } from '../types';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleStart = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
    } catch {}
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to AI Smart Plants!</Text>
        <Text style={styles.description}>
          Scan your plants, get AI insights, and keep them healthy
        </Text>

        <Button title="Start" onPress={handleStart} style={styles.startButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getSpacing(4),
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: getSpacing(2),
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
  startButton: {
    marginTop: getSpacing(4),
    minWidth: 160,
  },
});
