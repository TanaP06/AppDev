import React, { useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, RefreshControl, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import { Listing, ListingsResponse, Category } from '../../lib/types';
import ListingCard from '../../components/ListingCard';
import HeaderLogo from '../../components/HeaderLogo';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { getCurrentUser } from '../../lib/auth';

const CATEGORIES: { label: string; value: Category | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Books', value: 'books' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Furniture', value: 'furniture' },
  { label: 'Other', value: 'other' },
];

const SM_SCREEN = 576;
const MD_SCREEN = 768;
const LG_SCREEN = 1024;
const XL_SCREEN = 1280;

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width < SM_SCREEN ? 1 : width < MD_SCREEN ? 2 : width < LG_SCREEN ? 3 : width < XL_SCREEN ? 4 : 5;
  const cardWidth = `${100 / numColumns}%`;
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<Category | ''>('');
  const [userName, setUserName] = useState('');
  const hasMore = useRef(true);

  const fetchListings = useCallback(async (p: number, cat: Category | '', reset = false) => {
    if (loading && !reset) return;
    setLoading(true);
    try {
      const params: Record<string, any> = { page: p, per_page: 20 };
      if (cat) params.category = cat;
      const res = await api.get<ListingsResponse>('/api/listings', { params });
      const data = res.data;
      setTotal(data.total);
      setListings((prev) => reset ? data.items : [...prev, ...data.items]);
      hasMore.current = data.items.length === data.per_page && p * data.per_page < data.total;
    } catch {}
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    getCurrentUser().then((u) => u && setUserName(u.name));
    setPage(1);
    hasMore.current = true;
    fetchListings(1, category, true);
  }, [category]));

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    hasMore.current = true;
    await fetchListings(1, category, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && hasMore.current) {
      const next = page + 1;
      setPage(next);
      fetchListings(next, category);
    }
  };

  const handleCategoryChange = (cat: Category | '') => {
    setCategory(cat);
    setPage(1);
    hasMore.current = true;
    setListings([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: Spacing.md }}>
          <HeaderLogo description="Welcome back! Discover fresh listings from fellow Chula students — your next great find is just around campus." showDivider={false} />
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ alignSelf: 'flex-start', marginTop: Spacing.xs }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase() || '?'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/search')}>
        <Text style={styles.searchText}>Search listings...</Text>
      </TouchableOpacity>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c.value}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={{ paddingHorizontal: Spacing.md }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryTab, category === item.value && styles.categoryTabActive]}
            onPress={() => handleCategoryChange(item.value as Category | '')}
          >
            <Text style={[styles.categoryTabText, category === item.value && styles.categoryTabTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={listings}
        keyExtractor={(item) => String(item.id)}
        numColumns={numColumns}
          key={numColumns}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: cardWidth as any }}>
            <ListingCard listing={item} />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loading && !refreshing ? <ActivityIndicator color={Colors.primary} style={{ margin: Spacing.md }} /> : null}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No listings found</Text>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: Spacing.md, paddingTop: 56 },
  appName: { fontSize: Typography.xl, fontWeight: '800', color: Colors.primary },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.surface, fontWeight: '700', fontSize: Typography.base },
  searchBar: { margin: Spacing.md, marginTop: 0, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  searchText: { color: Colors.textMuted, fontSize: Typography.base },
  categoryTabs: { flexGrow: 0, marginBottom: Spacing.sm, minHeight: 40, maxHeight: 40 },
  categoryTab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginRight: Spacing.xs, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, height: 32, justifyContent: 'center' },
  categoryTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryTabText: { fontSize: Typography.sm, color: Colors.textSecondary },
  categoryTabTextActive: { color: Colors.surface, fontWeight: '600' },
  grid: { padding: 10, paddingBottom: 20 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.base },
});
