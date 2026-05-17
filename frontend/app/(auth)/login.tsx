import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import api from '../../lib/api';
import { setToken, setCurrentUser } from '../../lib/auth';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

interface FormValues {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setLoginError(null);
    try {
      const res = await api.post('/api/auth/login', data);
      await setToken(res.data.token);
      await setCurrentUser(res.data.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      setLoginError(err.response?.data?.error ?? 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <View style={styles.iconBg}>
            <Ionicons name="refresh" size={38} color={Colors.surface} />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.appName}>CampusLoop</Text>
            <Text style={styles.subtitle}>BUY SMART. SELL EASY. REPEAT.</Text>
          </View>
        </View>

        <Text style={styles.label}>Email</Text>
        <Controller
          control={control}
          name="email"
          rules={{ required: 'Email is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, (errors.email || loginError) && styles.inputError]}
              value={value}
              onChangeText={(val) => { setLoginError(null); onChange(val); }}
              placeholder="you@student.chula.ac.th"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

        <Text style={styles.label}>Password</Text>
        <Controller
          control={control}
          name="password"
          rules={{ required: 'Password is required' }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, (errors.password || loginError) && styles.inputError]}
                value={value}
                onChangeText={(val) => { setLoginError(null); onChange(val); }}
                placeholder="••••••••"
                placeholderTextColor={Colors.textSecondary}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.peekBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.peekText}>{showPassword ? 'Hide' : 'Peek'}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

        {loginError && <Text style={[styles.errorText, { marginTop: Spacing.md, textAlign: 'center', fontSize: Typography.sm }]}>{loginError}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.surface} /> : <Text style={styles.buttonText}>Log In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkRow}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.link}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  inner: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl * 1.5, gap: Spacing.md },
  iconBg: { backgroundColor: Colors.primary, width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTextCol: { justifyContent: 'center' },
  appName: { fontSize: 32, fontWeight: '800', color: Colors.primary, marginBottom: 2, letterSpacing: -0.5 },
  subtitle: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700', letterSpacing: 0.5 },
  label: { fontSize: Typography.base, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.sm, color: Colors.text },
  inputError: { borderColor: Colors.error },
  passwordContainer: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, paddingRight: 60 },
  peekBtn: { position: 'absolute', right: Spacing.md },
  peekText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: '600' },
  errorText: { color: Colors.error, fontSize: Typography.xs, marginTop: 2 },
  button: { marginTop: Spacing.xl, backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  buttonText: { color: Colors.surface, fontSize: Typography.base, fontWeight: '700' },
  linkRow: { marginTop: Spacing.lg, alignItems: 'center' },
  linkText: { fontSize: Typography.sm, color: Colors.textSecondary },
  link: { color: Colors.primary, fontWeight: '600' },
});
