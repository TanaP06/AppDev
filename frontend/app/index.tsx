import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getToken } from '../lib/auth';
import { Colors } from '../constants/theme';

export default function Index() {
  useEffect(() => {
    getToken().then((token) => {
      router.replace(token ? '/(tabs)' : '/(auth)/login');
    });
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}
