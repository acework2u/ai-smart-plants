import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Camera, Image, Leaf, Sparkles } from 'lucide-react-native';
import { Button, Card, Section, Chip } from '../components/atoms';
import { useGardenStore } from '../stores/garden';
import { colors, typography, radius, getSpacing } from '../core/theme';
import { initializeCore } from '../core';

export default function HomeScreen() {
  const { plants } = useGardenStore();

  // Initialize core services on app start
  React.useEffect(() => {
    initializeCore();
  }, []);

  const handleCameraPress = () => {
    router.push('/analyzing');
  };

  const handleGalleryPress = () => {
    // TODO: Implement image picker
    router.push('/analyzing');
  };

  const handlePlantPress = (plantId: string) => {
    router.push(`/plant/${plantId}`);
  };

  const recentPlants = plants.slice(0, 4); // Show last 4 plants

  const quickTips = [
    {
      id: '1',
      title: 'เช้านี้ควรรดน้ำ',
      description: 'อุณหภูมิ 32°C ความชื้น 65%',
      icon: '💧',
    },
    {
      id: '2',
      title: 'ตรวจดูใบพืช',
      description: 'ระวังโรคใบด่างในหน้าฝน',
      icon: '🍃',
    },
    {
      id: '3',
      title: 'เวลาใส่ปุ๋ย',
      description: 'NPK 15-15-15 ทุกสัปดาห์',
      icon: '🌱',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Smart Plant AI</Text>
          <Text style={styles.subtitle}>ดูแลต้นไม้ด้วย AI 🌱</Text>
        </View>

        {/* Scanner Card */}
        <Card style={styles.scannerCard} variant="elevated">
          <View style={styles.scannerContent}>
            <View style={styles.scannerIcon}>
              <Sparkles size={32} color={colors.primary} />
            </View>
            <Text style={styles.scannerTitle}>สแกนต้นไม้ของคุณ</Text>
            <Text style={styles.scannerSubtitle}>
              ถ่ายรูปหรืออัปโหลดภาพเพื่อวิเคราะห์สุขภาพพืช
            </Text>

            <View style={styles.scannerButtons}>
              <Button
                title="ถ่ายรูปพืช"
                onPress={handleCameraPress}
                variant="primary"
                style={styles.scannerButton}
              />
              <Button
                title="อัปโหลดรูป"
                onPress={handleGalleryPress}
                variant="secondary"
                style={styles.scannerButton}
              />
            </View>
          </View>
        </Card>

        {/* Quick Tips */}
        <Section
          title="เคล็ดลับวันนี้"
          subtitle="แนะนำจาก AI"
          rightElement={<Text style={styles.seeAllText}>ดูทั้งหมด</Text>}
          onRightPress={() => router.push('/insights')}
          style={styles.section}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tipsContainer}
          >
            {quickTips.map((tip) => (
              <Card key={tip.id} style={styles.tipCard} variant="flat">
                <Text style={styles.tipIcon}>{tip.icon}</Text>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </Card>
            ))}
          </ScrollView>
        </Section>

        {/* Recent Plants */}
        {recentPlants.length > 0 && (
          <Section
            title="ต้นไม้ล่าสุด"
            subtitle={`${plants.length} ต้น`}
            rightElement={<Text style={styles.seeAllText}>ดูสวน</Text>}
            onRightPress={() => router.push('/garden')}
            style={styles.section}
          >
            <View style={styles.plantsGrid}>
              {recentPlants.map((plant) => (
                <Card
                  key={plant.id}
                  style={styles.plantCard}
                  onPress={() => handlePlantPress(plant.id)}
                  variant="default"
                >
                  <View style={styles.plantImagePlaceholder}>
                    <Leaf size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.plantName} numberOfLines={1}>
                    {plant.name}
                  </Text>
                  <Chip
                    label={plant.status}
                    status={plant.status}
                    variant="status"
                    size="sm"
                  />
                </Card>
              ))}
            </View>
          </Section>
        )}

        {/* Empty state for new users */}
        {plants.length === 0 && (
          <Card style={styles.emptyState} variant="flat">
            <View style={styles.emptyStateContent}>
              <Leaf size={48} color={colors.gray[400]} />
              <Text style={styles.emptyStateTitle}>ยังไม่มีต้นไม้</Text>
              <Text style={styles.emptyStateSubtitle}>
                เริ่มต้นด้วยการสแกนต้นไม้แรกของคุณ
              </Text>
              <Button
                title="เริ่มสแกน"
                onPress={handleCameraPress}
                variant="primary"
                style={styles.emptyStateButton}
              />
            </View>
          </Card>
        )}

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: getSpacing(4),
  },
  header: {
    marginBottom: getSpacing(6),
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: getSpacing(1),
  },

  // Scanner Card
  scannerCard: {
    marginBottom: getSpacing(6),
  },
  scannerContent: {
    alignItems: 'center',
    padding: getSpacing(2),
  },
  scannerIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(4),
  },
  scannerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: getSpacing(2),
  },
  scannerSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: getSpacing(4),
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
  scannerButtons: {
    flexDirection: 'row',
    gap: getSpacing(3),
  },
  scannerButton: {
    flex: 1,
  },

  // Sections
  section: {
    marginBottom: getSpacing(6),
  },
  seeAllText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },

  // Tips
  tipsContainer: {
    gap: getSpacing(3),
    paddingRight: getSpacing(4),
  },
  tipCard: {
    width: 160,
    padding: getSpacing(3),
  },
  tipIcon: {
    fontSize: 24,
    marginBottom: getSpacing(2),
  },
  tipTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: getSpacing(1),
  },
  tipDescription: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.xs,
  },

  // Plants Grid
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(3),
  },
  plantCard: {
    width: '47%', // 2 columns with gap
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: getSpacing(3),
  },
  plantImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(2),
  },
  plantName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: getSpacing(2),
  },

  // Empty State
  emptyState: {
    marginVertical: getSpacing(4),
  },
  emptyStateContent: {
    alignItems: 'center',
    padding: getSpacing(6),
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
    marginTop: getSpacing(3),
    marginBottom: getSpacing(2),
  },
  emptyStateSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: getSpacing(4),
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
  emptyStateButton: {
    minWidth: 120,
  },

  // Bottom spacing
  bottomSpacing: {
    height: Platform.OS === 'ios' ? 100 : 80, // Tab bar height
  },
});
