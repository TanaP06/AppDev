import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView, useWindowDimensions } from 'react-native';
import api from '../../lib/api';
import { Listing, ListingsResponse, Category, Condition } from '../../lib/types';
import ListingCard from '../../components/ListingCard';
import HeaderLogo from '../../components/HeaderLogo';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

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
const SORTS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
];

const SM_SCREEN = 576;
const MD_SCREEN = 768;
const LG_SCREEN = 1024;
const XL_SCREEN = 1280;

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width < SM_SCREEN ? 1 : width < MD_SCREEN ? 2 : width < LG_SCREEN ? 3 : width < XL_SCREEN ? 4 : 5;
  const cardWidth = `${100 / numColumns}%`;
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string, cats: Category[], conds: Condition[], mn: string, mx: string, s: string) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { per_page: 50, sort: s };
      if (q) params.q = q;
      if (cats.length === 1) params.category = cats[0];
      if (conds.length === 1) params.item_condition = conds[0];
      if (mn) params.min_price = parseFloat(mn);
      if (mx) params.max_price = parseFloat(mx);
      const res = await api.get<ListingsResponse>('/api/listings', { params });
      setListings(res.data.items);
    } catch {}
    finally { setLoading(false); }
  }, []);

  const triggerSearch = (q: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      search(q, selectedCategories, selectedConditions, minPrice, maxPrice, sort);
    }, 300);
  };

  const applyFilters = () => {
    setShowFilters(false);
    search(query, selectedCategories, selectedConditions, minPrice, maxPrice, sort);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedConditions([]);
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setShowFilters(false);
    search(query, [], [], '', '', 'newest');
  };

  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  return (
    <View style={styles.container}>
      <HeaderLogo description="Find what you're looking for from students right here at Chula — quick, simple, and totally hassle-free." />
      <View style={styles.header}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={(t) => { setQuery(t); triggerSearch(t); }}
          placeholder="Search listings..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          onSubmitEditing={() => search(query, selectedCategories, selectedConditions, minPrice, maxPrice, sort)}
        />
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
          <Text style={styles.filterBtnText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(i) => String(i.id)}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <View style={{ flex: 1, maxWidth: cardWidth as any }}>
              <ListingCard listing={item} />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{query ? 'No results found' : 'Type to search'}</Text>
            </View>
          }
        />
      )}

      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filters</Text>
            <ScrollView>
              <Text style={styles.sectionLabel}>Category</Text>
              <View style={styles.chips}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity key={c.value} style={[styles.chip, selectedCategories.includes(c.value) && styles.chipActive]} onPress={() => setSelectedCategories(toggle(selectedCategories, c.value))}>
                    <Text style={[styles.chipText, selectedCategories.includes(c.value) && styles.chipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Condition</Text>
              <View style={styles.chips}>
                {CONDITIONS.map((c) => (
                  <TouchableOpacity key={c.value} style={[styles.chip, selectedConditions.includes(c.value) && styles.chipActive]} onPress={() => setSelectedConditions(toggle(selectedConditions, c.value))}>
                    <Text style={[styles.chipText, selectedConditions.includes(c.value) && styles.chipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Price Range (฿)</Text>
              <View style={styles.priceRow}>
                <TextInput style={styles.priceInput} value={minPrice} onChangeText={setMinPrice} placeholder="Min" keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
                <Text style={{ color: Colors.textSecondary, marginHorizontal: Spacing.sm }}>–</Text>
                <TextInput style={styles.priceInput} value={maxPrice} onChangeText={setMaxPrice} placeholder="Max" keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
              </View>

              <Text style={styles.sectionLabel}>Sort</Text>
              <View style={styles.chips}>
                {SORTS.map((s) => (
                  <TouchableOpacity key={s.value} style={[styles.chip, sort === s.value && styles.chipActive]} onPress={() => setSort(s.value)}>
                    <Text style={[styles.chipText, sort === s.value && styles.chipTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}><Text style={styles.clearBtnText}>Clear</Text></TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}><Text style={styles.applyBtnText}>Apply</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm },
  input: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Typography.base },
  filterBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.md, justifyContent: 'center' },
  filterBtnText: { color: Colors.surface, fontWeight: '600', fontSize: Typography.sm },
  grid: { padding: 10 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.base },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, padding: Spacing.lg, maxHeight: '80%' },
  modalTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  sectionLabel: { fontSize: Typography.base, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Typography.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.surface, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  priceInput: { flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: Typography.sm, color: Colors.text },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  clearBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  clearBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  applyBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  applyBtnText: { color: Colors.surface, fontWeight: '700' },
});
