import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, typography, radius, spacing } from '../../core/theme';
import { useHaptic } from '../../core/haptics';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
  icon?: LucideIcon;
  image?: ImageSourcePropType;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'subtle' | 'bordered';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  image,
  title,
  description,
  action,
  secondaryAction,
  style,
  size = 'medium',
  variant = 'default',
}) => {
  const haptic = useHaptic();

  const handleActionPress = (actionFn: () => void, actionVariant: 'primary' | 'secondary' = 'primary') => {
    haptic.buttonPress(actionVariant);
    actionFn();
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 48,
          spacing: spacing[4],
          titleSize: typography.fontSize.lg,
          descriptionSize: typography.fontSize.sm,
          paddingVertical: spacing[6],
        };
      case 'large':
        return {
          iconSize: 80,
          spacing: spacing[8],
          titleSize: typography.fontSize['2xl'],
          descriptionSize: typography.fontSize.base,
          paddingVertical: spacing[12],
        };
      default: // medium
        return {
          iconSize: 64,
          spacing: spacing[6],
          titleSize: typography.fontSize.xl,
          descriptionSize: typography.fontSize.base,
          paddingVertical: spacing[8],
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'subtle':
        return {
          backgroundColor: colors.background.secondary,
          borderColor: 'transparent',
        };
      case 'bordered':
        return {
          backgroundColor: colors.white,
          borderColor: colors.border.light,
          borderWidth: 1,
          borderStyle: 'dashed' as const,
        };
      default:
        return {
          backgroundColor: colors.white,
          borderColor: 'transparent',
        };
    }
  };

  const sizeConfig = getSizeConfig();
  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.container, variantStyles, { paddingVertical: sizeConfig.paddingVertical }, style]}>
      {/* Icon or Image */}
      <View style={[styles.iconContainer, { marginBottom: sizeConfig.spacing }]}>
        {image ? (
          <Image source={image} style={[styles.image, { width: sizeConfig.iconSize, height: sizeConfig.iconSize }]} />
        ) : Icon ? (
          <View
            style={[
              styles.iconWrapper,
              {
                width: sizeConfig.iconSize,
                height: sizeConfig.iconSize,
                borderRadius: sizeConfig.iconSize / 2,
              },
            ]}
          >
            <Icon
              size={sizeConfig.iconSize * 0.5}
              color={colors.gray[400]}
              strokeWidth={1.5}
            />
          </View>
        ) : null}
      </View>

      {/* Title */}
      <Text
        style={[
          styles.title,
          {
            fontSize: sizeConfig.titleSize,
            marginBottom: description ? spacing[2] : sizeConfig.spacing,
          },
        ]}
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          style={[
            styles.description,
            {
              fontSize: sizeConfig.descriptionSize,
              marginBottom: sizeConfig.spacing,
            },
          ]}
        >
          {description}
        </Text>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <View style={styles.actionsContainer}>
          {action && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.primaryButton,
                secondaryAction && styles.actionButtonWithMargin,
              ]}
              onPress={() => handleActionPress(action.onPress, action.variant)}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{action.label}</Text>
            </TouchableOpacity>
          )}

          {secondaryAction && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleActionPress(secondaryAction.onPress, secondaryAction.variant)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    borderRadius: radius.lg,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: radius.lg,
    opacity: 0.8,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.tight,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontWeight: typography.fontWeight.normal as any,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal,
    maxWidth: 280,
  },
  actionsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
  },
  actionButton: {
    width: '100%',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  actionButtonWithMargin: {
    marginBottom: spacing[3],
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
  },
});

export default EmptyState;