import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAPBOX_CONFIGURED, mapDocument, MapCanvasProps } from './map-source';
import { MapUnavailable } from './map-unavailable';

export function MapCanvas({ place, interactive = false, origin, stops }: MapCanvasProps) {
  const html = useMemo(() => mapDocument({ place, interactive, origin, stops }), [place, interactive, origin, stops]);
  if (!MAPBOX_CONFIGURED) return <MapUnavailable name={place.name} />;
  return <View style={styles.fill} pointerEvents={interactive ? 'auto' : 'none'} accessibilityElementsHidden={!interactive}>
    <WebView source={{ html }} originWhitelist={['*']} style={styles.fill} scrollEnabled={false} javaScriptEnabled domStorageEnabled allowsBackForwardNavigationGestures={false} renderError={() => <View style={styles.error}><Text style={styles.message}>Map unavailable. Please check your connection.</Text></View>} />
  </View>;
}
const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: '#111827' }, error: { flex: 1, backgroundColor: '#182234', alignItems: 'center', justifyContent: 'center', padding: 20 }, message: { color: '#F5F1E8', textAlign: 'center' } });
