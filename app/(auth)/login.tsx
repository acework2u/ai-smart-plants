import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Leaf,
} from 'lucide-react-native';
import { Card } from '../../components/atoms/Card';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { radius, typography } from '../../core/theme';
import { useHaptic } from '../../core/haptics';
import { GoogleOAuthProvider } from '../../services/auth/GoogleOAuthProvider';
import { AppleOAuthProvider } from '../../services/auth/AppleOAuthProvider';
import { FacebookOAuthProvider } from '../../services/auth/FacebookOAuthProvider';
import { useAuthStore } from '../../stores/authStore';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hapticController = useHaptic();
  const { signIn, setSession } = useAuthStore();

  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginForm>>({});

  // Check Apple Sign In availability
  React.useEffect(() => {
    AppleOAuthProvider.isAvailable().then(setIsAppleAvailable);
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<LoginForm> = {};

    if (!form.email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (!form.password.trim()) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (form.password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleInputChange = useCallback((field: keyof LoginForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as keyof LoginForm]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleLogin = useCallback(async () => {
    try {
      hapticController.selection();

      if (!validateForm()) {
        hapticController.error();
        return;
      }

      setIsLoading(true);

      // TODO: Implement actual login logic
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      hapticController.success();
      router.replace('/(tabs)/garden');
    } catch (error) {
      console.error('Login error:', error);
      hapticController.error();
      Alert.alert(
        'เข้าสู่ระบบไม่สำเร็จ',
        'กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง',
        [{ text: 'ตกลง', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [form, validateForm, router, hapticController]);

  const handleSocialLogin = useCallback(async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      hapticController.selection();
      setIsLoading(true);

      let session;

      switch (provider) {
        case 'google':
          const googleProvider = GoogleOAuthProvider.getInstance();
          if (!googleProvider.isEnabled) {
            throw new Error('Google OAuth is not configured');
          }
          session = await googleProvider.signIn();
          break;

        case 'apple':
          const appleProvider = AppleOAuthProvider.getInstance();
          if (!appleProvider.isEnabled) {
            throw new Error('Apple Sign In is not available on this device');
          }
          session = await appleProvider.signIn();
          break;

        case 'facebook':
          const facebookProvider = FacebookOAuthProvider.getInstance();
          if (!facebookProvider.isEnabled) {
            throw new Error('Facebook OAuth is not configured');
          }
          session = await facebookProvider.signIn();
          break;

        default:
          throw new Error('Unsupported login provider');
      }

      // Store session in auth store
      setSession(session);

      hapticController.success();
      router.replace('/(tabs)/garden');

    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      hapticController.error();

      let errorMessage = 'เข้าสู่ระบบไม่สำเร็จ';

      if (error.code === 'USER_CANCELLED') {
        return; // Don't show error for user cancellation
      } else if (error.code === 'NOT_AVAILABLE') {
        errorMessage = 'ฟีเจอร์นี้ไม่พร้อมใช้งานบนอุปกรณ์นี้';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้';
      } else if (error.message.includes('not configured')) {
        errorMessage = 'การตั้งค่าการเข้าสู่ระบบยังไม่สมบูรณ์';
      }

      Alert.alert(
        'เข้าสู่ระบบไม่สำเร็จ',
        errorMessage,
        [{ text: 'ตกลง', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [hapticController, router, setSession]);

  const togglePasswordVisibility = useCallback(() => {
    hapticController.selection();
    setIsPasswordVisible(prev => !prev);
  }, [hapticController]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Leaf size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>ยินดีต้อนรับกลับ</Text>
            <Text style={styles.subtitle}>เข้าสู่ระบบเพื่อดูแลสวนของคุณ</Text>
          </View>

          {/* Login Form */}
          <Card variant="elevated" style={styles.formCard} shadowLevel="lg">
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>อีเมล</Text>
                <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                  <Mail size={20} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="กรอกอีเมลของคุณ"
                    placeholderTextColor={theme.colors.text.placeholder}
                    value={form.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!isLoading}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>รหัสผ่าน</Text>
                <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                  <Lock size={20} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="กรอกรหัสผ่านของคุณ"
                    placeholderTextColor={theme.colors.text.placeholder}
                    value={form.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    editable={!isLoading}
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={togglePasswordVisibility}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {isPasswordVisible ? (
                      <EyeOff size={20} color={theme.colors.text.tertiary} />
                    ) : (
                      <Eye size={20} color={theme.colors.text.tertiary} />
                    )}
                  </Pressable>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {/* Forgot Password */}
              <View style={styles.forgotPasswordContainer}>
                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable>
                    <Text style={styles.forgotPasswordText}>ลืมรหัสผ่าน?</Text>
                  </Pressable>
                </Link>
              </View>

              {/* Login Button */}
              <Pressable
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonLoading,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </Text>
                {!isLoading && (
                  <ArrowRight size={20} color={theme.colors.white} style={styles.loginButtonIcon} />
                )}
              </Pressable>
            </View>
          </Card>

          {/* Social Login Section */}
          <View style={styles.socialSection}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>หรือ</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <Pressable
                style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
                onPress={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                <Text style={[styles.socialButtonText, isLoading && styles.socialButtonTextDisabled]}>
                  {isLoading ? '⏳ กำลังเข้าสู่ระบบ...' : '🔍 Google'}
                </Text>
              </Pressable>

              {isAppleAvailable && (
                <Pressable
                  style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
                  onPress={() => handleSocialLogin('apple')}
                  disabled={isLoading}
                >
                  <Text style={[styles.socialButtonText, isLoading && styles.socialButtonTextDisabled]}>
                    {isLoading ? '⏳ กำลังเข้าสู่ระบบ...' : '🍎 Apple'}
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
                onPress={() => handleSocialLogin('facebook')}
                disabled={isLoading}
              >
                <Text style={[styles.socialButtonText, isLoading && styles.socialButtonTextDisabled]}>
                  {isLoading ? '⏳ กำลังเข้าสู่ระบบ...' : '📘 Facebook'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>ยังไม่มีบัญชี? </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text style={styles.signUpLink}>สมัครสมาชิก</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing(4),
      paddingVertical: theme.spacing(6),
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing(6),
    },
    logoContainer: {
      width: 96,
      height: 96,
      borderRadius: radius.full,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing(4),
    },
    title: {
      fontSize: typography.fontSize['3xl'],
      fontFamily: typography.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing(2),
      textAlign: 'center',
    },
    subtitle: {
      fontSize: typography.fontSize.lg,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    formCard: {
      marginBottom: theme.spacing(6),
    },
    form: {
      gap: theme.spacing(4),
    },
    inputGroup: {
      gap: theme.spacing(1.5),
    },
    label: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.primary,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      paddingHorizontal: theme.spacing(3),
      height: 56,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    inputIcon: {
      marginRight: theme.spacing(2.5),
    },
    input: {
      flex: 1,
      fontSize: typography.fontSize.base,
      color: theme.colors.text.primary,
      fontFamily: typography.fontFamily.regular,
    },
    eyeButton: {
      padding: theme.spacing(1),
      marginLeft: theme.spacing(1),
    },
    errorText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.error,
      marginTop: theme.spacing(1),
    },
    forgotPasswordContainer: {
      alignItems: 'flex-end',
      marginTop: -theme.spacing(2),
    },
    forgotPasswordText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.primary,
      fontFamily: typography.fontFamily.medium,
    },
    loginButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: radius.lg,
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing(2),
    },
    loginButtonLoading: {
      opacity: 0.7,
    },
    loginButtonText: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.white,
    },
    loginButtonIcon: {
      marginLeft: theme.spacing(2),
    },
    socialSection: {
      marginBottom: theme.spacing(6),
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing(4),
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.divider,
    },
    dividerText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.tertiary,
      paddingHorizontal: theme.spacing(3),
      fontFamily: typography.fontFamily.medium,
    },
    socialButtons: {
      gap: theme.spacing(3),
    },
    socialButton: {
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: radius.lg,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.divider,
    },
    socialButtonText: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.primary,
    },
    socialButtonDisabled: {
      opacity: 0.6,
    },
    socialButtonTextDisabled: {
      color: theme.colors.text.tertiary,
    },
    signUpContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    signUpText: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.secondary,
    },
    signUpLink: {
      fontSize: typography.fontSize.base,
      color: theme.colors.primary,
      fontFamily: typography.fontFamily.semibold,
    },
  });

export default LoginScreen;