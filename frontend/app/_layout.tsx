import { Stack, router } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { Colors } from '../constants/theme';

function HomeBtn() {
  return (
    <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={{ marginRight: 8, padding: 4 }}>
      <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>Home</Text>
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="listing/[id]" options={{ headerShown: true, title: 'Listing', headerRight: () => <HomeBtn /> }} />
      <Stack.Screen name="listing/edit/[id]" options={{ headerShown: true, title: 'Edit Listing', headerRight: () => <HomeBtn /> }} />
      <Stack.Screen name="chat/[listingId]" options={{ headerShown: true, title: 'Chat', headerRight: () => <HomeBtn /> }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: true, title: 'Profile', headerRight: () => <HomeBtn /> }} />
    </Stack>
  );
}
