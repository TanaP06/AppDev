import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../../lib/api';
import { Listing } from '../../../lib/types';
import ListingForm, { ListingFormValues } from '../../../components/ListingForm';
import { Colors, Spacing, Typography, Radius } from '../../../constants/theme';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get<Listing>(`/api/listings/${id}`)
      .then((r) => setListing(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (
    values: ListingFormValues,
    newImages: { uri: string; name: string; type: string }[],
    removeImageIds: number[]
  ) => {
    const form = new FormData();
    form.append('title', values.title);
    form.append('description', values.description);
    form.append('price', values.price);
    form.append('category', values.category);
    form.append('item_condition', values.item_condition);
    for (const rid of removeImageIds) {
      form.append('remove_image_ids', String(rid));
    }
    for (const img of newImages) {
      form.append('images[]', { uri: img.uri, name: img.name, type: img.type } as any);
    }
    await api.put(`/api/listings/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    setSuccess(true);
  };

  const handleToggleSold = async () => {
    if (!listing) return;
    const newStatus = !listing.is_sold;
    try {
      await api.patch(`/api/listings/${id}/sold`, { is_sold: newStatus });
      setListing({ ...listing, is_sold: newStatus });
      Alert.alert('Success', newStatus ? 'Item marked as sold!' : 'Item is active again!');
    } catch (err) {
      Alert.alert('Error', 'Could not update status');
    }
  };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 80 }} />;
  if (!listing) return <Text style={{ margin: Spacing.xl, color: Colors.error }}>Listing not found.</Text>;

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Changes Saved!</Text>
        <Text style={styles.successSub}>Your listing has been updated successfully.</Text>
        <TouchableOpacity style={styles.successBtn} onPress={() => router.back()}>
          <Text style={styles.successBtnText}>View Listing</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.successBtnOutline} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.successBtnOutlineText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: listing.is_sold ? Colors.surface : Colors.primaryLight, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <Text style={{ color: listing.is_sold ? Colors.text : Colors.primaryDark, fontWeight: '600', flex: 1 }}>
          {listing.is_sold ? "This item is currently marked as sold." : "Has this item been sold?"}
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: listing.is_sold ? Colors.surface : Colors.primary, borderWidth: listing.is_sold ? 1 : 0, borderColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full }}
          onPress={handleToggleSold}
        >
          <Text style={{ color: listing.is_sold ? Colors.primary : Colors.surface, fontWeight: '700', fontSize: Typography.sm }}>
            {listing.is_sold ? "Undo Sold" : "Mark as Sold"}
          </Text>
        </TouchableOpacity>
      </View>
      <ListingForm
        defaultValues={{ title: listing.title, description: listing.description ?? '', price: String(listing.price), category: listing.category, item_condition: listing.item_condition }}
        existingImages={listing.images}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  successContainer: { flex: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { fontSize: 64, color: Colors.primary, marginBottom: Spacing.md },
  successTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  successSub: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  successBtn: { width: '100%', backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm },
  successBtnText: { color: Colors.surface, fontSize: Typography.base, fontWeight: '700' },
  successBtnOutline: { width: '100%', borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  successBtnOutlineText: { color: Colors.primary, fontSize: Typography.base, fontWeight: '600' },
});
