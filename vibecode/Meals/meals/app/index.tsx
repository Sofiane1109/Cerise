import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '@/constants/colors';

export default function Index() {
  const db = useSQLiteContext();
  const [destination, setDestination] = useState<'/(tabs)' | '/onboarding' | null>(null);

  useEffect(() => {
    db.getFirstAsync('SELECT id FROM profile WHERE id = 1').then(row => {
      setDestination(row ? '/(tabs)' : '/onboarding');
    });
  }, [db]);

  if (!destination) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href={destination as any} />;
}
