import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Droplet,
  Edit3,
  Heart,
  Leaf,
  MapPin,
  MoreHorizontal,
  Plus,
  Share,
  Sparkles,
  Sun,
  Thermometer,
  TrendingUp,
  Camera,
  Bell,
  Settings,
} from 'lucide-react-native';

import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Chip } from '../../components/atoms/Chip';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../contexts/I18nContext';
import { usePlantById } from '../../stores/garden';
import { useAITips, useWeatherAI } from '../../hooks/useAI';
import { getSpacing, radius, typography } from '../../core/theme';
import { useHaptic } from '../../core/haptics';

const { width: screenWidth } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 240;
const HEADER_MIN_HEIGHT = 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams();
  const plantId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const plant = usePlantById(plantId);
  const { tips, loading: tipsLoading } = useAITips(plant?.name ?? '');
  const { currentWeather, isLoading: weatherLoading } = useWeatherAI();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const haptic = useHaptic();

  const [scrollY] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleBack = useCallback(() => {
    haptic.trigger('light');
    router.back();
  }, [haptic, router]);

  const handleLogActivityPress = useCallback(() => {
    if (!plantId) {
      console.warn('No plant ID available');
      return;
    }
    haptic.trigger('medium');
    console.log('Navigating to activity log for plant ID:', plantId);
    router.push(`/activity/${plantId}`);
  }, [plantId, haptic, router]);

  const handleShare = useCallback(() => {
    haptic.trigger('light');
    // Implement share functionality
  }, [haptic]);

  const handleEdit = useCallback(() => {
    haptic.trigger('light');
    // Navigate to edit plant
  }, [haptic]);

  const handleLike = useCallback(() => {
    haptic.trigger('light');
    setIsLiked(prev => !prev);
  }, [haptic]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Implement refresh logic
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  }, []);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const plantStatus = plant?.status || 'Healthy';
  const statusColor = plantStatus === 'Healthy' ? theme.colors.success :
                     plantStatus === 'Warning' ? theme.colors.warning : theme.colors.error;

  const careData = useMemo(() => [
    {
      id: 'water',
      icon: Droplet,
      title: 'การรดน้ำ',
      value: 'เมื่อ 2 วันที่แล้ว',
      next: 'ครั้งต่อไปใน 1 วัน',
      color: theme.colors.info,
      progress: 0.7,
    },
    {
      id: 'fertilizer',
      icon: Leaf,
      title: 'การใส่ปุ๋ย',
      value: 'เมื่อ 1 สัปดาห์ที่แล้ว',
      next: 'ครั้งต่อไปใน 5 วัน',
      color: theme.colors.success,
      progress: 0.3,
    },
    {
      id: 'light',
      icon: Sun,
      title: 'แสงแดด',
      value: 'แสงสว่างแบบกระจาย',
      next: '6-8 ชั่วโมง/วัน',
      color: theme.colors.warning,
      progress: 0.8,
    },
  ], [theme.colors]);

  const quickActions = useMemo(() => [
    {
      id: 'water',
      icon: Droplet,
      label: 'รดน้ำ',
      color: theme.colors.info,
      onPress: () => {
        haptic.trigger('medium');
        // Add watering log
      },
    },
    {
      id: 'fertilize',
      icon: Leaf,
      label: 'ใส่ปุ๋ย',
      color: theme.colors.success,
      onPress: () => {
        haptic.trigger('medium');
        // Add fertilizer log
      },
    },
    {
      id: 'photo',
      icon: Camera,
      label: 'ถ่ายรูป',
      color: theme.colors.primary,
      onPress: () => {
        haptic.trigger('medium');
        // Take photo
      },
    },
    {
      id: 'note',
      icon: Edit3,
      label: 'บันทึก',
      color: theme.colors.warning,
      onPress: () => {
        haptic.trigger('medium');
        // Add note
      },
    },
  ], [theme.colors, haptic]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.4)',
            'rgba(0,0,0,0.2)',
            'transparent',
          ]}
          style={styles.headerGradient}
        />

        {/* Plant Image */}
        <Animated.View style={[styles.heroImageContainer, { opacity: headerOpacity }]}>
          {plant?.imageUrl ? (
            <Image
              source={{ uri: plant.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <Leaf size={64} color={theme.colors.primary} />
              <Text style={styles.noImageText}>ไม่มีรูปภาพ</Text>
            </View>
          )}
        </Animated.View>

        {/* Header Controls */}
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>

          <Animated.Text style={[styles.headerTitle, { opacity: titleOpacity }]}>
            {plant?.name || 'Plant Details'}
          </Animated.Text>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={handleLike}>
              <Heart
                size={24}
                color={isLiked ? theme.colors.error : "#ffffff"}
                fill={isLiked ? theme.colors.error : "transparent"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Share size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
              <MoreHorizontal size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Plant Info Card */}
        <Card style={styles.infoCard} shadowLevel="lg">
          <View style={styles.plantHeader}>
            <View style={styles.plantInfo}>
              <Text style={styles.plantName}>{plant?.name || 'ไม่ระบุชื่อ'}</Text>
              {plant?.scientificName && (
                <Text style={styles.scientificName}>{plant.scientificName}</Text>
              )}
              <View style={styles.plantMeta}>
                <MapPin size={14} color={theme.colors.text.tertiary} />
                <Text style={styles.metaText}>ในร่ม • เพิ่มเมื่อ 2 สัปดาห์ก่อน</Text>
              </View>
            </View>
            <Chip
              label={plantStatus}
              status={plantStatus}
              size="lg"
            />
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>การดูแลด่วน</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionButton, { backgroundColor: action.color + '15' }]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <action.icon size={20} color="#ffffff" />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weather Info */}
        <Card style={styles.weatherCard} shadowLevel="md">
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Thermometer size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>สภาพอากาศ</Text>
            </View>
            <View style={styles.sectionHeaderRight}>
              <Clock size={16} color={theme.colors.text.tertiary} />
              <Text style={styles.updateTime}>อัปเดตล่าสุด 5 นาทีที่แล้ว</Text>
            </View>
          </View>

          {weatherLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>กำลังโหลดข้อมูลสภาพอากาศ...</Text>
            </View>
          ) : currentWeather ? (
            <View style={styles.weatherContent}>
              <View style={styles.weatherStats}>
                <View style={styles.weatherStat}>
                  <Thermometer size={24} color={theme.colors.error} />
                  <Text style={styles.weatherValue}>{Math.round(currentWeather.temperature)}°C</Text>
                  <Text style={styles.weatherLabel}>อุณหภูมิ</Text>
                </View>
                <View style={styles.weatherStat}>
                  <Droplet size={24} color={theme.colors.info} />
                  <Text style={styles.weatherValue}>{Math.round(currentWeather.humidity)}%</Text>
                  <Text style={styles.weatherLabel}>ความชื้น</Text>
                </View>
                <View style={styles.weatherStat}>
                  <Sun size={24} color={theme.colors.warning} />
                  <Text style={styles.weatherValue}>UV 5</Text>
                  <Text style={styles.weatherLabel}>ดัชนี UV</Text>
                </View>
              </View>
              <Text style={styles.weatherDescription}>
                {currentWeather.conditionDescriptionThai || currentWeather.conditionDescription}
              </Text>
            </View>
          ) : (
            <Text style={styles.noDataText}>ไม่สามารถโหลดข้อมูลสภาพอากาศได้</Text>
          )}
        </Card>

        {/* Care Schedule */}
        <Card style={styles.careCard} shadowLevel="md">
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Calendar size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>ตารางการดูแล</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>ดูทั้งหมด</Text>
              <TrendingUp size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.careList}>
            {careData.map((care) => (
              <View key={care.id} style={styles.careItem}>
                <View style={styles.careItemLeft}>
                  <View style={[styles.careIcon, { backgroundColor: care.color + '20' }]}>
                    <care.icon size={20} color={care.color} />
                  </View>
                  <View style={styles.careDetails}>
                    <Text style={styles.careTitle}>{care.title}</Text>
                    <Text style={styles.careValue}>{care.value}</Text>
                    <Text style={styles.careNext}>{care.next}</Text>
                  </View>
                </View>
                <View style={styles.careProgress}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${care.progress * 100}%`,
                          backgroundColor: care.color
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{Math.round(care.progress * 100)}%</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* AI Tips */}
        <Card style={styles.tipsCard} shadowLevel="md">
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Sparkles size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>คำแนะนำจาก AI</Text>
            </View>
            {!tipsLoading && tips && tips.length > 0 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>ดูเพิ่มเติม</Text>
              </TouchableOpacity>
            )}
          </View>

          {tipsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>กำลังโหลดคำแนะนำ...</Text>
            </View>
          ) : tips && tips.length > 0 ? (
            <View style={styles.tipsList}>
              {tips.slice(0, 3).map((tip) => (
                <View key={tip.id} style={styles.tipItem}>
                  <View style={styles.tipHeader}>
                    <Text style={styles.tipCategory}>
                      {(tip.category === 'watering' && '💧') ||
                       (tip.category === 'fertilizing' && '🌱') ||
                       (tip.category === 'lighting' && '☀️') || '🍃'}
                    </Text>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                  </View>
                  {tip.description && (
                    <Text style={styles.tipDescription}>{tip.description}</Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Sparkles size={48} color={theme.colors.text.disabled} />
              <Text style={styles.emptyStateText}>ยังไม่มีคำแนะนำในขณะนี้</Text>
              <Text style={styles.emptyStateSubtext}>
                ลองดูแลต้นไม้เพิ่มเติมเพื่อรับคำแนะนำจาก AI
              </Text>
            </View>
          )}
        </Card>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <Button
            title="บันทึกการดูแล"
            onPress={handleLogActivityPress}
            variant="primary"
            size="lg"
            leftIcon={<Plus size={20} color="#ffffff" />}
            style={styles.logButton}
          />
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },

    // Header Styles
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      overflow: 'hidden',
    },
    headerGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    heroImageContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroImagePlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface.disabled,
    },
    noImageText: {
      marginTop: getSpacing(2),
      color: theme.colors.text.secondary,
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
    },
    headerControls: {
      position: 'absolute',
      top: getSpacing(12),
      left: getSpacing(4),
      right: getSpacing(4),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      color: '#ffffff',
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.semibold,
      textShadowColor: 'rgba(0,0,0,0.8)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    headerActions: {
      flexDirection: 'row',
      gap: getSpacing(2),
    },

    // Content Styles
    content: {
      flex: 1,
      marginTop: HEADER_MAX_HEIGHT - 20,
    },

    // Info Card
    infoCard: {
      margin: getSpacing(4),
      marginTop: getSpacing(6),
      borderTopLeftRadius: radius['2xl'],
      borderTopRightRadius: radius['2xl'],
    },
    plantHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: getSpacing(4),
    },
    plantInfo: {
      flex: 1,
      marginRight: getSpacing(3),
    },
    plantName: {
      fontSize: typography.fontSize['2xl'],
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: getSpacing(1),
    },
    scientificName: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
      marginBottom: getSpacing(2),
    },
    plantMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing(1),
    },
    metaText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.tertiary,
    },

    // Quick Actions
    quickActionsContainer: {
      paddingHorizontal: getSpacing(4),
      marginBottom: getSpacing(4),
    },
    quickActions: {
      flexDirection: 'row',
      gap: getSpacing(3),
      marginTop: getSpacing(2),
    },
    quickActionButton: {
      flex: 1,
      alignItems: 'center',
      padding: getSpacing(3),
      borderRadius: radius.xl,
      minHeight: 80,
    },
    quickActionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: getSpacing(1),
    },
    quickActionLabel: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },

    // Section Common Styles
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: getSpacing(3),
    },
    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing(2),
    },
    sectionHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing(1),
    },
    updateTime: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.tertiary,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing(1),
    },
    viewAllText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.primary,
    },

    // Weather Card
    weatherCard: {
      marginHorizontal: getSpacing(4),
      marginBottom: getSpacing(4),
      padding: getSpacing(4),
    },
    weatherContent: {
      gap: getSpacing(3),
    },
    weatherStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    weatherStat: {
      alignItems: 'center',
      gap: getSpacing(1),
    },
    weatherValue: {
      fontSize: typography.fontSize.xl,
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.text.primary,
    },
    weatherLabel: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.secondary,
    },
    weatherDescription: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      paddingTop: getSpacing(2),
      borderTopWidth: 1,
      borderTopColor: theme.colors.surface.elevated,
    },

    // Care Card
    careCard: {
      marginHorizontal: getSpacing(4),
      marginBottom: getSpacing(4),
      padding: getSpacing(4),
    },
    careList: {
      gap: getSpacing(3),
    },
    careItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    careItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: getSpacing(3),
    },
    careIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    careDetails: {
      flex: 1,
    },
    careTitle: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
      marginBottom: getSpacing(0.5),
    },
    careValue: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.secondary,
    },
    careNext: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.tertiary,
      marginTop: getSpacing(0.5),
    },
    careProgress: {
      alignItems: 'center',
      gap: getSpacing(1),
    },
    progressBar: {
      width: 60,
      height: 6,
      backgroundColor: theme.colors.surface.elevated,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressText: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.secondary,
    },

    // Tips Card
    tipsCard: {
      marginHorizontal: getSpacing(4),
      marginBottom: getSpacing(4),
      padding: getSpacing(4),
    },
    tipsList: {
      gap: getSpacing(3),
    },
    tipItem: {
      padding: getSpacing(3),
      backgroundColor: theme.colors.surface.elevated,
      borderRadius: radius.lg,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    tipHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing(2),
      marginBottom: getSpacing(1),
    },
    tipCategory: {
      fontSize: typography.fontSize.lg,
    },
    tipTitle: {
      flex: 1,
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
    },
    tipDescription: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      lineHeight: typography.fontSize.sm * 1.5,
    },

    // Loading States
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: getSpacing(4),
      gap: getSpacing(2),
    },
    loadingText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.secondary,
    },

    // Empty States
    emptyState: {
      alignItems: 'center',
      padding: getSpacing(6),
      gap: getSpacing(2),
    },
    emptyStateText: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    emptyStateSubtext: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: typography.fontSize.sm * 1.4,
    },
    noDataText: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.regular,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      padding: getSpacing(4),
    },

    // Action Container
    actionContainer: {
      paddingHorizontal: getSpacing(4),
      marginBottom: getSpacing(4),
    },
    logButton: {
      width: '100%',
    },

    // Bottom Spacing
    bottomSpacing: {
      height: getSpacing(8),
    },
  });
