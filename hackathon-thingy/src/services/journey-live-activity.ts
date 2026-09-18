import { Platform } from 'react-native';

import type { JourneyActivityProps } from '@/widgets/journey-activity';
import type { JourneyWidgetProps } from '@/widgets/journey-widget';

/**
 * Drives the Lock Screen / Dynamic Island Live Activity for a trip.
 *
 * Every entry point here is a safe no-op when Live Activities are unavailable —
 * on Android, on iOS below 16.1, and critically **in Expo Go**, where the
 * `expo-widgets` native module is not present. That matters because the team
 * demos this project through Expo Go: importing `expo-widgets` eagerly would
 * crash the whole app there, so the module is resolved lazily inside a
 * try/catch and the app degrades to "no Live Activity" instead of "no app".
 *
 * To see it for real you need a development build (`npx expo run:ios`), not Expo Go.
 */

type LiveActivityInstance = {
  update(props: JourneyActivityProps, staleDate?: Date): Promise<void>;
  end(dismissalPolicy?: unknown, props?: JourneyActivityProps, contentDate?: Date): Promise<void>;
};

type LiveActivityFactory = {
  start(props: JourneyActivityProps, url?: string, staleDate?: Date): LiveActivityInstance;
  getInstances(): LiveActivityInstance[];
};

let factory: LiveActivityFactory | null | undefined;
let current: LiveActivityInstance | null = null;

/** Resolves the activity module once; caches `null` when it isn't available. */
function getFactory(): LiveActivityFactory | null {
  if (factory !== undefined) return factory;
  if (Platform.OS !== 'ios') {
    factory = null;
    return factory;
  }
  try {
    // Lazy require, not a static import: in Expo Go this throws, and it must
    // throw *here* where we can swallow it rather than at module load time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate: a static import would crash Expo Go at startup
    factory = (require('@/widgets/journey-activity') as { default: LiveActivityFactory }).default;
  } catch {
    factory = null;
  }
  return factory;
}

export function isLiveActivitySupported(): boolean {
  return getFactory() !== null;
}

type WidgetHandle = { updateSnapshot(props: JourneyWidgetProps): void };
let widget: WidgetHandle | null | undefined;

/**
 * Pushes state into the persistent Home/Lock Screen widget. Separate from the
 * Live Activity: the widget outlives the trip, so it also has to show the
 * "nothing running" state.
 */
export function updateJourneyWidget(props: JourneyWidgetProps): void {
  if (widget === undefined) {
    if (Platform.OS !== 'ios') {
      widget = null;
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate: a static import would crash Expo Go at startup
        widget = (require('@/widgets/journey-widget') as { default: WidgetHandle }).default;
      } catch {
        widget = null;
      }
    }
  }
  try {
    widget?.updateSnapshot(props);
  } catch {
    // Widget extension not installed in this build.
  }
}

/**
 * Starts the activity, or reuses one already running — iOS keeps Live Activities
 * alive across app restarts, so a cold launch mid-trip must adopt the existing
 * one instead of starting a duplicate.
 */
export function startJourneyActivity(props: JourneyActivityProps): boolean {
  const activity = getFactory();
  if (!activity) return false;
  try {
    if (!current) {
      const [existing] = activity.getInstances();
      current = existing ?? activity.start(props, 'sidequest://journey');
      if (existing) void existing.update(props);
    }
    return true;
  } catch {
    return false;
  }
}

export function updateJourneyActivity(props: JourneyActivityProps): void {
  if (!current && !startJourneyActivity(props)) return;
  void current?.update(props).catch(() => {});
}

/**
 * Ends the activity. The final props stay on the Lock Screen briefly so arrival
 * is something you see, rather than something that silently disappears.
 */
export async function endJourneyActivity(finalProps?: JourneyActivityProps): Promise<void> {
  const instance = current;
  current = null;
  if (!instance) return;
  try {
    await instance.end(undefined, finalProps);
  } catch {
    // Already dismissed by the user or the system — nothing to recover.
  }
}
