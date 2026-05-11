import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
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
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', data);
      await setToken(res.data.token);
      await setCurrentUser(res.data.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error ?? 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.appName}>SecondHand</Text>
        <Text style={styles.subtitle}>Chulalongkorn University Marketplace</Text>

        <Text style={styles.label}>Email</Text>
        <Controller
          control={control}
          name="email"
          rules={{ required: 'Email is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
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
          rules={{ required: 'Password is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={value}
              onChangeText={onChange}
              placeholder="••••••••"
              secureTextEntry
            />
          )}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

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
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
  appName: { fontSize: Typography['3xl'], fontWeight: '800', color: Colors.primary, textAlign: 'center', marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl * 1.5 },
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
