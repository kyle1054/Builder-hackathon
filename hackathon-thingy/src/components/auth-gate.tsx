import { Redirect } from 'expo-router';
import { PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { SideQuestColors } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export function AuthGate({ children }: PropsWithChildren) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={SideQuestColors.gold} />
      </View>
    );
  }

  if (!session) return <Redirect href="/" />;
  return children;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SideQuestColors.void,
  },
});
