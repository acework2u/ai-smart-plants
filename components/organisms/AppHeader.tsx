import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors, typography, spacing, sizes } from '../../core/theme';
import { useHaptic } from '../../core/haptics';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  variant?: 'default' | 'large' | 'minimal';
  style?: ViewStyle;
  transparent?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightComponent,
  leftComponent,
  backgroundColor = colors.white,
  titleColor = colors.text.primary,
  variant = 'default',
  style,
  transparent = false,
}) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();

  const handleBackPress = () => {
    if (onBack) {
      haptic.trigger('light');
      onBack();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'large':
        return {
          paddingBottom: spacing[6],
          titleFontSize: typography.fontSize['3xl'],
          subtitleFontSize: typography.fontSize.lg,
          titleMarginBottom: subtitle ? spacing[1] : 0,
        };
      case 'minimal':
        return {
          paddingBottom: spacing[2],
          titleFontSize: typography.fontSize.lg,
          subtitleFontSize: typography.fontSize.base,
          titleMarginBottom: subtitle ? spacing[1] / 2 : 0,
        };
      default:
        return {
          paddingBottom: spacing[4],
          titleFontSize: typography.fontSize.xl,
          subtitleFontSize: typography.fontSize.base,
          titleMarginBottom: subtitle ? spacing[1] : 0,
        };
    }
  };

  const variantConfig = getVariantStyles();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  return (
    <>
      <StatusBar
        barStyle={transparent || backgroundColor === colors.white ? 'dark-content' : 'light-content'}
        backgroundColor={transparent ? 'transparent' : backgroundColor}
        translucent={transparent}
      />
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + statusBarHeight,
            backgroundColor: transparent ? 'transparent' : backgroundColor,
            paddingBottom: variantConfig.paddingBottom,
          },
          style,
        ]}
      >
        <View style={styles.header}>
          {/* Left Section */}
          <View style={styles.leftSection}>
            {leftComponent ? (
              leftComponent
            ) : showBack ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ArrowLeft
                  size={sizes.icon.md}
                  color={titleColor}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholder} />
            )}
          </View>

          {/* Center Section */}
          <View style={styles.centerSection}>
            {title && (
              <Text
                style={[
                  styles.title,
                  {
                    fontSize: variantConfig.titleFontSize,
                    color: titleColor,
                    marginBottom: variantConfig.titleMarginBottom,
                  },
                ]}
                numberOfLines={variant === 'large' ? 2 : 1}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  {
                    fontSize: variantConfig.subtitleFontSize,
                    color: titleColor === colors.text.primary ? colors.text.secondary : `${titleColor}CC`,
                  },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {/* Right Section */}
          <View style={styles.rightSection}>
            {rightComponent || <View style={styles.placeholder} />}
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftSection: {
    flex: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minWidth: 44,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
  },
  rightSection: {
    flex: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 44,
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2], // Compensate for padding to align with screen edge
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.fontWeight.semibold as any,
    textAlign: 'center',
    lineHeight: typography.lineHeight.tight,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontWeight: typography.fontWeight.normal as any,
    textAlign: 'center',
    lineHeight: typography.lineHeight.tight,
  },
  placeholder: {
    width: 44,
    height: 44,
  },
});

export default AppHeader;