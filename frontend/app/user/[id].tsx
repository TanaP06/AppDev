import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../lib/api';
import { Listing, Rating } from '../../lib/types';
import ListingCard from '../../components/ListingCard';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

type Tab = 'active' | 'sold' | 'reviews';

interface PublicProfile {
  id: number;
  name: string;
  is_verified: boolean;
  avg_rating: number | null;
  rating_count: number;
  active_listings_count: number;
  sold_listings_count: number;
  active_listings: Listing[];
  sold_listings: Listing[];
  ratings: Rating[];
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [tab, setTab] = useState<Tab>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PublicProfile>(`/api/users/${id}`)
      .then((r) => setProfile(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 80 }} />;
  if (!profile) return <Text style={{ margin: Spacing.xl, color: Colors.error }}>User not found.</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text></View>
        <Text style={styles.name}>{profile.name}</Text>
        {profile.is_verified && <View style={styles.badge}><Text style={styles.badgeText}>✓ Verified Chula Student</Text></View>}
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statVal}>{profile.avg_rating != null ? profile.avg_rating.toFixed(1) : '–'}</Text><Text style={styles.statLabel}>Rating</Text></View>
          <View style={styles.stat}><Text style={styles.statVal}>{profile.rating_count}</Text><Text style={styles.statLabel}>Reviews</Text></View>
          <View style={styles.stat}><Text style={styles.statVal}>{profile.active_listings_count}</Text><Text style={styles.statLabel}>Active</Text></View>
          <View style={styles.stat}><Text style={styles.statVal}>{profile.sold_listings_count}</Text><Text style={styles.statLabel}>Sold</Text></View>
        </View>
      </View>

      <View style={styles.tabs}>
        {(['active', 'sold', 'reviews'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tabItem, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {tab === 'active' && (
          <View style={styles.grid}>
            {profile.active_listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            {profile.active_listings.length === 0 && <Text style={styles.empty}>No active listings</Text>}
          </View>
        )}
        {tab === 'sold' && (
          <View style={styles.grid}>
            {profile.sold_listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            {profile.sold_listings.length === 0 && <Text style={styles.empty}>No sold listings</Text>}
          </View>
        )}
        {tab === 'reviews' && (
          <View>
            {profile.ratings.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{r.reviewer_name}</Text>
                  <Text style={styles.reviewScore}>{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</Text>
                </View>
                {r.review_text && <Text style={styles.reviewText}>{r.review_text}</Text>}
                <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
              </View>
            ))}
            {profile.ratings.length === 0 && <Text style={styles.empty}>No reviews yet</Text>}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  avatarText: { color: Colors.surface, fontWeight: '700', fontSize: Typography['2xl'] },
  name: { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  badge: { marginTop: Spacing.xs, backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  badgeText: { color: Colors.primaryDark, fontSize: Typography.xs, fontWeight: '600' },
  stats: { flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.xl },
  stat: { alignItems: 'center' },
  statVal: { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabItem: { flex: 1, padding: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: Typography.sm, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '600' },
  content: { padding: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.xl, fontSize: Typography.base },
  reviewCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  reviewerName: { fontWeight: '600', color: Colors.text },
  reviewScore: { color: Colors.warning },
  reviewText: { color: Colors.textSecondary, marginBottom: Spacing.xs },
  reviewDate: { fontSize: Typography.xs, color: Colors.textMuted },
});
