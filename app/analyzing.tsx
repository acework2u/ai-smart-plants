import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Sparkles, Leaf, Eye, Zap } from 'lucide-react-native';
import { colors, typography, radius, getSpacing } from '../core/theme';
import { mockScanService } from '../services/MockScanService';

interface AnalysisStep {
  step: string;
  progress: number;
  message: string;
  icon: React.ReactNode;
}

export default function AnalyzingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [progress] = useState(new Animated.Value(0));

  const analysisSteps: AnalysisStep[] = [
    {
      step: 'image_processing',
      progress: 25,
      message: 'กำลังประมวลผลภาพ...',
      icon: <Eye size={32} color={colors.primary} />,
    },
    {
      step: 'plant_identification',
      progress: 50,
      message: 'กำลังระบุชนิดพืช...',
      icon: <Leaf size={32} color={colors.primary} />,
    },
    {
      step: 'health_analysis',
      progress: 75,
      message: 'กำลังวิเคราะห์สุขภาพ...',
      icon: <Sparkles size={32} color={colors.primary} />,
    },
    {
      step: 'recommendations',
      progress: 100,
      message: 'กำลังสร้างคำแนะนำ...',
      icon: <Zap size={32} color={colors.primary} />,
    },
  ];

  useEffect(() => {
    if (!imageUri) {
      router.back();
      return;
    }

    let stepIndex = 0;

    const stepInterval = setInterval(() => {
      if (stepIndex < analysisSteps.length) {
        setCurrentStep(stepIndex);

        // Animate progress
        Animated.timing(progress, {
          toValue: analysisSteps[stepIndex].progress,
          duration: 800,
          useNativeDriver: false,
        }).start();

        stepIndex++;
      } else {
        clearInterval(stepInterval);

        // Start actual AI analysis
        mockScanService.analyzePlant({ imageUri })
          .then((result) => {
            // Navigate to result with analysis data
            router.push({
              pathname: '/result',
              params: {
                analysisResult: JSON.stringify(result),
              },
            });
          })
          .catch((error) => {
            console.error('Analysis failed:', error);
            router.back();
          });
      }
    }, 1200);

    return () => clearInterval(stepInterval);
  }, [imageUri, router]);

  const currentAnalysisStep = analysisSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>วิเคราะห์ต้นไม้</Text>
          <Text style={styles.subtitle}>AI กำลังประมวลผลข้อมูล</Text>
        </View>

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <View style={styles.imageOverlay}>
              <View style={styles.scanningLine} />
            </View>
          </View>
        )}

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(analysisSteps[currentStep]?.progress || 0)}%
          </Text>
        </View>

        {/* Current Step */}
        <View style={styles.stepContainer}>
          <View style={styles.stepIcon}>
            {currentAnalysisStep?.icon}
          </View>
          <Text style={styles.stepMessage}>
            {currentAnalysisStep?.message || 'กำลังเตรียมการ...'}
          </Text>
          <Text style={styles.stepDescription}>
            โปรดรอสักครู่ ระบบกำลังวิเคราะห์ภาพของคุณ
          </Text>
        </View>

        {/* Steps List */}
        <View style={styles.stepsContainer}>
          {analysisSteps.map((step, index) => (
            <View key={step.step} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  index <= currentStep && styles.stepDotActive,
                  index < currentStep && styles.stepDotCompleted,
                ]}
              />
              <Text
                style={[
                  styles.stepText,
                  index <= currentStep && styles.stepTextActive,
                ]}
              >
                {step.message}
              </Text>
            </View>
          ))}
        </View>

        {/* AI Branding */}
        <View style={styles.brandingContainer}>
          <Sparkles size={20} color={colors.primary} />
          <Text style={styles.brandingText}>Powered by Smart Plant AI</Text>
        </View>
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
    padding: getSpacing(4),
    justifyContent: 'center',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: getSpacing(8),
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: getSpacing(2),
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Image
  imageContainer: {
    alignItems: 'center',
    marginBottom: getSpacing(8),
    position: 'relative',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  scanningLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    // Animation will be added with React Native Reanimated if needed
  },

  // Progress
  progressContainer: {
    alignItems: 'center',
    marginBottom: getSpacing(6),
  },
  progressBar: {
    width: '80%',
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: getSpacing(2),
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
  },

  // Current Step
  stepContainer: {
    alignItems: 'center',
    marginBottom: getSpacing(8),
  },
  stepIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(3),
  },
  stepMessage: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: getSpacing(2),
  },
  stepDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },

  // Steps List
  stepsContainer: {
    marginBottom: getSpacing(8),
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing(3),
    paddingHorizontal: getSpacing(4),
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.gray[300],
    marginRight: getSpacing(3),
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: colors.success,
  },
  stepText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    flex: 1,
  },
  stepTextActive: {
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },

  // Branding
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  brandingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: getSpacing(2),
    fontFamily: typography.fontFamily.medium,
  },
});