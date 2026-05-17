import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Listing } from '../lib/types';
import { Colors, Spacing, Typography, Radius } from '../constants/theme';

interface Props {
  listing: Listing;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

export default function ListingCard({ listing }: Props) {
  const imageUrl = listing.images[0] ? `${API_URL}${listing.images[0]}` : null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/listing/${listing.id}`)}
    >
      {/* Image fills the full card width */}
      <View style={styles.imageWrapper}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderIcon}>🖼️</Text>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        {listing.is_sold && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldText}>SOLD</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <Text style={styles.price}>฿{listing.price.toLocaleString()}</Text>
        <View style={styles.sellerRow}>
          <Text style={styles.sellerName} numberOfLines={1}>{listing.seller.name}</Text>
          {listing.seller.avg_rating != null && (
            <View style={styles.ratingBadge}>
              <Text style={styles.rating}>★ {listing.seller.avg_rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 5,           // matches template cardItem margin
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    // Subtle elevation/shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeholderIcon: {
    fontSize: 28,
  },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  soldBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.sold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  soldText: {
    color: '#fff',
    fontSize: Typography.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  info: {
    padding: 6,
    gap: 1,
  },
  title: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 14,
    marginBottom: 1,
  },
  price: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 3,
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  sellerName: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  ratingBadge: {
    backgroundColor: '#fffbe6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rating: {
    fontSize: Typography.xs,
    color: '#b8860b',
    fontWeight: '700',
  },
});
