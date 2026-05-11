import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import api from '../../lib/api';
import { setToken, setCurrentUser } from '../../lib/auth';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

interface FormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const VALID_DOMAINS = ['@student.chula.ac.th', '@chula.ac.th'];

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>();
  const watchEmail = watch('email', '');
  const isValidDomain = VALID_DOMAINS.some((d) => watchEmail.toLowerCase().endsWith(d));

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', { name: data.name, email: data.email, password: data.password });
      await setToken(res.data.token);
      await setCurrentUser(res.data.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err.response?.data?.error ?? JSON.stringify(err.response?.data?.errors ?? 'An error occurred.');
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.appName}>Create Account</Text>
        <Text style={styles.subtitle}>Join the Chula SecondHand community</Text>

        <Text style={styles.label}>Full Name</Text>
        <Controller
          control={control}
          name="name"
          rules={{ required: 'Name is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput style={[styles.input, errors.name && styles.inputError]} value={value} onChangeText={onChange} placeholder="Your full name" />
          )}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

        <Text style={styles.label}>Email</Text>
        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            validate: (v) => VALID_DOMAINS.some((d) => v.toLowerCase().endsWith(d)) || 'Must use a @chula.ac.th or @student.chula.ac.th email',
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError, value && !isValidDomain && styles.inputError]}
              value={value}
              onChangeText={onChange}
              placeholder="you@student.chula.ac.th"
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
          rules={{ required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } }}
          render={({ field: { onChange, value } }) => (
            <TextInput style={[styles.input, errors.password && styles.inputError]} value={value} onChangeText={onChange} placeholder="Minimum 8 characters" secureTextEntry />
          )}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

        <Text style={styles.label}>Confirm Password</Text>
        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: 'Please confirm your password',
            validate: (v) => v === watch('password') || 'Passwords do not match',
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput style={[styles.input, errors.confirmPassword && styles.inputError]} value={value} onChangeText={onChange} placeholder="Repeat password" secureTextEntry />
          )}
        />
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.surface} /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.linkRow}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Log In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backBtnText: { color: Colors.primary, fontSize: Typography.base, fontWeight: '600' },
  inner: { padding: Spacing.xl, paddingBottom: 40 },
  appName: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.primary, textAlign: 'center', marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  label: { fontSize: Typography.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.sm, fontSize: Typography.base, color: Colors.text },
  inputError: { borderColor: Colors.error },
  errorText: { color: Colors.error, fontSize: Typography.xs, marginTop: 2 },
  button: { marginTop: Spacing.xl, backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  buttonText: { color: Colors.surface, fontSize: Typography.base, fontWeight: '700' },
  linkRow: { marginTop: Spacing.lg, alignItems: 'center' },
  linkText: { fontSize: Typography.sm, color: Colors.textSecondary },
  link: { color: Colors.primary, fontWeight: '600' },
});
