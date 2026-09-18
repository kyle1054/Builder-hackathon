import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { SideQuestColors } from '@/constants/theme';

function TabIcon({ name, color }: { name: 'map' | 'party' | 'chronicle' | 'profile'; color: ColorValue }) {
  const symbols = {
    map: { ios: 'map.fill', android: 'map', web: 'map' },
    party: { ios: 'person.2.fill', android: 'group', web: 'group' },
    chronicle: { ios: 'book.closed.fill', android: 'menu_book', web: 'book' },
    profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
  } as const;

  return <SymbolView name={symbols[name]} tintColor={color} size={22} />;
}

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: SideQuestColors.goldSoft,
        tabBarInactiveTintColor: SideQuestColors.textDim,
        tabBarStyle: {
          backgroundColor: SideQuestColors.surface,
          borderTopColor: SideQuestColors.border,
          borderTopWidth: 1,
          height: 76,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'system-ui',
          fontWeight: '600',
          fontSize: 11,
        },
        sceneStyle: { backgroundColor: SideQuestColors.void },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen name="auth-callback" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="reset-password" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="history" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="plan" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="join" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="games" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="places" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="trip" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen
        name="journey"
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
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Traveler profile',
          tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} />,
        }}
      />
    </Tabs>
  );
}
