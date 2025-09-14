import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { haptic } from '../../core/haptics';
import { colors, typography, getSpacing } from '../../core/theme';

export interface SectionProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onRightPress?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  showDivider?: boolean;
}

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  rightElement,
  onRightPress,
  children,
  style,
  titleStyle,
  subtitleStyle,
  showDivider = false,
}) => {
  const handleRightPress = async () => {
    if (!onRightPress) return;

    await haptic('light');
    onRightPress();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, titleStyle]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
          )}
        </View>

        {rightElement && (
          onRightPress ? (
            <TouchableOpacity onPress={handleRightPress} style={styles.rightButton}>
              {rightElement}
            </TouchableOpacity>
          ) : (
            <View style={styles.rightElement}>
              {rightElement}
            </View>
          )
        )}
      </View>

      {showDivider && <View style={styles.divider} />}

      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: getSpacing(2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing(1),
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.tight * typography.fontSize.lg,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    marginTop: getSpacing(0.5),
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  rightButton: {
    padding: getSpacing(1),
    marginLeft: getSpacing(2),
  },
  rightElement: {
    marginLeft: getSpacing(2),
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: getSpacing(2),
  },
  content: {
    marginTop: getSpacing(2),
  },
});

export default Section;
