import { useMemo } from 'react';
import { MAPBOX_CONFIGURED, mapDocument, MapCanvasProps } from './map-source';
import { MapUnavailable } from './map-unavailable';

export function MapCanvas({ place, interactive = false, origin, stops }: MapCanvasProps) {
  const html = useMemo(() => mapDocument({ place, interactive, origin, stops }), [place, interactive, origin, stops]);
  if (!MAPBOX_CONFIGURED) return <MapUnavailable name={place.name} />;
  return <iframe title={`Map of ${place.name}`} srcDoc={html} loading="lazy" tabIndex={interactive ? 0 : -1} aria-hidden={!interactive} style={{ border: 0, width: '100%', height: '100%', background: '#111827', pointerEvents: interactive ? 'auto' : 'none' }} />;
}
