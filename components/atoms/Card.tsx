import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { haptic } from '../../core/haptics';
import { colors, radius, shadows, getSpacing } from '../../core/theme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'flat';
  style?: ViewStyle;
  padding?: number;
  hapticFeedback?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  style,
  padding = getSpacing(4),
  hapticFeedback = true,
}) => {
  const handlePress = async () => {
    if (!onPress) return;

    if (hapticFeedback) {
      await haptic('light');
    }

    onPress();
  };

  const cardStyles = [
    styles.base,
    styles[variant],
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
  },
  default: {
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  elevated: {
    borderWidth: 0,
    ...shadows.md,
  },
  flat: {
    borderWidth: 1,
    borderColor: colors.border.light,
  },
});

export default Card;