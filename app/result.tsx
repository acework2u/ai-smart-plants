import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Leaf,
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Home,
  BookOpen,
} from 'lucide-react-native';
import { PlantAnalysisResult } from '../types/ai';
import { colors, typography, radius, getSpacing } from '../core/theme';
import { Card, Button, Chip, Section } from '../components/atoms';
import { useGardenStore } from '../stores/garden';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addPlant } = useGardenStore();
  const [isSaving, setIsSaving] = useState(false);

  // Parse analysis result from params
  let analysisResult: PlantAnalysisResult | null = null;
  try {
    if (params.analysisResult) {
      const parsed = JSON.parse(params.analysisResult as string);
      // Rehydrate date fields that were serialized as strings
      if (parsed) {
        if (parsed.analysisTimestamp) {
          parsed.analysisTimestamp = new Date(parsed.analysisTimestamp);
        }
        if (Array.isArray(parsed.recommendations)) {
          parsed.recommendations = parsed.recommendations.map((r: any) => ({
            ...r,
            createdAt: r?.createdAt ? new Date(r.createdAt) : undefined,
            validUntil: r?.validUntil ? new Date(r.validUntil) : undefined,
          }));
        }
        if (Array.isArray(parsed.issues)) {
          parsed.issues = parsed.issues.map((i: any) => ({
            ...i,
            detectedAt: i?.detectedAt ? new Date(i.detectedAt) : undefined,
            resolvedAt: i?.resolvedAt ? new Date(i.resolvedAt) : undefined,
          }));
        }
      }
      analysisResult = parsed as PlantAnalysisResult;
    }
  } catch (error) {
    console.error('Failed to parse analysis result:', error);
  }

  // Fallback to mock data if parsing fails
  if (!analysisResult) {
    analysisResult = {
      analysisId: 'mock-result',
      plantName: 'Monstera Deliciosa',
      scientificName: 'Monstera deliciosa',
      confidence: 0.94,
      healthStatus: 'Healthy',
      healthScore: 89,
      issues: [],
      recommendations: [
        {
          id: 'rec-1',
          category: 'watering',
          priority: 2,
          title: 'รดน้ำเมื่อดินแห้ง',
          description: 'รดน้ำเมื่อดินแห้ง 2-3 นิ้วแรก ตรวจสอบด้วยการแหย่นิ้ว',
          actionItems: ['ตรวจดินก่อนรดทุกครั้ง', 'รดน้ำช้าๆ จนออกรูระบาย'],
          timeFrame: 'within_day',
          confidence: 0.88,
          source: 'ai',
          createdAt: new Date(),
        },
      ],
      analysisTimestamp: new Date(),
      imageUri: params.imageUri as string,
      metadata: {
        imageQuality: 0.85,
        processingTime: 2450,
        modelVersion: 'PlantAI-v2.1.0',
        confidence: 0.89,
      },
      notes: 'ต้นไม้ชนิดนี้เหมาะสำหรับปลูกในบ้าน ใส่แสงทางอ้อม และรดน้ำเมื่อดินแห้ง',
    };
  }

  // Helpers
  const formatTime = (value: any, locale: string = 'th-TH') => {
    try {
      const d = value instanceof Date ? value : new Date(value);
      if (!d || isNaN(d.getTime())) return '-';
      return d.toLocaleTimeString(locale);
    } catch {
      return '-';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'Healthy':
        return colors.success;
      case 'Warning':
        return colors.warning;
      case 'Critical':
        return colors.error;
      default:
        return colors.gray[500];
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'Healthy':
        return <CheckCircle size={24} color={colors.success} />;
      case 'Warning':
        return <AlertTriangle size={24} color={colors.warning} />;
      case 'Critical':
        return <AlertTriangle size={24} color={colors.error} />;
      default:
        return <Heart size={24} color={colors.gray[500]} />;
    }
  };

  const getIssueColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return colors.error;
      case 'high':
        return colors.warning;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.gray[500];
      default:
        return colors.gray[400];
    }
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 4) return <AlertTriangle size={16} color={colors.error} />;
    if (priority >= 3) return <Clock size={16} color={colors.warning} />;
    return <CheckCircle size={16} color={colors.success} />;
  };

  const handleSaveToGarden = async () => {
    if (!analysisResult) return;

    try {
      setIsSaving(true);

      // Create plant data for the garden
      const plantData = {
        name: analysisResult.plantName,
        scientificName: analysisResult.scientificName || '',
        status: analysisResult.healthStatus,
        imageUrl: analysisResult.imageUri,
        metadata: {
          healthScore: analysisResult.healthScore,
          analysisHistory: [analysisResult],
          tags: analysisResult.tags || [],
        },
      };

      // Add to garden store
      addPlant(plantData);

      Alert.alert(
        'บันทึกสำเร็จ!',
        `${analysisResult.plantName} ถูกเพิ่มเข้าสวนของคุณแล้ว`,
        [
          {
            text: 'ดูสวน',
            onPress: () => router.push('/(tabs)/garden'),
          },
          {
            text: 'กลับหน้าแรก',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save plant:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกต้นไม้ได้ โปรดลองอีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Home size={24} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ผลการวิเคราะห์</Text>
          <TouchableOpacity style={styles.infoButton}>
            <BookOpen size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Plant Image */}
        {analysisResult.imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: analysisResult.imageUri }} style={styles.plantImage} />
            <View style={styles.confidenceBadge}>
              <Sparkles size={16} color={colors.white} />
              <Text style={styles.confidenceText}>
                {Math.round(analysisResult.confidence * 100)}%
              </Text>
            </View>
          </View>
        )}

        {/* Plant Info Card */}
        <Card style={styles.plantInfoCard} variant="elevated">
          <View style={styles.plantHeader}>
            <View style={styles.plantNames}>
              <Text style={styles.plantName}>{analysisResult.plantName}</Text>
              {analysisResult.scientificName && (
                <Text style={styles.scientificName}>{analysisResult.scientificName}</Text>
              )}
            </View>
            <View style={styles.healthBadge}>
              {getHealthIcon(analysisResult.healthStatus)}
            </View>
          </View>

          <View style={styles.healthSection}>
            <Text style={styles.healthLabel}>สถานะสุขภาพ</Text>
            <View style={styles.healthRow}>
              <Chip
                label={analysisResult.healthStatus}
                status={analysisResult.healthStatus}
                variant="status"
                size="md"
              />
              <Text style={styles.healthScore}>
                คะแนน: {analysisResult.healthScore}/100
              </Text>
            </View>
          </View>

          {analysisResult.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesText}>{analysisResult.notes}</Text>
            </View>
          )}
        </Card>

        {/* Issues Section */}
        {analysisResult.issues.length > 0 && (
          <Section
            title="ปัญหาที่พบ"
            subtitle={`${analysisResult.issues.length} รายการ`}
            style={styles.section}
          >
            {analysisResult.issues.map((issue) => (
              <Card key={issue.id} style={styles.issueCard} variant="flat">
                <View style={styles.issueHeader}>
                  <Text style={styles.issueTitle}>{issue.title}</Text>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: getIssueColor(issue.severity) },
                    ]}
                  />
                </View>
                <Text style={styles.issueDescription}>{issue.description}</Text>

                {issue.treatments && issue.treatments.length > 0 && (
                  <View style={styles.treatmentSection}>
                    <Text style={styles.treatmentLabel}>วิธีแก้ไข:</Text>
                    {issue.treatments.map((treatment, index) => (
                      <Text key={index} style={styles.treatmentItem}>
                        • {treatment}
                      </Text>
                    ))}
                  </View>
                )}
              </Card>
            ))}
          </Section>
        )}

        {/* Recommendations Section */}
        {analysisResult.recommendations.length > 0 && (
          <Section
            title="คำแนะนำจาก AI"
            subtitle={`${analysisResult.recommendations.length} รายการ`}
            style={styles.section}
          >
            {analysisResult.recommendations.map((rec) => (
              <Card key={rec.id} style={styles.recommendationCard} variant="flat">
                <View style={styles.recommendationHeader}>
                  <View style={styles.recommendationTitleRow}>
                    {getPriorityIcon(rec.priority)}
                    <Text style={styles.recommendationTitle}>{rec.title}</Text>
                  </View>
                  <Chip
                    label={rec.category}
                    variant="outline"
                    size="sm"
                  />
                </View>

                <Text style={styles.recommendationDescription}>
                  {rec.description}
                </Text>

                {rec.actionItems.length > 0 && (
                  <View style={styles.actionItemsSection}>
                    <Text style={styles.actionItemsLabel}>ขั้นตอน:</Text>
                    {rec.actionItems.map((action, index) => (
                      <Text key={index} style={styles.actionItem}>
                        {index + 1}. {action}
                      </Text>
                    ))}
                  </View>
                )}

                <View style={styles.recommendationFooter}>
                  {rec.estimatedTime && (
                    <Text style={styles.timeEstimate}>⏱ {rec.estimatedTime}</Text>
                  )}
                  <Text style={styles.confidence}>
                    ความมั่นใจ: {Math.round(rec.confidence * 100)}%
                  </Text>
                </View>
              </Card>
            ))}
          </Section>
        )}

        {/* Analysis Metadata */}
        <Card style={styles.metadataCard} variant="flat">
          <Text style={styles.metadataTitle}>ข้อมูลการวิเคราะห์</Text>
          <View style={styles.metadataGrid}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>เวลาประมวลผล</Text>
              <Text style={styles.metadataValue}>
                {Math.round(analysisResult.metadata.processingTime)}ms
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>คุณภาพภาพ</Text>
              <Text style={styles.metadataValue}>
                {Math.round(analysisResult.metadata.imageQuality * 100)}%
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>รุ่นโมเดล</Text>
              <Text style={styles.metadataValue}>
                {analysisResult.metadata.modelVersion}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>เวลาวิเคราะห์</Text>
              <Text style={styles.metadataValue}>
                {formatTime(analysisResult.analysisTimestamp, 'th-TH')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="บันทึกในสวน"
            onPress={handleSaveToGarden}
            variant="primary"
            style={styles.saveButton}
            loading={isSaving}
            disabled={isSaving}
          />
          <Button
            title="วิเคราะห์ใหม่"
            onPress={() => router.push('/camera')}
            variant="secondary"
            style={styles.analyzeButton}
          />
        </View>

        {/* Bottom spacing */}
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing(6),
  },
  backButton: {
    padding: getSpacing(2),
    borderRadius: radius.full,
    backgroundColor: colors.gray[100],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  infoButton: {
    padding: getSpacing(2),
    borderRadius: radius.full,
    backgroundColor: colors.gray[100],
  },

  // Plant Image
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: getSpacing(6),
  },
  plantImage: {
    width: 250,
    height: 250,
    borderRadius: radius.xl,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  confidenceBadge: {
    position: 'absolute',
    top: getSpacing(3),
    right: getSpacing(3),
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing(3),
    paddingVertical: getSpacing(1),
    borderRadius: radius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  confidenceText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    marginLeft: getSpacing(1),
  },

  // Plant Info Card
  plantInfoCard: {
    marginBottom: getSpacing(6),
    padding: getSpacing(5),
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getSpacing(4),
  },
  plantNames: {
    flex: 1,
  },
  plantName: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: getSpacing(1),
  },
  scientificName: {
    fontSize: typography.fontSize.base,
    fontStyle: 'italic',
    color: colors.text.secondary,
  },
  healthBadge: {
    marginLeft: getSpacing(3),
  },
  healthSection: {
    marginBottom: getSpacing(4),
  },
  healthLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    marginBottom: getSpacing(2),
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthScore: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: getSpacing(4),
  },
  notesText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },

  // Sections
  section: {
    marginBottom: getSpacing(6),
  },

  // Issues
  issueCard: {
    marginBottom: getSpacing(3),
    padding: getSpacing(4),
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing(2),
  },
  issueTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  severityBadge: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    marginLeft: getSpacing(2),
  },
  issueDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: getSpacing(3),
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  treatmentSection: {
    backgroundColor: colors.gray[50],
    padding: getSpacing(3),
    borderRadius: radius.md,
  },
  treatmentLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: getSpacing(2),
  },
  treatmentItem: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: getSpacing(1),
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },

  // Recommendations
  recommendationCard: {
    marginBottom: getSpacing(3),
    padding: getSpacing(4),
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getSpacing(2),
  },
  recommendationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: getSpacing(2),
  },
  recommendationTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
    marginLeft: getSpacing(2),
    flex: 1,
  },
  recommendationDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: getSpacing(3),
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  actionItemsSection: {
    backgroundColor: colors.primarySoft,
    padding: getSpacing(3),
    borderRadius: radius.md,
    marginBottom: getSpacing(3),
  },
  actionItemsLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginBottom: getSpacing(2),
  },
  actionItem: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginBottom: getSpacing(1),
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeEstimate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  confidence: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },

  // Metadata
  metadataCard: {
    marginBottom: getSpacing(6),
    padding: getSpacing(4),
  },
  metadataTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: getSpacing(3),
    textAlign: 'center',
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metadataItem: {
    width: '48%',
    marginBottom: getSpacing(3),
  },
  metadataLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: getSpacing(1),
  },
  metadataValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: getSpacing(3),
    marginBottom: getSpacing(4),
  },
  saveButton: {
    flex: 2,
  },
  analyzeButton: {
    flex: 1,
  },

  // Bottom spacing
  bottomSpacing: {
    height: getSpacing(4),
  },
});
