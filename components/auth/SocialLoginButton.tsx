import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { radius, typography } from '../../core/theme';
import type { AuthProvider } from '../../types/auth';

interface SocialLoginButtonProps {
  provider: AuthProvider;
  onPress: (provider: AuthProvider) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'compact';
}

const providerConfig = {
  google: {
    icon: '🔍',
    name: 'Google',
    color: '#DB4437',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
  },
  apple: {
    icon: '🍎',
    name: 'Apple',
    color: '#000000',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
  },
  facebook: {
    icon: '📘',
    name: 'Facebook',
    color: '#1877F2',
    backgroundColor: '#1877F2',
    textColor: '#FFFFFF',
  },
  email: {
    icon: '📧',
    name: 'Email',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    textColor: '#1F2937',
  },
  phone: {
    icon: '📱',
    name: 'Phone',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    textColor: '#065F46',
  },
} as const;

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onPress,
  disabled = false,
  loading = false,
  variant = 'default',
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, variant), [theme, variant]);

  const config = providerConfig[provider];
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (!isDisabled) {
      onPress(provider);
    }
  };

  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: config.backgroundColor },
        isDisabled && styles.buttonDisabled,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      android_ripple={{
        color: theme.colors.background.overlayLight,
        borderless: false,
      }}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={config.textColor}
            style={styles.loader}
          />
        ) : (
          <Text style={[styles.icon, { color: config.color }]}>
            {config.icon}
          </Text>
        )}

        <Text
          style={[
            styles.text,
            { color: config.textColor },
            isDisabled && styles.textDisabled,
          ]}
        >
          {variant === 'compact' ? config.name : `ดำเนินการด้วย ${config.name}`}
        </Text>
      </View>
    </Pressable>
  );
};

const createStyles = (theme: Theme, variant: 'default' | 'compact') =>
  StyleSheet.create({
    button: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      height: variant === 'compact' ? 44 : 56,
      shadowColor: theme.colors.black,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing(4),
    },
    icon: {
      fontSize: variant === 'compact' ? 16 : 20,
      marginRight: theme.spacing(2.5),
    },
    loader: {
      marginRight: theme.spacing(2.5),
    },
    text: {
      fontSize: variant === 'compact' ? typography.fontSize.sm : typography.fontSize.base,
      fontFamily: typography.fontFamily.medium,
      textAlign: 'center',
    },
    textDisabled: {
      opacity: 0.7,
    },
  });

interface SocialLoginGroupProps {
  providers: AuthProvider[];
  onProviderPress: (provider: AuthProvider) => void;
  loadingProvider?: AuthProvider | null;
  disabled?: boolean;
  variant?: 'default' | 'compact';
  layout?: 'vertical' | 'horizontal';
}

export const SocialLoginGroup: React.FC<SocialLoginGroupProps> = ({
  providers,
  onProviderPress,
  loadingProvider = null,
  disabled = false,
  variant = 'default',
  layout = 'vertical',
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createGroupStyles(theme, layout), [theme, layout]);

  return (
    <View style={styles.container}>
      {providers.map((provider) => (
        <SocialLoginButton
          key={provider}
          provider={provider}
          onPress={onProviderPress}
          disabled={disabled}
          loading={loadingProvider === provider}
          variant={variant}
        />
      ))}
    </View>
  );
};

const createGroupStyles = (theme: Theme, layout: 'vertical' | 'horizontal') =>
  StyleSheet.create({
    container: {
      flexDirection: layout === 'horizontal' ? 'row' : 'column',
      gap: theme.spacing(3),
      ...(layout === 'horizontal' && {
        flexWrap: 'wrap',
      }),
    },
  });

interface SocialLoginDividerProps {
  text?: string;
}

export const SocialLoginDivider: React.FC<SocialLoginDividerProps> = ({
  text = 'หรือ',
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createDividerStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
};

const createDividerStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing(4),
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.divider,
    },
    text: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.tertiary,
      paddingHorizontal: theme.spacing(3),
      fontFamily: typography.fontFamily.medium,
      backgroundColor: theme.colors.background.primary,
    },
  });

export default SocialLoginButton;