# Lock Screen widget & side quest alerts

Two surfaces that live outside the app, so the party sees the trip without unlocking:

| Surface | File | Lives |
|---|---|---|
| **Live Activity** | `src/widgets/journey-activity.tsx` | Lock Screen + Dynamic Island, **only while a trip runs** |
| **Widget** | `src/widgets/journey-widget.tsx` | Home Screen + Lock Screen accessories, **always** |
| **Alert** | `src/services/quest-alerts.ts` | Local notification when a new side quest appears |

## ⚠️ Requires a development build — not Expo Go

`expo-widgets` ships a native iOS extension. Expo Go cannot load it. To see the
Lock Screen surfaces:

```bash
npx expo run:ios          # or: eas build --profile development --platform ios
```

**The app still runs fine in Expo Go.** Everything is behind a lazy `require()`
inside a `try/catch` (`src/services/journey-live-activity.ts`), so in Expo Go the
widget calls become no-ops rather than a startup crash. The **notification half
works in Expo Go**, so the "new side quest" alert is demoable today.

## Wiring it up — one line

Not yet wired into `src/app/journey.tsx`, deliberately: that file was being
edited concurrently. To connect it:

```tsx
import { useJourneySurfaces } from '@/services/journey-surface';
import { ensureQuestAlertPermissions } from '@/services/quest-alerts';

// inside the journey screen, alongside the existing useDemoJourney()
const { checkpoint, activityStatuses } = useDemoJourney();
useJourneySurfaces(checkpoint, activityStatuses);
```

Ask for notification permission once, somewhere sensible (trip start, not app launch):

```tsx
await ensureQuestAlertPermissions();
```

That's it. The hook pushes progress to the Lock Screen on every checkpoint change
and fires the alert exactly once per distinct quest offer.

## What it shows

**Driving** — cobalt accent, destination, progress bar, live-ticking ETA.
**Side quest offered** — gold accent, quest title, place, `N min off route`.
**Arrived** — checkered flag, "You made it.", "Chronicle ready".

The ETA uses SwiftUI's `Text dateStyle="timer"`, which counts down **on-device**.
It stays correct while the app is suspended, with no pushes and no background work.

## Constraints when editing the widget files

The `'widget'` directive puts that function in an isolated runtime:

- only `@expo/ui/swift-ui` components — no `View`, no `Text` from React Native
- no hooks, no state, no async
- **no external references** — every constant and helper must be declared inside
  the function body

That last one is why the palette is redeclared inside each widget instead of
imported from `@/constants/theme`. **If you change the brand colours, change them
in three places.**

## Still to do

- `plannedCount` in the widget snapshot is hardcoded `0` — wire it to the real
  saved-trip count from `src/services/trip-planner.ts`.
- The widget's "no trip running" state is never pushed; only `syncJourneySurfaces`
  updates it, which runs during a trip. Call `updateJourneyWidget` on trip end too.
- Live Activity **push updates** (`enablePushNotifications`) are not configured —
  updates only happen while the app is running. For a real drive with the phone
  locked for an hour, you'd want APNs pushing the activity from the server.
- `ios.bundleIdentifier` was Expo's placeholder; I set `com.snoopdobby.sidequest`.
  Change it if that's wrong — it must be set before any native build.
