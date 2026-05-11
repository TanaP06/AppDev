import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import { clearToken } from '../../lib/auth';
import { User, Listing, Rating } from '../../lib/types';
import ListingCard from '../../components/ListingCard';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

type Tab = 'active' | 'sold' | 'reviews';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('active');
  const [loading, setLoading] = useState(false);
  const [fullProfile, setFullProfile] = useState<any>(null);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    api.get('/api/users/me')
      .then(async (r) => {
        setUser(r.data);
        const full = await api.get(`/api/users/${r.data.id}`);
        setFullProfile(full.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []));

  const logout = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Log out?')) return;
      await clearToken();
      router.replace('/(auth)/login');
      return;
    }
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await clearToken(); router.replace('/(auth)/login'); } },
    ]);
  };

  if (loading || !user) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 80 }} />;

  const activeListings: Listing[] = fullProfile?.active_listings ?? [];
  const soldListings: Listing[] = fullProfile?.sold_listings ?? [];
  const ratings: Rating[] = fullProfile?.ratings ?? [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        {user.is_verified && <View style={styles.badge}><Text style={styles.badgeText}>✓ Verified</Text></View>}
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statVal}>{user.avg_rating != null ? user.avg_rating.toFixed(1) : '–'}</Text><Text style={styles.statLabel}>Rating</Text></View>
          <View style={styles.stat}><Text style={styles.statVal}>{user.rating_count ?? 0}</Text><Text style={styles.statLabel}>Reviews</Text></View>
          <View style={styles.stat}><Text style={styles.statVal}>{user.active_listings_count ?? 0}</Text><Text style={styles.statLabel}>Active</Text></View>
          <View style={styles.stat}><Text style={styles.statVal}>{user.sold_listings_count ?? 0}</Text><Text style={styles.statLabel}>Sold</Text></View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
            {activeListings.map((l) => <ListingCard key={l.id} listing={l} />)}
            {activeListings.length === 0 && <Text style={styles.empty}>No active listings</Text>}
          </View>
        )}
        {tab === 'sold' && (
          <View style={styles.grid}>
            {soldListings.map((l) => <ListingCard key={l.id} listing={l} />)}
            {soldListings.length === 0 && <Text style={styles.empty}>No sold listings</Text>}
          </View>
        )}
        {tab === 'reviews' && (
          <View>
            {ratings.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{r.reviewer_name}</Text>
                  <Text style={styles.reviewScore}>{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</Text>
                </View>
                {r.review_text && <Text style={styles.reviewText}>{r.review_text}</Text>}
                <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
              </View>
            ))}
            {ratings.length === 0 && <Text style={styles.empty}>No reviews yet</Text>}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', padding: Spacing.xl, paddingTop: 56, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  avatarText: { color: Colors.surface, fontWeight: '700', fontSize: Typography['2xl'] },
  name: { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  badge: { marginTop: Spacing.xs, backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  badgeText: { color: Colors.primaryDark, fontSize: Typography.xs, fontWeight: '600' },
  stats: { flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.xl },
  stat: { alignItems: 'center' },
  statVal: { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  logoutBtn: { marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.error, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs },
  logoutText: { color: Colors.error, fontWeight: '600', fontSize: Typography.sm },
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
