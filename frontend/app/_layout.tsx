import { Stack, router } from 'expo-router';
import Head from 'expo-router/head';
import { TouchableOpacity, Text } from 'react-native';
import { Colors } from '../constants/theme';

import { Ionicons } from '@expo/vector-icons';

function HomeBtn() {
  return (
    <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={{ padding: 4, marginRight: 16 }}>
      <Ionicons name="home" size={24} color={Colors.primary} />
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  return (
    <>
      <Head>
        <title>Campus Loop</title>
      </Head>
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="listing/[id]" options={{ headerShown: true, title: 'Listing', headerRight: () => <HomeBtn /> }} />
      <Stack.Screen name="listing/edit/[id]" options={{ headerShown: true, title: 'Edit Listing', headerRight: () => <HomeBtn /> }} />
      <Stack.Screen name="chat/[listingId]" options={{ headerShown: true, title: 'Chat', headerRight: () => <HomeBtn /> }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: true, title: 'Profile', headerRight: () => <HomeBtn /> }} />
    </Stack>
    </>
  );
}
