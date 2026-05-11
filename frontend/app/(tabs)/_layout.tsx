import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { borderTopColor: Colors.border },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarLabel: 'Search' }} />
      <Tabs.Screen name="create" options={{ title: 'Sell', tabBarLabel: 'Sell' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarLabel: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
    </Tabs>
  );
}
