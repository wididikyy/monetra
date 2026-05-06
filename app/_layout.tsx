import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { AppColors } from '@/constants/theme';
import { useDatabase } from '@/hooks/use-database';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useAppStore } from '@/store/use-app-store';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { dbReady, error } = useDatabase();
  useNetworkStatus();

  const profil = useAppStore((s) => s.profil);

  useEffect(() => {
    if (!dbReady) return;
    if (!profil) {
      router.replace('/onboarding');
    }
  }, [dbReady, profil]);

  if (!dbReady && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.expense} />
      </View>
    );
  }

  return <>{children}</>;
}

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: AppColors.primary } };

export default function RootLayout() {
  return (
    <ThemeProvider value={navTheme}>
      <AppInitializer>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen
            name="pengaturan"
            options={{ title: 'Pengaturan', headerBackTitle: 'Kembali' }}
          />
        </Stack>
      </AppInitializer>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
