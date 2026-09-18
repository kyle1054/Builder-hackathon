# Destination maps and itinerary

Map previews use Mapbox GL JS 3.30.0, with a SideQuest palette over outdoors-v12 (sage terrain, cream roads, muted blue water) and a gold destination marker. Web uses an iframe document; iOS/Android use the same document in react-native-webview. This first implementation does not require the native Mapbox SDK. Native device rendering has not yet been verified.

## Setup

Add a public token to `.env.local`:

```
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your-public-token
```

Reload the app after changing the variable. If Metro still serves the old environment, restart `npx expo start --web --port 8081`. Do not put a secret token in an EXPO_PUBLIC variable. The public token is intentionally included in the client bundle. Account token restrictions must permit the environment where the app runs.

Without a public token, the app shows an explicit map-unavailable state. It does not substitute a fabricated map. Live Mapbox rendering was verified in the web preview with the configured public token on 2026-09-18: Tierfontein Farm and Elgin mini-maps loaded; full-screen expansion, zoom, recenter and close were exercised. Native device rendering still needs validation.

## Interaction

- Tap the destination map to open a full-screen map with pan, zoom, recenter and Done.
- Tap “View trip & activities” beneath it to open `/trip`.
- The itinerary has Upcoming and Whole trip views. Expand an activity for its description, local area map, duration and detour.
- Activity selection is shared in DemoJourneyProvider, so home and detail stay in sync. It is in-memory demo state and resets on reload.
- Upcoming activities fall away as demo checkpoint progress passes their route position; Whole trip retains them as passed, not falsely completed.

Coordinates currently identify destination areas, not verified businesses. No GPS, directions API, live route geometry or real-time ETA has been added in this change. Activities and times are sample data.

Generated artwork and exact generation prompts are documented in `assets/artwork/README.md`. The category sheet remains in use. The trip and destination card illustrations were replaced by maps at the user's request; the original generated artwork is retained for the welcome illustration.
