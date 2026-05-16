import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '@/db/database';
import { Colors } from '@/constants/colors';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar style="light" />
      <SQLiteProvider databaseName="meals.db" onInit={initDatabase}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="add-food"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="scan"
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
        </Stack>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
