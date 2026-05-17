import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import api from '../../lib/api';
import { getCurrentUser } from '../../lib/auth';
import { Message, Listing, User } from '../../lib/types';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

export default function ChatScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [me, setMe] = useState<User | null>(null);
  const [counterpart, setCounterpart] = useState<User | null>(null);
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
      setMessages(msgr.data);

      if (lr.data.seller_id !== myId) {
        // I'm the buyer — receiver is the seller
        setReceiverId(lr.data.seller_id);
        api.get(`/api/users/${lr.data.seller_id}`).then((r: any) => setCounterpart(r.data)).catch(()=>{});
      } else {
        // I'm the seller — receiver is the buyer, found from existing messages
        const first = msgr.data[0];
        if (first) {
          const rId = first.sender_id !== myId ? first.sender_id : first.receiver_id;
          setReceiverId(rId);
          api.get(`/api/users/${rId}`).then((r: any) => setCounterpart(r.data)).catch(()=>{});
        }
      }
    }).catch(() => {}).finally(() => setLoading(false));

    const poll = setInterval(fetchMessages, 5000);
    return () => clearInterval(poll);
  }, [listingId]);

  useEffect(() => {
    if (counterpart && listing) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 8 }}>
            <Text style={{ fontWeight: '800', fontSize: 18, color: Colors.text }}>{counterpart.name}</Text>
            <TouchableOpacity 
              activeOpacity={0.6} 
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }} 
              onPress={() => router.push(`/listing/${listing.id}`)}
            >
              <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '600' }} numberOfLines={1}>
                {listing.title} • ฿{listing.price}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.primary} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={{ padding: 4, marginRight: Spacing.md }}>
            <Ionicons name="home" size={24} color={Colors.primary} />
          </TouchableOpacity>
        ),
      });
    }
  }, [counterpart, listing]);

  const send = async () => {
    if (!text.trim() || !receiverId) return;
    const content = text.trim();
    setText('');
    await api.post('/api/messages', { listing_id: Number(listingId), receiver_id: receiverId, content });
    fetchMessages();
  };

  const handleToggleSold = async (is_sold: boolean) => {
    try {
      await api.patch(`/api/listings/${listingId}/sold`, { is_sold });
      setListing(prev => prev ? { ...prev, is_sold } : prev);
    } catch (err) {
      Alert.alert('Error', 'Could not update status');
    }
  };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 80 }} />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {listing && (
        <View style={styles.statusBanner}>
          {!listing.is_sold && me?.id === listing.seller_id ? (
            <View style={styles.bannerContent}>
              <Text style={styles.bannerText}>Has this item been sold?</Text>
              <TouchableOpacity style={styles.bannerBtn} onPress={() => handleToggleSold(true)}>
                <Text style={styles.bannerBtnText}>Mark as Sold</Text>
              </TouchableOpacity>
            </View>
          ) : listing.is_sold ? (
            <View style={styles.bannerContent}>
              <Text style={styles.bannerText}>This item is sold!</Text>
              {me?.id === listing.seller_id ? (
                <TouchableOpacity style={[styles.bannerBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary }]} onPress={() => handleToggleSold(false)}>
                  <Ionicons name="arrow-undo" size={14} color={Colors.primary} />
                  <Text style={[styles.bannerBtnText, { color: Colors.primary }]}>Undo Sold</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.bannerBtn} onPress={() => router.push(`/listing/${listing.id}`)}>
                  <Ionicons name="star" size={14} color={Colors.surface} />
                  <Text style={styles.bannerBtnText}>Leave a Review</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>
      )}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item: msg }) => {
          const isMine = msg.sender_id === me?.id;
          const user = isMine ? me : counterpart;
          
          return (
            <View style={[styles.messageWrapper, isMine ? styles.wrapperMine : styles.wrapperTheirs]}>
              {!isMine && (
                <TouchableOpacity onPress={() => router.push(`/user/${msg.sender_id}`)}>
                  <View style={styles.avatarSmall}>
                    {user?.profile_pic ? (
                      <Image source={{ uri: `${API_URL}${user.profile_pic}` }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? 'U'}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              
              <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
                <Text style={[styles.bubbleText, isMine ? styles.mineText : styles.theirsText]}>{msg.content}</Text>
                <Text style={styles.time}>{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>

              {isMine && (
                <TouchableOpacity onPress={() => router.push(`/user/${msg.sender_id}`)}>
                  <View style={styles.avatarSmall}>
                    {user?.profile_pic ? (
                      <Image source={{ uri: `${API_URL}${user.profile_pic}` }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? 'M'}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
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
          <Ionicons name="send" size={20} color={Colors.surface} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  statusBanner: { backgroundColor: Colors.primaryLight, padding: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  bannerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerText: { color: Colors.primaryDark, fontSize: Typography.sm, fontWeight: '600', flex: 1 },
  bannerBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center', gap: 6 },
  bannerBtnText: { color: Colors.surface, fontSize: Typography.sm, fontWeight: '700' },
  list: { padding: Spacing.md, gap: Spacing.xs },
  messageWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.sm },
  wrapperMine: { justifyContent: 'flex-end' },
  wrapperTheirs: { justifyContent: 'flex-start' },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginHorizontal: Spacing.sm, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: Colors.surface, fontWeight: '700', fontSize: Typography.sm },
  bubble: { maxWidth: '75%', borderRadius: Radius.lg, padding: Spacing.sm },
  mine: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  theirs: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: Typography.base },
  mineText: { color: Colors.surface },
  theirsText: { color: Colors.text },
  time: { fontSize: 10, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.md, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  input: { flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: Spacing.md, paddingTop: 12, paddingBottom: 12, fontSize: Typography.sm, maxHeight: 100 },
  sendBtn: { backgroundColor: Colors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  sendBtnText: { color: Colors.surface, fontWeight: '700' },
});
