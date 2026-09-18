import { StyleSheet, Text, View } from 'react-native';
import { SideQuestColors as C } from '@/constants/theme';
export function MapUnavailable({ name }: { name: string }) {
  return <View style={styles.empty}><Text style={styles.title}>{name}</Text><Text style={styles.message}>Map preview will appear once Mapbox is connected.</Text></View>;
}
const styles = StyleSheet.create({ empty: { flex: 1, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 8 }, title: { color: C.text, fontSize: 20, fontWeight: '600' }, message: { color: C.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 250 } });
