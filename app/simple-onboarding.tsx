import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  Camera,
  Calendar,
  Bell,
  Leaf,
  Scan,
  CheckCircle,
  Smartphone,
  Heart,
  ChevronRight,
  SkipForward
} from 'lucide-react-native';
import { STORAGE_KEYS } from '../types';
import OnboardingCarousel from '../components/organisms/OnboardingCarousel';
import { OnboardingSlideData } from '../components/atoms/OnboardingSlide';
import { lightColors, spacing, typography, radius } from '../core/theme';

const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: 'ai-analysis',
    icon: Scan,
    iconColor: lightColors.primary,
    backgroundColor: lightColors.primarySoft,
    title: 'AI Plant Analysis',
    subtitle: 'ถ่ายรูปและได้คำแนะนำจาก AI',
    description: 'เพียงถ่ายรูปใบไม้ ระบบ AI จะวิเคราะห์สุขภาพพืชและให้คำแนะนำการดูแลที่เหมาะสม',
  },
  {
    id: 'care-tracking',
    icon: Calendar,
    iconColor: lightColors.notification.reminder,
    backgroundColor: lightColors.info + '20',
    title: 'Plant Care Tracking',
    subtitle: 'ติดตามการดูแลพืชอย่างเป็นระบบ',
    description: 'บันทึกกิจกรรมการดูแลต้นไม้ เช่น รดน้ำ ใส่ปุ๋ย พร้อมติดตามความคืบหน้า',
  },
  {
    id: 'smart-notifications',
    icon: Bell,
    iconColor: lightColors.warning,
    backgroundColor: lightColors.warning + '20',
    title: 'Smart Notifications',
    subtitle: 'แจ้งเตือนอัตโนมัติเมื่อถึงเวลาดูแล',
    description: 'ไม่พลาดการดูแลต้นไม้อีกต่อไป ด้วยระบบแจ้งเตือนอัจฉริยะที่ปรับตามความต้องการของแต่ละพืช',
  },
  {
    id: 'digital-garden',
    icon: Leaf,
    iconColor: lightColors.healthy,
    backgroundColor: lightColors.healthy + '20',
    title: 'Digital Garden',
    subtitle: 'สร้างสวนดิจิทัลของคุณเอง',
    description: 'รวบรวมต้นไม้ทั้งหมดในที่เดียว ดูประวัติการเจริญเติบโต และแชร์ความสำเร็จกับเพื่อน ๆ',
  },
];

export default function SimpleOnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [canSkip, setCanSkip] = useState(true);

  const handleStart = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      router.replace('/(tabs)');
    }
  };

  const goToDebug = () => {
    router.push('/debug');
  };

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
    // Hide skip button on last slide to encourage completion
    setCanSkip(index < ONBOARDING_SLIDES.length - 1);
  };

  const isLastSlide = currentSlide === ONBOARDING_SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={lightColors.white} />

      {/* Skip Button */}
      {canSkip && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityLabel="Skip onboarding"
          accessibilityHint="Skip the introduction and go directly to the app"
        >
          <SkipForward size={20} color={lightColors.text.tertiary} />
          <Text style={styles.skipButtonText}>ข้าม</Text>
        </TouchableOpacity>
      )}

      {/* Main Carousel */}
      <OnboardingCarousel
        slides={ONBOARDING_SLIDES}
        onSlideChange={handleSlideChange}
        autoPlay={true}
        autoPlayDelay={4000}
        enableGesture={false}
      />

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {isLastSlide ? (
          <>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleStart}
              accessibilityLabel="Get started with AI Smart Plants"
              accessibilityHint="Complete onboarding and start using the app"
            >
              <Text style={styles.getStartedButtonText}>เริ่มต้นใช้งาน</Text>
              <ChevronRight size={20} color={lightColors.white} />
            </TouchableOpacity>

            {/* Debug button for development */}
            {__DEV__ && (
              <TouchableOpacity style={styles.debugButton} onPress={goToDebug}>
                <Text style={styles.debugButtonText}>Debug Menu</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.welcomeContainer}>
            <View style={styles.brandContainer}>
              <Leaf size={32} color={lightColors.primary} />
              <Text style={styles.brandText}>AI Smart Plants</Text>
            </View>
            <Text style={styles.welcomeText}>
              ยินดีต้อนรับสู่แอปดูแลต้นไม้ด้วย AI
            </Text>
            <Text style={styles.swipeHint}>
              ระบบกำลังแสดงสไลด์ให้คุณอัตโนมัติ
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.white,
  },
  skipButton: {
    position: 'absolute',
    top: spacing(12),
    right: spacing(6),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
    backgroundColor: lightColors.background.secondary,
    borderRadius: radius.full,
    zIndex: 1000,
    gap: spacing(1),
  },
  skipButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500' as const,
    color: lightColors.text.tertiary,
  },
  actionContainer: {
    position: 'absolute',
    bottom: spacing(24),
    left: spacing(6),
    right: spacing(6),
    alignItems: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing(4),
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(3),
    gap: spacing(2),
  },
  brandText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700' as const,
    color: lightColors.primary,
  },
  welcomeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600' as const,
    color: lightColors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing(2),
    lineHeight: typography.fontSize.lg * 1.4,
  },
  swipeHint: {
    fontSize: typography.fontSize.sm,
    color: lightColors.text.tertiary,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.4,
  },
  getStartedButton: {
    backgroundColor: lightColors.primary,
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(8),
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    shadowColor: lightColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 200,
  },
  getStartedButtonText: {
    color: lightColors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: '600' as const,
  },
  debugButton: {
    backgroundColor: lightColors.background.tertiary,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    borderRadius: radius.md,
    marginTop: spacing(3),
    alignItems: 'center',
  },
  debugButtonText: {
    color: lightColors.text.tertiary,
    fontSize: typography.fontSize.sm,
    fontWeight: '500' as const,
  },
});
