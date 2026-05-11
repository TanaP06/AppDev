import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import api from '../../lib/api';
import { getCurrentUser } from '../../lib/auth';
import { Message, Listing, User } from '../../lib/types';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

export default function ChatScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [me, setMe] = useState<User | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [receiverId, setReceiverId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const flatRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    const res = await api.get<Message[]>(`/api/messages/${listingId}`);
    setMessages(res.data);
  }, [listingId]);

  useEffect(() => {
    Promise.all([
      api.get<User>('/api/users/me'),
      api.get<Listing>(`/api/listings/${listingId}`),
      api.get<Message[]>(`/api/messages/${listingId}`),
    ]).then(([mr, lr, msgr]) => {
      const myId = mr.data.id;
      setMe(mr.data);
      setListing(lr.data);
      setMessages(msgr.data);
      navigation.setOptions({ title: lr.data.title });

      if (lr.data.seller_id !== myId) {
        // I'm the buyer — receiver is the seller
        setReceiverId(lr.data.seller_id);
      } else {
        // I'm the seller — receiver is the buyer, found from existing messages
        const first = msgr.data[0];
        if (first) {
          setReceiverId(first.sender_id !== myId ? first.sender_id : first.receiver_id);
        }
      }
    }).catch(() => {}).finally(() => setLoading(false));

    const poll = setInterval(fetchMessages, 5000);
    return () => clearInterval(poll);
  }, [listingId]);

  const send = async () => {
    if (!text.trim() || !receiverId) return;
    const content = text.trim();
    setText('');
    await api.post('/api/messages', { listing_id: Number(listingId), receiver_id: receiverId, content });
    fetchMessages();
  };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 80 }} />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item: msg }) => {
          const isMine = msg.sender_id === me?.id;
          return (
            <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
              <Text style={[styles.bubbleText, isMine ? styles.mineText : styles.theirsText]}>{msg.content}</Text>
              <Text style={styles.time}>{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={!text.trim()}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md, gap: Spacing.xs },
  bubble: { maxWidth: '75%', borderRadius: Radius.lg, padding: Spacing.sm },
  mine: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  theirs: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: Typography.base },
  mineText: { color: Colors.surface },
  theirsText: { color: Colors.text },
  time: { fontSize: 10, color: Colors.textMuted, marginTop: 2, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', padding: Spacing.sm, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  input: { flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, fontSize: Typography.base, maxHeight: 100 },
  sendBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.md, justifyContent: 'center' },
  sendBtnText: { color: Colors.surface, fontWeight: '700' },
});
