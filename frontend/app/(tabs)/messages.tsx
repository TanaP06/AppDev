import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import { Thread } from '../../lib/types';
import HeaderLogo from '../../components/HeaderLogo';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

export default function MessagesScreen() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    api.get<Thread[]>('/api/messages/threads')
      .then((r) => setThreads(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []));

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 80 }} />;

  return (
    <View style={styles.container}>
      <HeaderLogo description="Chat directly with buyers and sellers you can trust — fellow Chula students, just like you." />
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={threads}
        keyExtractor={(t) => `${t.listing_id}-${t.counterpart.id}`}
        contentContainerStyle={styles.list}
        renderItem={({ item: thread }) => (
          <TouchableOpacity activeOpacity={0.7} style={styles.card} onPress={() => router.push(`/chat/${thread.listing_id}`)}>
            <TouchableOpacity style={styles.avatar} onPress={() => router.push(`/user/${thread.counterpart.id}`)}>
              {thread.counterpart.profile_pic ? (
                <Image source={{ uri: `${API_URL}${thread.counterpart.profile_pic}` }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{thread.counterpart.name.charAt(0).toUpperCase()}</Text>
              )}
            </TouchableOpacity>
            <View style={styles.info}>
              <View style={styles.headerRow}>
                <Text style={styles.counterpart} numberOfLines={1}>{thread.counterpart.name}</Text>
                <Text style={styles.time}>{new Date(thread.last_sent_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.chipRow}>
                <View style={styles.productChip}>
                  <Text style={styles.productText} numberOfLines={1}>{thread.listing_title} ›</Text>
                </View>
              </View>
              <Text style={styles.preview} numberOfLines={1}>{thread.last_message}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  list: { padding: Spacing.md, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: Colors.surface, fontWeight: '700', fontSize: Typography.lg },
  info: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  counterpart: { fontSize: Typography.base, fontWeight: '800', color: Colors.primary, flex: 1, marginRight: Spacing.sm },
  time: { fontSize: 11, color: Colors.textMuted },
  chipRow: { flexDirection: 'row', marginBottom: 6 },
  productChip: { backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  productText: { fontSize: 11, color: Colors.primaryDark, fontWeight: '700' },
  preview: { fontSize: 13, color: Colors.textSecondary },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.base },
});
