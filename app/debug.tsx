import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../components/atoms';
import { STORAGE_KEYS } from '../types';

export default function DebugScreen() {
  const router = useRouter();

  const clearOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_SEEN);
      Alert.alert(
        'ล้างข้อมูลสำเร็จ',
        'Onboarding จะแสดงขึ้นอีกครั้งเมื่อรีสตาร์ทแอป',
        [
          {
            text: 'ไปที่ Onboarding',
            onPress: () => router.replace('/onboarding')
          },
          {
            text: 'ตกลง',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถล้างข้อมูล onboarding ได้');
    }
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ONBOARDING_SEEN,
        STORAGE_KEYS.PLANTS,
        STORAGE_KEYS.ACTIVITIES,
        STORAGE_KEYS.NOTIFICATIONS,
        STORAGE_KEYS.USER_PREFERENCES,
      ]);
      Alert.alert('ล้างข้อมูลทั้งหมดสำเร็จ', 'แอปจะรีสตาร์ทเป็นผู้ใช้ใหม่');
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถล้างข้อมูลได้');
    }
  };

  const goToOnboarding = () => {
    router.replace('/onboarding');
  };

  const goToHome = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Debug Menu</Text>
        <Text style={styles.subtitle}>เครื่องมือสำหรับทดสอบแอป</Text>

        <View style={styles.buttonContainer}>
          <Button
            title="ล้างข้อมูล Onboarding"
            onPress={clearOnboarding}
            variant="secondary"
            style={styles.button}
          />

          <Button
            title="ไปที่ Onboarding"
            onPress={goToOnboarding}
            variant="primary"
            style={styles.button}
          />

          <Button
            title="ไปที่หน้าหลัก"
            onPress={goToHome}
            variant="primary"
            style={styles.button}
          />

          <Button
            title="ล้างข้อมูลทั้งหมด"
            onPress={clearAllData}
            variant="destructive"
            style={styles.button}
          />
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
  },
});