import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

/** Bundled illustration: instant, offline, and consistent across native and web. */
export function TravelScene({ variant = 'road' }: { variant?: 'road' | 'farm' }) {
  return <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Image source={variant === 'farm' ? require('../../assets/artwork/elgin-farmstall.png') : require('../../assets/artwork/overberg-road.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
  </View>;
}
