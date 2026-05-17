import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Typography, Radius } from '../constants/theme';
import { Category, Condition } from '../lib/types';

export interface ListingFormValues {
  title: string;
  description: string;
  price: string;
  category: Category;
  item_condition: Condition;
}

interface LocalImage {
  uri: string;
  name: string;
  type: string;
}

interface Props {
  defaultValues?: Partial<ListingFormValues>;
  existingImages?: string[];
  onSubmit: (values: ListingFormValues, newImages: LocalImage[], removeImageIds: number[]) => Promise<void>;
  submitLabel: string;
}

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'Books', value: 'books' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Furniture', value: 'furniture' },
  { label: 'Other', value: 'other' },
];

const CONDITIONS: { label: string; value: Condition }[] = [
  { label: 'New', value: 'new' },
  { label: 'Like New', value: 'like_new' },
  { label: 'Used', value: 'used' },
];

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

export default function ListingForm({ defaultValues, existingImages = [], onSubmit, submitLabel }: Props) {
  const [newImages, setNewImages] = useState<LocalImage[]>([]);
  const [removedImageIndices, setRemovedImageIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ListingFormValues>({
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      price: defaultValues?.price ?? '',
      category: defaultValues?.category ?? 'books',
      item_condition: defaultValues?.item_condition ?? 'used',
    },
  });

  const totalImages = existingImages.filter((_, i) => !removedImageIndices.includes(i)).length + newImages.length;

  const pickImage = async () => {
    if (totalImages >= 6) {
      Alert.alert('Maximum 6 images allowed');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const picked = result.assets.slice(0, 6 - totalImages).map((a) => ({
        uri: a.uri,
        name: a.fileName ?? `image_${Date.now()}.jpg`,
        type: a.mimeType ?? 'image/jpeg',
      }));
      setNewImages((prev) => [...prev, ...picked]);
    }
  };

  const removeNew = (idx: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExisting = (idx: number) => {
    setRemovedImageIndices((prev) => [...prev, idx]);
  };

  const submit = async (values: ListingFormValues) => {
    if (totalImages === 0) {
      Alert.alert('Please add at least one image.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(values, newImages, removedImageIndices);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Title *</Text>
      <Controller
        control={control}
        name="title"
        rules={{ required: 'Title is required', minLength: { value: 3, message: 'Min 3 characters' }, maxLength: { value: 200, message: 'Max 200 characters' } }}
        render={({ field: { onChange, value } }) => (
          <TextInput style={[styles.input, errors.title && styles.inputError]} value={value} onChangeText={onChange} placeholder="e.g. Introduction to Algorithm" placeholderTextColor={Colors.textSecondary} />
        )}
      />
      {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

      <Text style={styles.label}>Description</Text>
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <TextInput style={[styles.input, styles.textarea]} value={value} onChangeText={onChange} placeholder="Describe your item..." placeholderTextColor={Colors.textSecondary} multiline numberOfLines={4} />
        )}
      />

      <Text style={styles.label}>Price (฿) *</Text>
      <Controller
        control={control}
        name="price"
        rules={{ required: 'Price is required', validate: (v) => parseFloat(v) > 0 || 'Price must be positive' }}
        render={({ field: { onChange, value } }) => (
          <TextInput style={[styles.input, errors.price && styles.inputError]} value={value} onChangeText={onChange} placeholder="150" placeholderTextColor={Colors.textSecondary} keyboardType="numeric" />
        )}
      />
      {errors.price && <Text style={styles.errorText}>{errors.price.message}</Text>}

      <Text style={styles.label}>Category *</Text>
      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <View style={styles.segmented}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.segment, value === c.value && styles.segmentActive]}
                onPress={() => onChange(c.value)}
              >
                <Text style={[styles.segmentText, value === c.value && styles.segmentTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      <Text style={styles.label}>Condition *</Text>
      <Controller
        control={control}
        name="item_condition"
        render={({ field: { onChange, value } }) => (
          <View style={styles.segmented}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.segment, value === c.value && styles.segmentActive]}
                onPress={() => onChange(c.value)}
              >
                <Text style={[styles.segmentText, value === c.value && styles.segmentTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      <Text style={styles.label}>Images ({totalImages}/6) *</Text>
      <View style={styles.imageGrid}>
        {existingImages.map((url, i) =>
          removedImageIndices.includes(i) ? null : (
            <View key={`ex-${i}`} style={styles.thumb}>
              <Image source={{ uri: `${API_URL}${url}` }} style={styles.thumbImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeExisting(i)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )
        )}
        {newImages.map((img, i) => (
          <View key={`new-${i}`} style={styles.thumb}>
            <Image source={{ uri: img.uri }} style={styles.thumbImage} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeNew(i)}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {totalImages < 6 && (
          <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
            <Text style={styles.addImageText}>+ Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit(submit)} disabled={loading}>
        {loading ? <ActivityIndicator color={Colors.surface} /> : <Text style={styles.submitText}>{submitLabel}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 40 },
  label: { fontSize: Typography.base, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.sm, color: Colors.text },
  inputError: { borderColor: Colors.error },
  textarea: { height: 100, textAlignVertical: 'top' },
  errorText: { color: Colors.error, fontSize: Typography.xs, marginTop: 2 },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  segment: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  segmentActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  segmentText: { fontSize: Typography.sm, color: Colors.textSecondary },
  segmentTextActive: { color: Colors.surface, fontWeight: '600' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  thumb: { width: 90, height: 90, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  thumbImage: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: Colors.surface, fontSize: 10, fontWeight: '700' },
  addImageBtn: { width: 90, height: 90, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  addImageText: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center' },
  submitBtn: { marginTop: Spacing.xl, backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  submitText: { color: Colors.surface, fontSize: Typography.base, fontWeight: '700' },
});
