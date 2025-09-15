import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Leaf, Sparkles } from 'lucide-react-native';
import { Button, Card, Section, Chip } from '../components/atoms';
import { StaggerContainer, ParallaxScrollView, BounceButton } from '../components/atoms/Animations';
import { GardenGridSkeleton } from '../components/atoms/Skeleton';
import RefreshControl from '../components/atoms/RefreshControl';
import { useGardenStore } from '../stores/garden';
import { useTheme } from '../contexts/ThemeContext';
import { typography, radius, getSpacing } from '../core/theme';
import { initializeCore, errorUtils } from '../core';

export default function HomeScreen() {
  const { plants } = useGardenStore();
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize core services on app start
  React.useEffect(() => {
    initializeCore();
    // Simulate initial loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh operations
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const handleCameraPress = () => {
    router.push('/camera');
  };

  const handleGalleryPress = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'ต้องการสิทธิ์เข้าถึง',
          'กรุณาอนุญาตให้แอปเข้าถึงรูปภาพในเครื่องเพื่อเลือกรูปต้นไม้',
          [
            { text: 'ยกเลิก', style: 'cancel' },
            {
              text: 'ตั้งค่า',
              onPress: () => {
                // On iOS, this will open Settings app
                if (Platform.OS === 'ios') {
                  ImagePicker.requestMediaLibraryPermissionsAsync();
                }
              }
            }
          ]
        );
        return;
      }

      // Launch image picker with optimized settings
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for plant images
        quality: 0.8, // Good quality while keeping file size reasonable
        selectionLimit: 1,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        // Validate image size (max 5MB as per core config)
        if (selectedImage.fileSize && selectedImage.fileSize > 5 * 1024 * 1024) {
          Alert.alert(
            'ไฟล์ใหญ่เกินไป',
            'กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 5MB',
            [{ text: 'ตกลง' }]
          );
          return;
        }

        // Store the selected image URI (you can extend this to save to garden store if needed)
        console.log('Selected image:', selectedImage.uri);

        // Navigate to analyzing screen with image data
        router.push({
          pathname: '/analyzing',
          params: {
            imageUri: selectedImage.uri,
            source: 'gallery'
          }
        });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      const errorMessage = errorUtils.formatErrorMessage(error);

      Alert.alert(
        'เกิดข้อผิดพลาด',
        errorMessage,
        [{ text: 'ตกลง' }]
      );
    }
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

  const styles = createStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={{ height: 36, width: '60%', backgroundColor: theme.colors.gray300, borderRadius: 8 }} />
            <View style={{ height: 20, width: '40%', backgroundColor: theme.colors.gray200, borderRadius: 6, marginTop: 8 }} />
          </View>
          <GardenGridSkeleton count={4} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <StaggerContainer delay={200} staggerDelay={150}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Smart Plant AI</Text>
            <Text style={styles.subtitle}>ดูแลต้นไม้ด้วย AI 🌱</Text>
          </View>

          {/* Scanner Card */}
          <Card style={styles.scannerCard} variant="elevated">
            <View style={styles.scannerContent}>
              <View style={styles.scannerIcon}>
                <Sparkles size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.scannerTitle}>สแกนต้นไม้ของคุณ</Text>
              <Text style={styles.scannerSubtitle}>
                ถ่ายรูปหรืออัปโหลดภาพเพื่อวิเคราะห์สุขภาพพืช
              </Text>

              <View style={styles.scannerButtons}>
                <BounceButton onPress={handleCameraPress}>
                  <Button
                    title="ถ่ายรูปพืช"
                    onPress={handleCameraPress}
                    variant="primary"
                    style={styles.scannerButton}
                  />
                </BounceButton>
                <BounceButton onPress={handleGalleryPress}>
                  <Button
                    title="อัปโหลดรูป"
                    onPress={handleGalleryPress}
                    variant="secondary"
                    style={styles.scannerButton}
                  />
                </BounceButton>
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
              {quickTips.map((tip, index) => (
                <BounceButton key={tip.id} onPress={() => {}}>
                  <Card style={[styles.tipCard, { marginLeft: index === 0 ? 0 : getSpacing(3) }]} variant="flat">
                    <Text style={styles.tipIcon}>{tip.icon}</Text>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipDescription}>{tip.description}</Text>
                  </Card>
                </BounceButton>
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
                {recentPlants.map((plant, index) => (
                  <BounceButton key={plant.id} onPress={() => handlePlantPress(plant.id)}>
                    <Card style={styles.plantCard} variant="default">
                      <View style={styles.plantImagePlaceholder}>
                        <Leaf size={24} color={theme.colors.primary} />
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
                  </BounceButton>
                ))}
              </View>
            </Section>
          )}

          {/* Empty state for new users */}
          {plants.length === 0 && (
            <Card style={styles.emptyState} variant="flat">
              <View style={styles.emptyStateContent}>
                <Leaf size={48} color={theme.colors.gray400} />
                <Text style={styles.emptyStateTitle}>ยังไม่มีต้นไม้</Text>
                <Text style={styles.emptyStateSubtitle}>
                  เริ่มต้นด้วยการสแกนต้นไม้แรกของคุณ
                </Text>
                <BounceButton onPress={handleCameraPress}>
                  <Button
                    title="เริ่มสแกน"
                    onPress={handleCameraPress}
                    variant="primary"
                    style={styles.emptyStateButton}
                  />
                </BounceButton>
              </View>
            </Card>
          )}

          {/* Bottom spacing for tab bar */}
          <View style={styles.bottomSpacing} />
        </StaggerContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
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
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.text.secondary,
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
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(4),
  },
  scannerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: getSpacing(2),
  },
  scannerSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.text.secondary,
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
    color: theme.colors.primary,
  },

  // Tips
  tipsContainer: {
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
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: getSpacing(1),
  },
  tipDescription: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.text.secondary,
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
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(2),
  },
  plantName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: theme.colors.text.primary,
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
    color: theme.colors.text.primary,
    marginTop: getSpacing(3),
    marginBottom: getSpacing(2),
  },
  emptyStateSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.text.secondary,
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
