import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { JourneyActivityProps } from '@/widgets/journey-activity';
import {
  endJourneyActivity,
  startJourneyActivity,
  updateJourneyActivity,
  updateJourneyWidget,
} from '@/services/journey-live-activity';

/**
 * The "a new side quest just appeared" alert.
 *
 * A Live Activity update is silent — it redraws the Lock Screen but makes no
 * sound and raises no banner. So the nudge is a separate local notification,
 * and the two are fired together by `syncJourneySurfaces` below.
 *
 * Local notifications work in Expo Go, so this half of the feature is
 * demonstrable without a development build. The Live Activity half is not.
 */

let handlerInstalled = false;

/** Shows the alert even while the app is foregrounded — the Navigator is usually looking at it. */
function installHandler() {
  if (handlerInstalled) return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureQuestAlertPermissions(): Promise<boolean> {
  installHandler();
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    if (!existing.canAskAgain) return false;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

/**
 * Fires the side quest nudge. `null` trigger means "deliver now" rather than
 * scheduling, which is what we want the moment a quest is offered.
 */
export async function notifyNewQuest(quest: {
  title: string;
  place: string;
  detour: number;
}): Promise<void> {
  installHandler();
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: quest.title,
        // Voice per docs/identity.md: plain, warm, no quest-narrator language.
        body: `${quest.place} · ${quest.detour} min off route. Worth the stop.`,
        sound: true,
        data: { url: 'sidequest://journey' },
        ...(Platform.OS === 'ios' ? { interruptionLevel: 'timeSensitive' as const } : {}),
      },
      trigger: null,
    });
  } catch {
    // Permission refused or unavailable — the Live Activity still updates.
  }
}

/** Identifies a quest offer so the same one never alerts twice. */
let lastAlertedQuest: string | null = null;

/**
 * Single entry point the app calls whenever journey state moves.
 *
 * Keeps the Lock Screen surface and the alert in step, and guarantees the
 * notification fires exactly once per distinct quest offer — re-renders,
 * progress ticks and app restarts must not re-alert the same stop.
 */
export async function syncJourneySurfaces(props: JourneyActivityProps): Promise<void> {
  updateJourneyWidget({
    destination: props.destination,
    progress: props.progress,
    distanceLeft: props.distanceLeft,
    questTitle: props.questTitle,
    plannedCount: 0,
    active: props.state !== 'arrived',
  });

  if (props.state === 'arrived') {
    lastAlertedQuest = null;
    await endJourneyActivity(props);
    return;
  }

  startJourneyActivity(props);
  updateJourneyActivity(props);

  const questKey = props.questTitle ? `${props.questTitle}@${props.questPlace}` : null;
  if (props.state === 'quest' && questKey && questKey !== lastAlertedQuest) {
    lastAlertedQuest = questKey;
    await notifyNewQuest({
      title: props.questTitle!,
      place: props.questPlace ?? '',
      detour: props.questDetour ?? 0,
    });
  } else if (props.state !== 'quest') {
    lastAlertedQuest = null;
  }
}

/** Clears alert state when a trip ends or is abandoned. */
export async function resetJourneySurfaces(): Promise<void> {
  lastAlertedQuest = null;
  await endJourneyActivity();
}
