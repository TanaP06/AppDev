import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isSmall = width < 768;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { borderTopColor: Colors.border, height: 60, paddingBottom: isSmall ? 15 : 10, paddingTop: 10 },
        tabBarLabelStyle: { fontSize: 13, fontWeight: 'bold' },
        tabBarShowLabel: !isSmall,
        tabBarLabelPosition: isSmall ? 'below-icon' : 'beside-icon',
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ 
        title: 'Home', 
        tabBarLabel: 'Home',
        tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
      }} />
      <Tabs.Screen name="search" options={{ 
        title: 'Search', 
        tabBarLabel: 'Search',
        tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />
      }} />
      <Tabs.Screen name="create" options={{ 
        title: 'Sell', 
        tabBarLabel: 'Sell',
        tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />
      }} />
      <Tabs.Screen name="messages" options={{ 
        title: 'Messages', 
        tabBarLabel: 'Messages',
        tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />
      }} />
      <Tabs.Screen name="profile" options={{ 
        title: 'Profile', 
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
      }} />
    </Tabs>
  );
}
