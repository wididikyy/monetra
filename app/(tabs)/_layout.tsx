import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { AppColors, Theme } from '@/constants/theme';

type TabIconProps = {
  name: IconSymbolName;
  color: string;
  focused: boolean;
};

function TabIcon({ name, color, focused }: TabIconProps) {
  return (
    <View style={focused ? styles.activeIcon : undefined}>
      <IconSymbol name={name} size={24} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 56 + insets.bottom;
  const tabBarPaddingBottom = Platform.OS === 'ios' ? 28 : insets.bottom + 4;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: Theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: Theme.card,
          borderTopColor: Theme.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: { backgroundColor: Theme.card },
        headerTintColor: Theme.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="app.grid" color={color} focused={focused} />
          ),
          headerTitle: 'Monetra',
        }}
      />
      <Tabs.Screen
        name="transaksi"
        options={{
          title: 'Transaksi',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="arrow.left.arrow.right" color={color} focused={focused} />
          ),
          headerTitle: 'Transaksi',
        }}
      />
      <Tabs.Screen
        name="laporan"
        options={{
          title: 'Laporan',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chart.bar.fill" color={color} focused={focused} />
          ),
          headerTitle: 'Laporan',
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Asisten AI',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="sparkles" color={color} focused={focused} />
          ),
          headerTitle: 'Asisten AI',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIcon: {
    backgroundColor: `${AppColors.primary}18`,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
});
