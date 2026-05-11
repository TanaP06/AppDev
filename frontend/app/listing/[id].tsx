import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Dimensions, Platform, TextInput } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import { getCurrentUser } from '../../lib/auth';
import { Listing, User, Rating } from '../../lib/types';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

const CONDITION_LABEL: Record<string, string> = { new: 'New', like_new: 'Like New', used: 'Used' };
const CATEGORY_LABEL: Record<string, string> = { books: 'Books', electronics: 'Electronics', furniture: 'Furniture', other: 'Other' };

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [myRating, setMyRating] = useState<Rating | null | undefined>(undefined);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingText, setRatingText] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  useFocusEffect(useCallback(() => {
    Promise.all([
      api.get<Listing>(`/api/listings/${id}`),
      api.get<User>('/api/users/me').catch(() => ({ data: null })),
    ]).then(([lr, mr]) => {
      const listingData = lr.data;
      const meData = mr.data as User | null;
      setListing(listingData);
      setMe(meData);
      if (listingData.is_sold && meData && meData.id !== listingData.seller_id) {
        api.get<Rating | null>(`/api/ratings/my?listing_id=${listingData.id}`)
          .then((r) => setMyRating(r.data))
          .catch(() => setMyRating(null));
      } else {
        setMyRating(null);
      }
    }).finally(() => setLoading(false));
  }, [id]));

  const handleSubmitRating = async () => {
    if (ratingScore === 0) {
      Alert.alert('Select a rating', 'Please choose 1–5 stars.');
      return;
    }
    setRatingSubmitting(true);
    try {
      const res = await api.post<Rating>('/api/ratings', {
        listing_id: Number(id),
        score: ratingScore,
        review_text: ratingText.trim() || null,
      });
      setMyRating(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to submit rating.';
      Alert.alert('Error', msg);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const isMine = me?.id === listing?.seller_id;

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Delete this listing? This cannot be undone.')) return;
      await api.delete(`/api/listings/${id}`);
      router.replace('/(tabs)');
      return;
    }
    Alert.alert('Delete Listing', 'This cannot be undone.', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/api/listings/${id}`);
        router.replace('/(tabs)');
      }},
    ]);
  };

  const handleMarkSold = async () => {
    await api.patch(`/api/listings/${id}/sold`);
    setListing((prev) => prev ? { ...prev, is_sold: true } : prev);
  };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 80 }} />;
  if (!listing) return <Text style={{ margin: Spacing.xl, color: Colors.error }}>Listing not found.</Text>;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Centered image gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / 300))}
          >
            {listing.images.length > 0 ? listing.images.map((url, i) => (
              <Image key={i} source={{ uri: `${API_URL}${url}` }} style={styles.image} resizeMode="cover" />
            )) : (
              <View style={[styles.image, styles.placeholder]}><Text style={{ color: Colors.textMuted }}>No Images</Text></View>
            )}
          </ScrollView>
        </View>
        {listing.images.length > 1 && (
          <View style={styles.dots}>
            {listing.images.map((_, i) => <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />)}
          </View>
        )}

        <View style={styles.body}>
          {listing.is_sold && (
            <View style={styles.soldBanner}><Text style={styles.soldBannerText}>SOLD</Text></View>
          )}
          <Text style={styles.price}>฿{listing.price.toLocaleString()}</Text>
          <Text style={styles.titleText}>{listing.title}</Text>
          <View style={styles.badges}>
            <View style={styles.badge}><Text style={styles.badgeText}>{CONDITION_LABEL[listing.item_condition]}</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>{CATEGORY_LABEL[listing.category]}</Text></View>
          </View>
          {listing.description ? <Text style={styles.description}>{listing.description}</Text> : null}
          <Text style={styles.dateText}>Posted {new Date(listing.created_at).toLocaleDateString()}</Text>

          <TouchableOpacity style={styles.sellerCard} onPress={() => router.push(`/user/${listing.seller.id}`)}>
            <View style={styles.sellerAvatar}><Text style={styles.sellerAvatarText}>{listing.seller.name.charAt(0).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>{listing.seller.name}</Text>
              {listing.seller.avg_rating != null && (
                <Text style={styles.sellerRating}>★ {listing.seller.avg_rating.toFixed(1)} ({listing.seller.rating_count} reviews)</Text>
              )}
            </View>
            <Text style={styles.viewProfile}>View Profile →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isMine ? (
          <View style={styles.sellerActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/listing/edit/${id}`)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            {!listing.is_sold && (
              <TouchableOpacity style={styles.soldBtn} onPress={handleMarkSold}>
                <Text style={styles.soldBtnText}>Mark Sold</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : listing.is_sold ? (
          <View>
            <Text style={styles.soldLabel}>Item Sold</Text>
            {myRating !== undefined && (
              myRating ? (
                <View style={styles.myRatingBox}>
                  <Text style={styles.myRatingTitle}>Your review</Text>
                  <Text style={styles.myRatingStars}>{'★'.repeat(myRating.score)}{'☆'.repeat(5 - myRating.score)}</Text>
                  {myRating.review_text ? <Text style={styles.myRatingText}>{myRating.review_text}</Text> : null}
                </View>
              ) : me ? (
                <View style={styles.ratingForm}>
                  <Text style={styles.ratingFormTitle}>Rate this seller</Text>
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <TouchableOpacity key={s} onPress={() => setRatingScore(s)}>
                        <Text style={[styles.star, s <= ratingScore && styles.starFilled]}>{s <= ratingScore ? '★' : '☆'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.ratingInput}
                    placeholder="Leave a comment (optional)"
                    placeholderTextColor={Colors.textMuted}
                    value={ratingText}
                    onChangeText={setRatingText}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.submitRatingBtn, ratingSubmitting && styles.contactBtnDisabled]}
                    onPress={handleSubmitRating}
                    disabled={ratingSubmitting}
                  >
                    <Text style={styles.contactBtnText}>{ratingSubmitting ? 'Submitting…' : 'Submit Review'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => router.push(`/chat/${listing.id}`)}
          >
            <Text style={styles.contactBtnText}>Contact Seller</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  imageContainer: { alignItems: 'center', paddingVertical: Spacing.sm },
  image: { width: 300, height: 300, backgroundColor: Colors.border, borderRadius: Radius.md },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary },
  body: { padding: Spacing.md },
  soldBanner: { backgroundColor: Colors.sold, alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm, marginBottom: Spacing.sm },
  soldBannerText: { color: Colors.surface, fontWeight: '700' },
  price: { fontSize: Typography['3xl'], fontWeight: '800', color: Colors.primary },
  titleText: { fontSize: Typography.xl, fontWeight: '600', color: Colors.text, marginTop: Spacing.xs },
  badges: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.sm },
  badge: { backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  badgeText: { color: Colors.primaryDark, fontSize: Typography.xs, fontWeight: '600' },
  description: { color: Colors.textSecondary, fontSize: Typography.base, lineHeight: 24, marginVertical: Spacing.sm },
  dateText: { color: Colors.textMuted, fontSize: Typography.xs, marginBottom: Spacing.md },
  sellerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  sellerAvatarText: { color: Colors.surface, fontWeight: '700', fontSize: Typography.lg },
  sellerName: { fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  sellerRating: { fontSize: Typography.xs, color: Colors.warning },
  viewProfile: { fontSize: Typography.xs, color: Colors.primary },
  footer: { padding: Spacing.md, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  contactBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  contactBtnDisabled: { backgroundColor: Colors.textMuted },
  contactBtnText: { color: Colors.surface, fontSize: Typography.base, fontWeight: '700' },
  sellerActions: { flexDirection: 'row', gap: Spacing.sm },
  editBtn: { flex: 1, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  editBtnText: { color: Colors.primary, fontWeight: '600' },
  soldBtn: { flex: 1, backgroundColor: Colors.warning, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  soldBtnText: { color: Colors.surface, fontWeight: '600' },
  deleteBtn: { flex: 1, backgroundColor: Colors.error, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  deleteBtnText: { color: Colors.surface, fontWeight: '600' },
  soldLabel: { textAlign: 'center', color: Colors.textMuted, fontWeight: '600', marginBottom: Spacing.sm },
  myRatingBox: { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.sm },
  myRatingTitle: { fontSize: Typography.xs, color: Colors.primaryDark, fontWeight: '600', marginBottom: 2 },
  myRatingStars: { color: Colors.warning, fontSize: Typography.lg },
  myRatingText: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 2 },
  ratingForm: { gap: Spacing.sm },
  ratingFormTitle: { fontSize: Typography.sm, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs },
  star: { fontSize: 32, color: Colors.border },
  starFilled: { color: Colors.warning },
  ratingInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.sm, color: Colors.text, fontSize: Typography.sm, minHeight: 60 },
  submitRatingBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
});
