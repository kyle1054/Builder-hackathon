import { Image } from 'expo-image';
import { View } from 'react-native';
import type { Interest } from '@/constants/trip';
const positions: Record<Interest, [number, number]> = { Scenic: [0, 0], Food: [1, 0], 'Local lore': [0, 1], Curiosity: [1, 1] };
/** Crop a quadrant in layout, keeping the original generated asset intact. */
export function InterestArt({ category, size = 72 }: { category: Interest; size?: number }) {
  const [x, y] = positions[category];
  return <View aria-hidden style={{ width: size, height: size, overflow: 'hidden', borderRadius: 12 }}><Image source={require('../../assets/artwork/travel-objects.png')} contentFit="fill" style={{ position: 'absolute', width: size * 2, height: size * 2, left: -x * size, top: -y * size }} /></View>;
}
