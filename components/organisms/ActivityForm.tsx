import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityKind,
  Unit,
  NPK,
  CreateActivityInput,
  PlantPrefs,
  ActivityTemplate,
  isValidQuantity,
  formatQuantityWithUnit,
  getActivityIcon,
  getActivityColor,
} from '../../types/activity';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Toast } from '../atoms/Toast';
import { colors, spacing, radius, typography } from '../../core/theme';
import { haptic } from '../../core/haptics';

interface ActivityFormProps {
  plantId: string;
  plantName: string;
  plantPrefs?: PlantPrefs;
  templates?: ActivityTemplate[];
  onSubmit: (activity: CreateActivityInput) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CreateActivityInput>;
  autoFillMode?: boolean; // Quick entry mode
}

const { width } = Dimensions.get('window');

export const ActivityForm: React.FC<ActivityFormProps> = ({
  plantId,
  plantName,
  plantPrefs,
  templates = [],
  onSubmit,
  onCancel,
  initialData,
  autoFillMode = false,
}) => {
  // Form state
  const [selectedActivity, setSelectedActivity] = useState<ActivityKind>(
    initialData?.kind || plantPrefs?.lastKind || 'รดน้ำ'
  );
  const [quantity, setQuantity] = useState(
    initialData?.quantity || plantPrefs?.lastQty || ''
  );
  const [unit, setUnit] = useState<Unit>(
    initialData?.unit || plantPrefs?.lastUnit || 'ml'
  );
  const [npk, setNpk] = useState<NPK>(
    initialData?.npk || plantPrefs?.lastNPK || { n: '', p: '', k: '' }
  );
  const [note, setNote] = useState(initialData?.note || '');
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Animation values
  const formOpacity = useSharedValue(1);
  const templateHeight = useSharedValue(0);

  // Activity types with enhanced data
  const activities: Array<{
    kind: ActivityKind;
    icon: string;
    color: string;
    defaultUnits: Unit[];
    requiresQuantity: boolean;
    supportsNPK: boolean;
  }> = [
    {
      kind: 'รดน้ำ',
      icon: '💧',
      color: '#3b82f6',
      defaultUnits: ['ml', 'ล.'],
      requiresQuantity: true,
      supportsNPK: false,
    },
    {
      kind: 'ใส่ปุ๋ย',
      icon: '🌱',
      color: '#10b981',
      defaultUnits: ['g', 'ml'],
      requiresQuantity: false,
      supportsNPK: true,
    },
    {
      kind: 'พ่นยา',
      icon: '🧴',
      color: '#f59e0b',
      defaultUnits: ['ml', 'g'],
      requiresQuantity: false,
      supportsNPK: false,
    },
    {
      kind: 'ย้ายกระถาง',
      icon: '🪴',
      color: '#8b5cf6',
      defaultUnits: ['pcs'],
      requiresQuantity: false,
      supportsNPK: false,
    },
    {
      kind: 'ตรวจใบ',
      icon: '🔍',
      color: '#6b7280',
      defaultUnits: [],
      requiresQuantity: false,
      supportsNPK: false,
    },
  ];

  const currentActivity = activities.find(a => a.kind === selectedActivity)!;

  // Smart defaults based on activity type and preferences
  useEffect(() => {
    const activity = activities.find(a => a.kind === selectedActivity);
    if (!activity) return;

    // Auto-select appropriate unit based on activity type
    if (activity.defaultUnits.length > 0 && !activity.defaultUnits.includes(unit)) {
      // Use plant preference or first default unit
      const preferredUnit = selectedActivity === 'รดน้ำ'
        ? plantPrefs?.preferredWateringUnit || activity.defaultUnits[0]
        : selectedActivity === 'ใส่ปุ๋ย'
        ? plantPrefs?.preferredFertilizerUnit || activity.defaultUnits[0]
        : activity.defaultUnits[0];

      setUnit(preferredUnit);
    }

    // Clear quantity if not required
    if (!activity.requiresQuantity && !quantity) {
      setQuantity('');
    }

    // Clear NPK if not supported
    if (!activity.supportsNPK) {
      setNpk({ n: '', p: '', k: '' });
    }
  }, [selectedActivity]);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Quantity validation
    if (currentActivity.requiresQuantity && !quantity) {
      newErrors.quantity = 'จำนวนเป็นข้อมูลที่จำเป็น';
    } else if (quantity && !isValidQuantity(quantity)) {
      newErrors.quantity = 'กรุณาใส่จำนวนที่ถูกต้อง';
    }

    // NPK validation
    if (currentActivity.supportsNPK && selectedActivity === 'ใส่ปุ๋ย') {
      if (npk.n && !isValidQuantity(npk.n)) {
        newErrors.npk = 'ค่า NPK ต้องเป็นตัวเลขที่ถูกต้อง';
      }
      if (npk.p && !isValidQuantity(npk.p)) {
        newErrors.npk = 'ค่า NPK ต้องเป็นตัวเลขที่ถูกต้อง';
      }
      if (npk.k && !isValidQuantity(npk.k)) {
        newErrors.npk = 'ค่า NPK ต้องเป็นตัวเลขที่ถูกต้อง';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedActivity, quantity, npk, currentActivity]);

  // Handle template selection
  const handleTemplateSelect = (template: ActivityTemplate) => {
    setSelectedActivity(template.kind);
    if (template.defaultQuantity) setQuantity(template.defaultQuantity);
    if (template.defaultUnit) setUnit(template.defaultUnit);
    if (template.defaultNPK) setNpk(template.defaultNPK);
    if (template.instructions) {
      setNote(template.instructions.join('\n'));
    }
    setSelectedTemplate(template);
    setShowTemplates(false);
    haptic.selectionChanged();
  };

  // Handle photo capture
  const handleTakePhoto = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setToastMessage('ต้องการสิทธิ์ในการใช้กล้อง');
      setShowToast(true);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
      haptic.notificationSuccess();
    }
  };

  // Handle photo selection from library
  const handleSelectPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    haptic.impactLight();
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      haptic.notificationError();
      return;
    }

    setIsSubmitting(true);

    try {
      const activity: CreateActivityInput = {
        plantId,
        kind: selectedActivity,
        quantity: quantity || undefined,
        unit: quantity ? unit : undefined,
        npk: (currentActivity.supportsNPK && (npk.n || npk.p || npk.k)) ? npk : undefined,
        note: note || undefined,
        dateISO: new Date().toISOString(),
        time24: new Date().toTimeString().slice(0, 5),
        source: 'user',
      };

      await onSubmit(activity);
      haptic.notificationSuccess();

      setToastMessage('บันทึกกิจกรรมเรียบร้อยแล้ว');
      setShowToast(true);

      // Reset form for quick entry mode
      if (autoFillMode) {
        setQuantity('');
        setNote('');
        setPhotos([]);
        setErrors({});
      }
    } catch (error) {
      console.error('Failed to submit activity:', error);
      haptic.notificationError();
      setToastMessage('เกิดข้อผิดพลาดในการบันทึก');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick action shortcuts
  const quickActions = [
    { kind: 'รดน้ำ', quantity: '200', unit: 'ml' as Unit },
    { kind: 'รดน้ำ', quantity: '500', unit: 'ml' as Unit },
    { kind: 'ใส่ปุ๋ย', quantity: '10', unit: 'g' as Unit },
    { kind: 'ตรวจใบ', quantity: '', unit: 'pcs' as Unit },
  ];

  const animatedFormStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  const animatedTemplateStyle = useAnimatedStyle(() => ({
    height: templateHeight.value,
    opacity: showTemplates ? 1 : 0,
  }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.content, animatedFormStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>บันทึกกิจกรรม</Text>
          <Text style={styles.subtitle}>{plantName}</Text>
        </View>

        {/* Quick Actions */}
        {autoFillMode && (
          <Card style={styles.quickActionsCard}>
            <Text style={styles.sectionTitle}>ทำรายการด่วน</Text>
            <View style={styles.quickActions}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionButton}
                  onPress={() => {
                    setSelectedActivity(action.kind as ActivityKind);
                    setQuantity(action.quantity);
                    setUnit(action.unit);
                    if (action.quantity && action.kind === 'รดน้ำ') {
                      // Auto-submit for watering quick actions
                      setTimeout(handleSubmit, 100);
                    }
                  }}
                >
                  <Text style={styles.quickActionIcon}>
                    {getActivityIcon(action.kind as ActivityKind)}
                  </Text>
                  <Text style={styles.quickActionText}>
                    {action.kind} {formatQuantityWithUnit(action.quantity, action.unit)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Activity Templates */}
        {templates.length > 0 && (
          <Card style={styles.templatesCard}>
            <TouchableOpacity
              style={styles.templatesHeader}
              onPress={() => {
                setShowTemplates(!showTemplates);
                templateHeight.value = withSpring(showTemplates ? 0 : 120);
              }}
            >
              <Text style={styles.sectionTitle}>เทมเพลตกิจกรรม</Text>
              <Ionicons
                name={showTemplates ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.text.secondary}
              />
            </TouchableOpacity>

            <Animated.View style={[styles.templatesContent, animatedTemplateStyle]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {templates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateItem,
                      selectedTemplate?.id === template.id && styles.templateItemSelected
                    ]}
                    onPress={() => handleTemplateSelect(template)}
                  >
                    <Text style={styles.templateIcon}>
                      {getActivityIcon(template.kind)}
                    </Text>
                    <Text style={styles.templateText}>{template.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </Card>
        )}

        {/* Activity Type Selection */}
        <Card style={styles.activityCard}>
          <Text style={styles.sectionTitle}>ประเภทกิจกรรม</Text>
          <View style={styles.activityButtons}>
            {activities.map((activity) => (
              <TouchableOpacity
                key={activity.kind}
                style={[
                  styles.activityButton,
                  selectedActivity === activity.kind && [
                    styles.activityButtonActive,
                    { backgroundColor: activity.color }
                  ]
                ]}
                onPress={() => {
                  setSelectedActivity(activity.kind);
                  haptic.selectionChanged();
                }}
              >
                <Text style={styles.activityIcon}>{activity.icon}</Text>
                <Text style={[
                  styles.activityButtonText,
                  selectedActivity === activity.kind && styles.activityButtonTextActive
                ]}>
                  {activity.kind}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.activity && (
            <Text style={styles.errorText}>{errors.activity}</Text>
          )}
        </Card>

        {/* Quantity Input */}
        {(currentActivity.requiresQuantity || quantity) && (
          <Card style={styles.quantityCard}>
            <Text style={styles.sectionTitle}>จำนวน</Text>
            <View style={styles.quantityRow}>
              <TextInput
                style={[
                  styles.quantityInput,
                  errors.quantity && styles.inputError
                ]}
                value={quantity}
                onChangeText={(text) => {
                  setQuantity(text);
                  if (errors.quantity) {
                    setErrors(prev => ({ ...prev, quantity: '' }));
                  }
                }}
                placeholder="จำนวน"
                keyboardType="numeric"
                returnKeyType="done"
              />
              <View style={styles.unitButtons}>
                {currentActivity.defaultUnits.map((unitOption) => (
                  <TouchableOpacity
                    key={unitOption}
                    style={[
                      styles.unitButton,
                      unit === unitOption && styles.unitButtonActive
                    ]}
                    onPress={() => {
                      setUnit(unitOption);
                      haptic.selectionChanged();
                    }}
                  >
                    <Text style={[
                      styles.unitButtonText,
                      unit === unitOption && styles.unitButtonTextActive
                    ]}>
                      {unitOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {errors.quantity && (
              <Text style={styles.errorText}>{errors.quantity}</Text>
            )}
          </Card>
        )}

        {/* NPK Input for Fertilizer */}
        {currentActivity.supportsNPK && selectedActivity === 'ใส่ปุ๋ย' && (
          <Card style={styles.npkCard}>
            <Text style={styles.sectionTitle}>ค่า NPK (ไม่บังคับ)</Text>
            <View style={styles.npkRow}>
              <View style={styles.npkInputGroup}>
                <Text style={styles.npkLabel}>N</Text>
                <TextInput
                  style={[
                    styles.npkInput,
                    errors.npk && styles.inputError
                  ]}
                  value={npk.n}
                  onChangeText={(text) => {
                    setNpk(prev => ({ ...prev, n: text }));
                    if (errors.npk) {
                      setErrors(prev => ({ ...prev, npk: '' }));
                    }
                  }}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.npkInputGroup}>
                <Text style={styles.npkLabel}>P</Text>
                <TextInput
                  style={[
                    styles.npkInput,
                    errors.npk && styles.inputError
                  ]}
                  value={npk.p}
                  onChangeText={(text) => {
                    setNpk(prev => ({ ...prev, p: text }));
                    if (errors.npk) {
                      setErrors(prev => ({ ...prev, npk: '' }));
                    }
                  }}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.npkInputGroup}>
                <Text style={styles.npkLabel}>K</Text>
                <TextInput
                  style={[
                    styles.npkInput,
                    errors.npk && styles.inputError
                  ]}
                  value={npk.k}
                  onChangeText={(text) => {
                    setNpk(prev => ({ ...prev, k: text }));
                    if (errors.npk) {
                      setErrors(prev => ({ ...prev, npk: '' }));
                    }
                  }}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>
            {errors.npk && (
              <Text style={styles.errorText}>{errors.npk}</Text>
            )}
          </Card>
        )}

        {/* Photo Capture */}
        <Card style={styles.photoCard}>
          <View style={styles.photoHeader}>
            <Text style={styles.sectionTitle}>รูปภาพ (ไม่บังคับ)</Text>
            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={styles.photoActionButton}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoActionButton}
                onPress={handleSelectPhoto}
              >
                <Ionicons name="images" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photoList}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri: photo }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.photoRemoveButton}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </Card>

        {/* Notes */}
        <Card style={styles.notesCard}>
          <Text style={styles.sectionTitle}>หมายเหตุ (ไม่บังคับ)</Text>
          <TextInput
            style={styles.notesInput}
            value={note}
            onChangeText={setNote}
            placeholder="เพิ่มหมายเหตุเกี่ยวกับกิจกรรมนี้..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="บันทึกกิจกรรม"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            variant="primary"
            size="lg"
            fullWidth
          />
          {onCancel && (
            <Button
              title="ยกเลิก"
              onPress={onCancel}
              variant="ghost"
              size="md"
              style={styles.cancelButton}
            />
          )}
        </View>
      </Animated.View>

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          visible={showToast}
          onHide={() => setShowToast(false)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // Section styles
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontFamily: typography.fontFamily.semibold,
  },

  // Quick actions
  quickActionsCard: {
    marginBottom: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionButton: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium as any,
  },

  // Templates
  templatesCard: {
    marginBottom: spacing.md,
  },
  templatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templatesContent: {
    overflow: 'hidden',
  },
  templateItem: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginRight: spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  templateItemSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  templateIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  templateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    textAlign: 'center',
  },

  // Activity selection
  activityCard: {
    marginBottom: spacing.md,
  },
  activityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  activityButton: {
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: (width - spacing.md * 2 - spacing.sm * 2) / 3,
  },
  activityButtonActive: {
    borderColor: 'transparent',
  },
  activityIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  activityButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium as any,
  },
  activityButtonTextActive: {
    color: colors.white,
  },

  // Quantity
  quantityCard: {
    marginBottom: spacing.md,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    backgroundColor: colors.white,
  },
  unitButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  unitButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  unitButtonTextActive: {
    color: colors.white,
  },

  // NPK
  npkCard: {
    marginBottom: spacing.md,
  },
  npkRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  npkInputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  npkLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  npkInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    backgroundColor: colors.white,
  },

  // Photos
  photoCard: {
    marginBottom: spacing.md,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoActionButton: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.background.tertiary,
  },
  photoList: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoItem: {
    position: 'relative',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    backgroundColor: colors.white,
    borderRadius: 10,
  },

  // Notes
  notesCard: {
    marginBottom: spacing.lg,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    backgroundColor: colors.white,
    minHeight: 80,
  },

  // Actions
  actionButtons: {
    gap: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },

  // Error states
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

export default ActivityForm;