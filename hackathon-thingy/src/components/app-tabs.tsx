import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { SideQuestColors } from '@/constants/theme';

function TabIcon({ name, color }: { name: 'map' | 'party' | 'chronicle'; color: ColorValue }) {
  const symbols = {
    map: { ios: 'map.fill', android: 'map', web: 'map' },
    party: { ios: 'person.2.fill', android: 'group', web: 'group' },
    chronicle: { ios: 'book.closed.fill', android: 'menu_book', web: 'book' },
  } as const;

  return <SymbolView name={symbols[name]} tintColor={color} size={22} />;
}

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: SideQuestColors.gold,
        tabBarInactiveTintColor: SideQuestColors.textDim,
        tabBarStyle: {
          backgroundColor: SideQuestColors.ink,
          borderTopColor: SideQuestColors.white,
          borderTopWidth: 2,
          height: 72,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'monospace',
          fontWeight: '800',
          fontSize: 10,
          textTransform: 'uppercase',
        },
        sceneStyle: { backgroundColor: SideQuestColors.void },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Journey',
          tabBarAccessibilityLabel: 'Journey dashboard',
          tabBarIcon: ({ color }) => <TabIcon name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="party"
        options={{
          title: 'Party',
          tabBarAccessibilityLabel: 'Party members and roles',
          tabBarIcon: ({ color }) => <TabIcon name="party" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chronicle"
        options={{
          title: 'Chronicle',
          tabBarAccessibilityLabel: 'Traveler Chronicle',
          tabBarIcon: ({ color }) => <TabIcon name="chronicle" color={color} />,
        }}
      />
    </Tabs>
  );
}
