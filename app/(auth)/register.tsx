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
  User,
  Phone,
  ArrowRight,
  Leaf,
  Check,
} from 'lucide-react-native';
import { Card } from '../../components/atoms/Card';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { radius, typography } from '../../core/theme';
import { useHaptic } from '../../core/haptics';
import { useAuthStore } from '../../stores/authStore';
import type { AuthError } from '../../types/auth';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
}

const experienceLevels = [
  { value: 'beginner', label: 'มือใหม่', description: 'เพิ่งเริ่มสนใจปลูกต้นไม้' },
  { value: 'intermediate', label: 'มีประสบการณ์', description: 'เคยปลูกต้นไม้มาบ้างแล้ว' },
  { value: 'expert', label: 'ผู้เชี่ยวชาญ', description: 'มีประสบการณ์ปลูกต้นไม้มาหลายปี' },
] as const;

const RegisterScreen: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hapticController = useHaptic();

  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptPrivacy: false,
    experienceLevel: 'beginner',
  });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterForm>>({});
  const signUp = useAuthStore((state) => state.signUp);
  const authIsLoading = useAuthStore((state) => state.isLoading);
  const isProcessing = isLoading || authIsLoading;

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<RegisterForm> = {};

    if (!form.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อ';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    if (!form.email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (form.phone && !/^[0-9+\-\(\)\s]{10,15}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง';
    }

    if (!form.password.trim()) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (form.password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = 'รหัสผ่านต้องมีตัวพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข';
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    if (!form.acceptTerms) {
      Alert.alert('ข้อกำหนดการใช้งาน', 'กรุณายอมรับข้อกำหนดการใช้งาน');
      return false;
    }

    if (!form.acceptPrivacy) {
      Alert.alert('นโยบายความเป็นส่วนตัว', 'กรุณายอมรับนโยบายความเป็นส่วนตัว');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleInputChange = useCallback((field: keyof RegisterForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as keyof RegisterForm]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleRegister = useCallback(async () => {
    try {
      hapticController.selection();

      if (!validateForm()) {
        hapticController.error();
        return;
      }

      setIsLoading(true);

      await signUp({
        provider: 'email',
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        acceptTerms: form.acceptTerms && form.acceptPrivacy,
        profile: {
          displayName: form.name.trim(),
          experienceLevel: form.experienceLevel,
        },
      });

      hapticController.success();
      Alert.alert(
        'สมัครสมาชิกสำเร็จ',
        'ยินดีต้อนรับสู่ Smart Plant AI',
        [
          {
            text: 'เริ่มต้นใช้งาน',
            onPress: () => router.replace('/(tabs)/garden'),
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      hapticController.error();
      const authError = error as AuthError;
      Alert.alert(
        'สมัครสมาชิกไม่สำเร็จ',
        authError?.message ?? 'กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง',
        [{ text: 'ตกลง', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [form, validateForm, router, hapticController]);

  const handleSocialRegister = useCallback((provider: 'google' | 'apple' | 'facebook') => {
    hapticController.selection();
    // TODO: Implement social registration
    console.log(`Social register with ${provider}`);
  }, [hapticController]);

  const togglePasswordVisibility = useCallback((field: 'password' | 'confirmPassword') => {
    hapticController.selection();
    if (field === 'password') {
      setIsPasswordVisible(prev => !prev);
    } else {
      setIsConfirmPasswordVisible(prev => !prev);
    }
  }, [hapticController]);

  const handleExperienceLevelSelect = useCallback((level: RegisterForm['experienceLevel']) => {
    hapticController.selection();
    handleInputChange('experienceLevel', level);
  }, [hapticController, handleInputChange]);

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
            <Text style={styles.title}>เริ่มต้นการเดินทาง</Text>
            <Text style={styles.subtitle}>สร้างบัญชีเพื่อดูแลสวนในฝัน</Text>
          </View>

          {/* Registration Form */}
          <Card variant="elevated" style={styles.formCard} shadowLevel="lg">
            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ชื่อ - นามสกุล</Text>
                <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                  <User size={20} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="กรอกชื่อ - นามสกุลของคุณ"
                    placeholderTextColor={theme.colors.text.placeholder}
                    value={form.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="name"
                    editable={!isProcessing}
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

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
                    editable={!isProcessing}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Phone Input (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>เบอร์โทรศัพท์ (ไม่บังคับ)</Text>
                <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                  <Phone size={20} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="กรอกเบอร์โทรศัพท์ของคุณ"
                    placeholderTextColor={theme.colors.text.placeholder}
                    value={form.phone}
                    onChangeText={(text) => handleInputChange('phone', text)}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    editable={!isProcessing}
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              {/* Experience Level */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ระดับประสบการณ์</Text>
                <View style={styles.experienceContainer}>
                  {experienceLevels.map((level) => (
                    <Pressable
                      key={level.value}
                      style={[
                        styles.experienceOption,
                        form.experienceLevel === level.value && styles.experienceOptionActive,
                      ]}
                      onPress={() => handleExperienceLevelSelect(level.value)}
                      disabled={isProcessing}
                    >
                      <View style={styles.experienceContent}>
                        <Text style={[
                          styles.experienceLabel,
                          form.experienceLevel === level.value && styles.experienceLabelActive,
                        ]}>
                          {level.label}
                        </Text>
                        <Text style={styles.experienceDescription}>{level.description}</Text>
                      </View>
                      {form.experienceLevel === level.value && (
                        <Check size={20} color={theme.colors.primary} />
                      )}
                    </Pressable>
                  ))}
                </View>
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
                    autoComplete="new-password"
                    editable={!isProcessing}
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('password')}
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

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ยืนยันรหัสผ่าน</Text>
                <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                  <Lock size={20} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="ยืนยันรหัสผ่านของคุณ"
                    placeholderTextColor={theme.colors.text.placeholder}
                    value={form.confirmPassword}
                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                    secureTextEntry={!isConfirmPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    editable={!isProcessing}
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility('confirmPassword')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {isConfirmPasswordVisible ? (
                      <EyeOff size={20} color={theme.colors.text.tertiary} />
                    ) : (
                      <Eye size={20} color={theme.colors.text.tertiary} />
                    )}
                  </Pressable>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>

              {/* Terms and Privacy */}
              <View style={styles.agreementSection}>
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => handleInputChange('acceptTerms', !form.acceptTerms)}
                  disabled={isProcessing}
                >
                  <View style={[styles.checkbox, form.acceptTerms && styles.checkboxChecked]}>
                    {form.acceptTerms && <Check size={16} color={theme.colors.white} />}
                  </View>
                  <Text style={styles.checkboxText}>
                    ยอมรับ <Text style={styles.linkText}>ข้อกำหนดการใช้งาน</Text>
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => handleInputChange('acceptPrivacy', !form.acceptPrivacy)}
                  disabled={isProcessing}
                >
                  <View style={[styles.checkbox, form.acceptPrivacy && styles.checkboxChecked]}>
                    {form.acceptPrivacy && <Check size={16} color={theme.colors.white} />}
                  </View>
                  <Text style={styles.checkboxText}>
                    ยอมรับ <Text style={styles.linkText}>นโยบายความเป็นส่วนตัว</Text>
                  </Text>
                </Pressable>
              </View>

              {/* Register Button */}
              <Pressable
                style={[
                  styles.registerButton,
                  isProcessing && styles.registerButtonLoading,
                ]}
                onPress={handleRegister}
                disabled={isProcessing}
              >
                <Text style={styles.registerButtonText}>
                  {isProcessing ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                </Text>
                {!isProcessing && (
                  <ArrowRight size={20} color={theme.colors.white} style={styles.registerButtonIcon} />
                )}
              </Pressable>
            </View>
          </Card>

          {/* Social Registration Section */}
          <View style={styles.socialSection}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>หรือสมัครด้วย</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <Pressable
                style={styles.socialButton}
                onPress={() => handleSocialRegister('google')}
                disabled={isProcessing}
              >
                <Text style={styles.socialButtonText}>🔍 Google</Text>
              </Pressable>

              <Pressable
                style={styles.socialButton}
                onPress={() => handleSocialRegister('apple')}
                disabled={isProcessing}
              >
                <Text style={styles.socialButtonText}>🍎 Apple</Text>
              </Pressable>

              <Pressable
                style={styles.socialButton}
                onPress={() => handleSocialRegister('facebook')}
                disabled={isProcessing}
              >
                <Text style={styles.socialButtonText}>📘 Facebook</Text>
              </Pressable>
            </View>
          </View>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>มีบัญชีอยู่แล้ว? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={styles.signInLink}>เข้าสู่ระบบ</Text>
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
    experienceContainer: {
      gap: theme.spacing(2),
    },
    experienceOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing(3),
      backgroundColor: theme.colors.surface.secondary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.divider,
    },
    experienceOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    experienceContent: {
      flex: 1,
    },
    experienceLabel: {
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.medium,
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    experienceLabelActive: {
      color: theme.colors.primary,
    },
    experienceDescription: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    agreementSection: {
      gap: theme.spacing(3),
      marginTop: theme.spacing(2),
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.colors.divider,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing(3),
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    checkboxText: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      lineHeight: 20,
    },
    linkText: {
      color: theme.colors.primary,
      fontFamily: typography.fontFamily.medium,
    },
    registerButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: radius.lg,
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing(2),
    },
    registerButtonLoading: {
      opacity: 0.7,
    },
    registerButtonText: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.semibold,
      color: theme.colors.white,
    },
    registerButtonIcon: {
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
    signInContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    signInText: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.secondary,
    },
    signInLink: {
      fontSize: typography.fontSize.base,
      color: theme.colors.primary,
      fontFamily: typography.fontFamily.semibold,
    },
  });

export default RegisterScreen;
