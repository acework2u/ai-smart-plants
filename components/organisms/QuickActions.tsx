import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityKind,
  Unit,
  CreateActivityInput,
  ActivityTemplate,
  PlantPrefs,
  getActivityIcon,
  getActivityColor,
  formatQuantityWithUnit,
} from '../../types/activity';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { colors, spacing, radius, typography } from '../../core/theme';
import { haptic } from '../../core/haptics';

interface QuickAction {
  id: string;
  name: string;
  kind: ActivityKind;
  quantity?: string;
  unit?: Unit;
  icon: string;
  color: string;
  isCustom?: boolean;
  shortcut?: string; // Keyboard shortcut
}

interface QuickActionsProps {
  plantId: string;
  plantName: string;
  plantPrefs?: PlantPrefs;
  customActions?: QuickAction[];
  templates?: ActivityTemplate[];
  onQuickAction: (activity: CreateActivityInput) => Promise<void>;
  onCustomizeActions?: (actions: QuickAction[]) => void;
  showCustomization?: boolean;
  horizontal?: boolean;
  maxVisible?: number;
}

const { width } = Dimensions.get('window');

export const QuickActions: React.FC<QuickActionsProps> = ({
  plantId,
  plantName,
  plantPrefs,
  customActions = [],
  templates = [],
  onQuickAction,
  onCustomizeActions,
  showCustomization = true,
  horizontal = false,
  maxVisible = 4,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [availableActions, setAvailableActions] = useState<QuickAction[]>([]);

  // Animation values
  const actionScale = useSharedValue(1);

  // Default quick actions based on plant preferences and common activities
  const defaultActions: QuickAction[] = [
    {
      id: 'water-small',
      name: 'รดน้ำ 200ml',
      kind: 'รดน้ำ',
      quantity: '200',
      unit: 'ml',
      icon: '💧',
      color: '#3b82f6',
    },
    {
      id: 'water-medium',
      name: 'รดน้ำ 500ml',
      kind: 'รดน้ำ',
      quantity: '500',
      unit: 'ml',
      icon: '💧',
      color: '#3b82f6',
    },
    {
      id: 'water-large',
      name: 'รดน้ำ 1ล.',
      kind: 'รดน้ำ',
      quantity: '1',
      unit: 'ล.',
      icon: '💧',
      color: '#3b82f6',
    },
    {
      id: 'fertilizer',
      name: 'ใส่ปุ๋ย',
      kind: 'ใส่ปุ๋ย',
      quantity: '10',
      unit: 'g',
      icon: '🌱',
      color: '#10b981',
    },
    {
      id: 'inspect',
      name: 'ตรวจใบ',
      kind: 'ตรวจใบ',
      icon: '🔍',
      color: '#6b7280',
    },
    {
      id: 'spray',
      name: 'พ่นยา',
      kind: 'พ่นยา',
      quantity: '50',
      unit: 'ml',
      icon: '🧴',
      color: '#f59e0b',
    },
  ];

  // Merge default and custom actions
  const allActions = [...defaultActions, ...customActions];

  // Smart action suggestions based on plant preferences
  const getSmartActions = (): QuickAction[] => {
    const smartActions: QuickAction[] = [];

    // Add preferred watering amount
    if (plantPrefs?.preferredWateringUnit) {
      const preferredAmount = plantPrefs.lastQty || '200';
      smartActions.push({
        id: 'smart-water',
        name: `รดน้ำ ${formatQuantityWithUnit(preferredAmount, plantPrefs.preferredWateringUnit)}`,
        kind: 'รดน้ำ',
        quantity: preferredAmount,
        unit: plantPrefs.preferredWateringUnit,
        icon: '💧',
        color: '#3b82f6',
      });
    }

    // Add last fertilizer settings
    if (plantPrefs?.lastNPK && (plantPrefs.lastNPK.n || plantPrefs.lastNPK.p || plantPrefs.lastNPK.k)) {
      smartActions.push({
        id: 'smart-fertilizer',
        name: `ปุ๋ย NPK ${plantPrefs.lastNPK.n}-${plantPrefs.lastNPK.p}-${plantPrefs.lastNPK.k}`,
        kind: 'ใส่ปุ๋ย',
        quantity: plantPrefs.lastQty || '10',
        unit: plantPrefs.preferredFertilizerUnit || 'g',
        icon: '🌱',
        color: '#10b981',
      });
    }

    return smartActions;
  };

  const visibleActions = horizontal
    ? allActions.slice(0, maxVisible)
    : allActions;

  const smartActions = getSmartActions();

  // Handle quick action execution
  const handleQuickAction = async (action: QuickAction) => {
    if (isExecuting) return;

    setIsExecuting(true);
    setExecutingActionId(action.id);

    // Animation feedback
    actionScale.value = withSequence(
      withSpring(0.9, { duration: 100 }),
      withSpring(1, { duration: 100 })
    );

    try {
      const activity: CreateActivityInput = {
        plantId,
        kind: action.kind,
        quantity: action.quantity,
        unit: action.unit,
        dateISO: new Date().toISOString(),
        time24: new Date().toTimeString().slice(0, 5),
        source: 'user',
        note: `ทำรายการด่วน: ${action.name}`,
      };

      await onQuickAction(activity);
      haptic.notificationSuccess();
    } catch (error) {
      console.error('Failed to execute quick action:', error);
      haptic.notificationError();
    } finally {
      setIsExecuting(false);
      setExecutingActionId(null);
    }
  };

  // Handle customize actions
  const handleCustomizeActions = () => {
    setAvailableActions([...allActions, ...templates.map(t => ({
      id: t.id,
      name: t.name,
      kind: t.kind,
      quantity: t.defaultQuantity,
      unit: t.defaultUnit,
      icon: getActivityIcon(t.kind),
      color: getActivityColor(t.kind),
      isCustom: t.isCustom,
    }))]);
    setShowCustomizeModal(true);
  };

  // Render quick action button
  const renderQuickAction = (action: QuickAction) => {
    const isExecutingThis = executingActionId === action.id;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: isExecutingThis ? actionScale.value : 1 }],
    }));

    return (
      <Animated.View key={action.id} style={[animatedStyle]}>
        <TouchableOpacity
          style={[
            styles.quickActionButton,
            { borderColor: action.color + '30' },
            isExecutingThis && styles.quickActionButtonExecuting,
          ]}
          onPress={() => handleQuickAction(action)}
          disabled={isExecuting}
        >
          <View style={[
            styles.quickActionIcon,
            { backgroundColor: action.color + '20' }
          ]}>
            <Text style={styles.quickActionIconText}>{action.icon}</Text>
          </View>
          <Text style={styles.quickActionName} numberOfLines={2}>
            {action.name}
          </Text>
          {action.shortcut && (
            <Text style={styles.quickActionShortcut}>{action.shortcut}</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render action grid
  const renderActionGrid = (actions: QuickAction[], title?: string) => (
    <View style={styles.actionGrid}>
      {title && <Text style={styles.gridTitle}>{title}</Text>}
      <View style={[
        styles.actionsContainer,
        horizontal && styles.actionsContainerHorizontal
      ]}>
        {actions.map(renderQuickAction)}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Smart Actions */}
      {smartActions.length > 0 && (
        <Card style={styles.smartActionsCard}>
          {renderActionGrid(smartActions, '🧠 แนะนำสำหรับคุณ')}
        </Card>
      )}

      {/* Main Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <View style={styles.quickActionsHeader}>
          <Text style={styles.sectionTitle}>ทำรายการด่วน</Text>
          {showCustomization && (
            <TouchableOpacity
              style={styles.customizeButton}
              onPress={handleCustomizeActions}
            >
              <Ionicons name="settings" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {horizontal ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContainer}
          >
            {visibleActions.map(renderQuickAction)}
          </ScrollView>
        ) : (
          renderActionGrid(visibleActions)
        )}
      </Card>

      {/* Customize Modal */}
      <Modal
        visible={showCustomizeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomizeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ปรับแต่งทำรายการด่วน</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCustomizeModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              เลือกกิจกรรมที่ต้องการแสดงในทำรายการด่วน
            </Text>

            <View style={styles.availableActionsGrid}>
              {availableActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.availableActionItem,
                    visibleActions.some(a => a.id === action.id) && styles.availableActionItemSelected
                  ]}
                  onPress={() => {
                    // Toggle action selection
                    const isSelected = visibleActions.some(a => a.id === action.id);
                    let newActions: QuickAction[];

                    if (isSelected) {
                      newActions = visibleActions.filter(a => a.id !== action.id);
                    } else {
                      newActions = [...visibleActions, action];
                    }

                    onCustomizeActions?.(newActions.filter(a => a.isCustom));
                  }}
                >
                  <Text style={styles.availableActionIcon}>{action.icon}</Text>
                  <Text style={styles.availableActionName}>{action.name}</Text>
                  {visibleActions.some(a => a.id === action.id) && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="เสร็จสิ้น"
              onPress={() => setShowCustomizeModal(false)}
              variant="primary"
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },

  // Smart Actions
  smartActionsCard: {
    backgroundColor: colors.primary + '05',
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },

  // Quick Actions
  quickActionsCard: {},
  quickActionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.semibold,
  },
  customizeButton: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.background.tertiary,
  },

  // Action Grid
  actionGrid: {},
  gridTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionsContainerHorizontal: {
    flexWrap: 'nowrap',
  },
  horizontalContainer: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },

  // Quick Action Button
  quickActionButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: (width - spacing.md * 3 - spacing.sm * 2) / 3,
    minHeight: 100,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionButtonExecuting: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionIconText: {
    fontSize: 20,
  },
  quickActionName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 16,
  },
  quickActionShortcut: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  availableActionsGrid: {
    gap: spacing.sm,
  },
  availableActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.md,
  },
  availableActionItemSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  availableActionIcon: {
    fontSize: 24,
  },
  availableActionName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  modalActions: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});

export default QuickActions;