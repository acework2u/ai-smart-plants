import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { PlantStatus } from '../../types/garden';
import { haptic } from '../../core/haptics';
import { colors, getSpacing, radius, spacing, typography, themeUtils } from '../../core/theme';

export interface ChipProps {
  label: string;
  status?: PlantStatus;
  variant?: 'status' | 'filter' | 'action';
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export const Chip: React.FC<ChipProps> = ({
  label,
  status,
  variant = 'filter',
  selected = false,
  onPress,
  style,
  textStyle,
  size = 'md',
}) => {
  const handlePress = async () => {
    if (!onPress) return;

    await haptic('selection');
    onPress();
  };

  const getStatusColors = () => {
    if (!status) return { background: colors.gray[100], text: colors.text.primary };

    const statusColor = themeUtils.getStatusColor(status);
    return {
      background: themeUtils.withOpacity(statusColor, 0.15),
      text: statusColor,
    };
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'status':
        const statusColors = getStatusColors();
        return {
          backgroundColor: statusColors.background,
          color: statusColors.text,
        };

      case 'filter':
        return selected
          ? {
              backgroundColor: colors.primary,
              color: colors.white,
            }
          : {
              backgroundColor: colors.gray[100],
              color: colors.text.secondary,
            };

      case 'action':
        return {
          backgroundColor: colors.primarySoft,
          color: colors.primary,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const chipStyles = [
    styles.base,
    styles[size],
    {
      backgroundColor: variantStyles.backgroundColor,
    },
    style,
  ];

  const chipTextStyles = [
    styles.text,
    styles[`${size}Text`],
    {
      color: variantStyles.color,
    },
    textStyle,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={chipStyles}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={chipTextStyles}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={chipStyles}>
      <Text style={chipTextStyles}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  // Sizes
  sm: {
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1),
    minHeight: 24,
  },
  md: {
    paddingHorizontal: getSpacing(3),
    paddingVertical: getSpacing(1.5),
    minHeight: 32,
  },
  lg: {
    paddingHorizontal: getSpacing(4),
    paddingVertical: getSpacing(2),
    minHeight: 40,
  },

  // Text styles
  text: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  smText: {
    fontSize: typography.fontSize.xs,
  },
  mdText: {
    fontSize: typography.fontSize.sm,
  },
  lgText: {
    fontSize: typography.fontSize.base,
  },
});

export default Chip;