import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Platform, useWindowDimensions, Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import { clearToken } from '../../lib/auth';
import { User, Listing, Rating } from '../../lib/types';
import ListingCard from '../../components/ListingCard';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'active' | 'sold' | 'reviews';

const SM_SCREEN = 576;
const MD_SCREEN = 768;
const LG_SCREEN = 1024;
const XL_SCREEN = 1280;

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width < SM_SCREEN ? 1 : width < MD_SCREEN ? 2 : width < LG_SCREEN ? 3 : width < XL_SCREEN ? 4 : 5;
  const cardWidth = `${100 / numColumns}%`;
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('active');
  const [loading, setLoading] = useState(false);
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    api.get('/api/users/me')
      .then(async (r) => {
        setUser(r.data);
        const full = await api.get(`/api/users/${r.data.id}`);
        setFullProfile(full.data);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []));

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await clearToken();
    router.replace('/(auth)/login');
  };

  if (loading || !user) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 80 }} />;

  const activeListings: Listing[] = fullProfile?.active_listings ?? [];
  const soldListings: Listing[] = fullProfile?.sold_listings ?? [];
  const ratings: Rating[] = fullProfile?.ratings ?? [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        {user.is_verified && <View style={styles.badge}><Text style={styles.badgeText}>✓ Verified</Text></View>}

        <View style={styles.statsCard}>
          <View style={styles.stat}><Text style={styles.statVal}>{user.avg_rating != null ? user.avg_rating.toFixed(1) : '–'}</Text><Text style={styles.statLabel}>Rating</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.stat}><Text style={styles.statVal}>{user.rating_count ?? 0}</Text><Text style={styles.statLabel}>Reviews</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.stat}><Text style={styles.statVal}>{user.active_listings_count ?? 0}</Text><Text style={styles.statLabel}>Active</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.stat}><Text style={styles.statVal}>{user.sold_listings_count ?? 0}</Text><Text style={styles.statLabel}>Sold</Text></View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress} activeOpacity={0.7}>
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
            {activeListings.map((l) => (
              <View key={l.id} style={{ width: cardWidth as any }}>
                <ListingCard listing={l} />
              </View>
            ))}
            {activeListings.length === 0 && <Text style={styles.empty}>No active listings</Text>}
          </View>
        )}
        {tab === 'sold' && (
          <View style={styles.grid}>
            {soldListings.map((l) => (
              <View key={l.id} style={{ width: cardWidth as any }}>
                <ListingCard listing={l} />
              </View>
            ))}
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

      <Modal visible={showLogoutModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="log-out-outline" size={28} color={Colors.primaryDark} />
            </View>
            <Text style={styles.modalTitle}>Leaving CampusLoop?</Text>
            <Text style={styles.modalDescription}>
              Your account and listings will stay safe. You can sign back in anytime.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setShowLogoutModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalSecondaryBtnText}>Stay Logged In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={confirmLogout} activeOpacity={0.7}>
                <Text style={styles.modalPrimaryBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    marginTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  avatarText: { color: Colors.surface, fontWeight: '800', fontSize: 36 },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  badge: { backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full, marginBottom: Spacing.sm },
  badgeText: { color: Colors.primaryDark, fontSize: Typography.xs, fontWeight: '700' },
  statsCard: { flexDirection: 'row', marginTop: Spacing.md, backgroundColor: Colors.background, paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, borderRadius: Radius.lg, width: '100%', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  statVal: { fontSize: Typography.lg, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  logoutBtn: { marginTop: Spacing.xl, borderWidth: 1.5, borderColor: '#FECACA', borderRadius: Radius.full, paddingHorizontal: 32, paddingVertical: 12, backgroundColor: '#FEF2F2' },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: Typography.sm },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, marginHorizontal: Spacing.md, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.sm },
  tabItem: { flex: 1, padding: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: Typography.sm, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '600' },
  content: { padding: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  empty: { width: '100%', textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.xl, fontSize: Typography.base },
  reviewCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  reviewerName: { fontWeight: '600', color: Colors.text },
  reviewScore: { color: Colors.warning },
  reviewText: { color: Colors.textSecondary, marginBottom: Spacing.xs },
  reviewDate: { fontSize: Typography.xs, color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { width: '100%', maxWidth: 340, backgroundColor: Colors.surface, borderRadius: 24, padding: Spacing.xl, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  modalDescription: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
  modalActions: { width: '100%', gap: Spacing.md },
  modalSecondaryBtn: { width: '100%', padding: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.primary, alignItems: 'center' },
  modalSecondaryBtnText: { color: Colors.surface, fontWeight: '700', fontSize: Typography.base },
  modalPrimaryBtn: { width: '100%', padding: Spacing.md, borderRadius: Radius.full, backgroundColor: '#FEE2E2', alignItems: 'center' },
  modalPrimaryBtnText: { color: '#DC2626', fontWeight: '700', fontSize: Typography.base },
});
