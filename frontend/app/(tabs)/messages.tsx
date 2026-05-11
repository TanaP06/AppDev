import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import api from '../../lib/api';
import { Thread } from '../../lib/types';
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
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={threads}
        keyExtractor={(t) => `${t.listing_id}-${t.counterpart.id}`}
        renderItem={({ item: thread }) => (
          <TouchableOpacity style={styles.row} onPress={() => router.push(`/chat/${thread.listing_id}`)}>
            <View style={styles.avatar}>
              {thread.counterpart.profile_pic ? (
                <Image source={{ uri: `${API_URL}${thread.counterpart.profile_pic}` }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{thread.counterpart.name.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View style={styles.info}>
              <Text style={styles.counterpart}>{thread.counterpart.name}</Text>
              <Text style={styles.listingTitle} numberOfLines={1}>{thread.listing_title}</Text>
              <Text style={styles.preview} numberOfLines={1}>{thread.last_message}</Text>
            </View>
            <Text style={styles.time}>{new Date(thread.last_sent_at).toLocaleDateString()}</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: Typography.xl, fontWeight: '700', color: Colors.text, padding: Spacing.md, paddingTop: 56 },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: Colors.surface, fontWeight: '700', fontSize: Typography.lg },
  info: { flex: 1 },
  counterpart: { fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  listingTitle: { fontSize: Typography.xs, color: Colors.primary, marginBottom: 2 },
  preview: { fontSize: Typography.sm, color: Colors.textSecondary },
  time: { fontSize: Typography.xs, color: Colors.textMuted },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.base },
});
