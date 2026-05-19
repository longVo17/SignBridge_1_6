import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';
import { useAuth } from '../hooks/useAuth';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { login, register, loading, error, clearError } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    if (mode === 'register' && !displayName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên hiển thị.');
      return;
    }

    clearError();
    if (mode === 'login') {
      await login(email.trim(), password);
    } else {
      await register(email.trim(), password, displayName.trim());
    }
  };

  const toggleMode = () => {
    clearError();
    setMode(mode === 'login' ? 'register' : 'login');
    setDisplayName('');
    setEmail('');
    setPassword('');
  };

  return (
    <LinearGradient colors={['#E0F7FF', '#F0F9FF', '#FFFFFF']} style={styles.container}>
      {/* Decorative blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animatable.View animation="fadeInDown" delay={100} style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🤟</Text>
            </View>
            <Text style={styles.brandName}>SignBridge</Text>
            <Text style={styles.tagline}>Your ASL Journey Starts Here</Text>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={200} style={styles.formCard}>
            <BlurView intensity={80} tint="light" style={styles.blurCard}>
              <View style={styles.formInner}>
                <Text style={styles.formTitle}>
                  {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                </Text>

                {/* Error message */}
                {error && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Display Name — only for register */}
                {mode === 'register' && (
                  <View style={[styles.inputWrapper, nameFocused && styles.inputFocused]}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={nameFocused ? COLORS.primary : COLORS.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Tên hiển thị"
                      placeholderTextColor={COLORS.textSecondary}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                    />
                  </View>
                )}

                {/* Email */}
                <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={emailFocused ? COLORS.primary : COLORS.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={COLORS.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>

                {/* Password */}
                <View style={[styles.inputWrapper, passFocused && styles.inputFocused]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={passFocused ? COLORS.primary : COLORS.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Mật khẩu (ít nhất 6 ký tự)"
                    placeholderTextColor={COLORS.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ paddingRight: SPACING.sm }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSubmit}
                  disabled={loading}
                  style={{ marginTop: SPACING.sm }}
                >
                  <LinearGradient
                    colors={loading ? ['#A8D5E8', '#A8D5E8'] : ['#2DC7FF', '#00A3E0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitButton}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.submitButtonText}>
                          {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color="#FFFFFF"
                          style={{ marginLeft: 8 }}
                        />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Toggle mode */}
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleBase}>
                    {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                  </Text>
                  <TouchableOpacity onPress={toggleMode}>
                    <Text style={styles.toggleLink}>
                      {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </Animatable.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  blobTopRight: {
    position: 'absolute',
    top: -80, right: -80,
    width: 250, height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(45, 199, 255, 0.15)',
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -60, left: -60,
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(45, 199, 255, 0.1)',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(45,199,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(45,199,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logoEmoji: { fontSize: 38 },
  brandName: {
    ...TYPOGRAPHY.headlineLarge,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  formCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.glass,
  },
  blurCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
  },
  formInner: { padding: SPACING.lg },
  formTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    gap: 6,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#DC2626',
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(45,199,255,0.05)',
  },
  inputIcon: { paddingHorizontal: SPACING.md },
  input: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    flex: 1,
  },
  submitButton: {
    borderRadius: BORDER_RADIUS.pill,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 54,
    ...SHADOWS.glass,
  },
  submitButtonText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFFFFF',
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  toggleBase: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  toggleLink: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.primary,
  },
});
