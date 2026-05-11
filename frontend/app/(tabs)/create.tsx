import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import api from '../../lib/api';
import ListingForm, { ListingFormValues } from '../../components/ListingForm';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

export default function CreateScreen() {
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (values: ListingFormValues, newImages: { uri: string; name: string; type: string }[]) => {
    try {
      const form = new FormData();
      form.append('title', values.title);
      form.append('description', values.description);
      form.append('price', values.price);
      form.append('category', values.category);
      form.append('item_condition', values.item_condition);
      for (const img of newImages) {
        if (Platform.OS === 'web') {
          const res = await fetch(img.uri);
          const blob = await res.blob();
          form.append('images[]', new File([blob], img.name, { type: img.type }));
        } else {
          form.append('images[]', { uri: img.uri, name: img.name, type: img.type } as any);
        }
      }
      await api.post('/api/listings', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.errors ?? 'Failed to post listing. Please try again.';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Listing Posted!</Text>
        <Text style={styles.successSub}>Your item is now live on the marketplace.</Text>
        <TouchableOpacity style={styles.successBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.successBtnText}>Back to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.successBtnOutline} onPress={() => setSuccess(false)}>
          <Text style={styles.successBtnOutlineText}>Post Another</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post a Listing</Text>
      <ListingForm onSubmit={handleSubmit} submitLabel="Post Listing" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: Typography.xl, fontWeight: '700', color: Colors.text, padding: Spacing.md, paddingTop: 56 },
  successContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { fontSize: 64, color: Colors.primary, marginBottom: Spacing.md },
  successTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  successSub: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  successBtn: { width: '100%', backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm },
  successBtnText: { color: Colors.surface, fontSize: Typography.base, fontWeight: '700' },
  successBtnOutline: { width: '100%', borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  successBtnOutlineText: { color: Colors.primary, fontSize: Typography.base, fontWeight: '600' },
});
