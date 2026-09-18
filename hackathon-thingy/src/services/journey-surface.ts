import { useEffect } from 'react';

import { TRIP, TRIP_ACTIVITIES } from '@/constants/trip';
import type { Checkpoint } from '@/context/demo-journey';
import { resetJourneySurfaces, syncJourneySurfaces } from '@/services/quest-alerts';
import type { JourneyActivityProps } from '@/widgets/journey-activity';

/**
 * Adapts the in-app journey state onto the Lock Screen surfaces.
 *
 * This is the only place that knows about both the trip model and the widget
 * props, so neither has to know about the other.
 */

/** Parses the demo's display ETA ("1h 55m", "40m", "Arrived") into minutes. */
export function parseEtaMinutes(eta: string): number {
  const hours = /(\d+)\s*h/.exec(eta);
  const minutes = /(\d+)\s*m/.exec(eta);
  if (!hours && !minutes) return 0;
  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
}

/**
 * Picks the side quest to surface: the nearest activity the party hasn't
 * resolved yet that the car has actually reached.
 */
function nextQuest(progress: number, statuses: Record<string, string>) {
  return (
    TRIP_ACTIVITIES.filter(
      (activity) => statuses[activity.id] === 'suggested' && progress >= activity.progress - 4
    ).sort((a, b) => a.progress - b.progress)[0] ?? null
  );
}

export function checkpointToActivityProps(
  checkpoint: Checkpoint,
  activityStatuses: Record<string, string>
): JourneyActivityProps {
  const arrived = checkpoint.progress >= 100;
  const quest = arrived ? null : nextQuest(checkpoint.progress, activityStatuses);

  return {
    destination: TRIP.destination,
    progress: checkpoint.progress,
    // The demo stores distance as "127 km left"; the widget adds its own framing.
    distanceLeft: checkpoint.distance.replace(/\s*left$/i, ''),
    arrivalAt: Date.now() + parseEtaMinutes(checkpoint.eta) * 60_000,
    questTitle: quest?.title ?? null,
    questPlace: quest?.place ?? null,
    questDetour: quest?.detour ?? null,
    state: arrived ? 'arrived' : quest ? 'quest' : 'driving',
  };
}

/**
 * Drop-in hook. Add one line to the journey screen and the Lock Screen activity
 * plus the side quest alert follow the trip automatically:
 *
 *   useJourneySurfaces(checkpoint, activityStatuses);
 *
 * Safe everywhere — no-ops in Expo Go and on Android (see journey-live-activity.ts).
 */
export function useJourneySurfaces(
  checkpoint: Checkpoint | null | undefined,
  activityStatuses: Record<string, string>,
  enabled = true
) {
  // Re-syncs whenever the car moves or a quest is accepted/skipped. Deliberately
  // keyed on the derived values rather than object identity: the context rebuilds
  // these objects every render and we must not re-alert on every render.
  const key = checkpoint
    ? `${checkpoint.id}:${checkpoint.progress}:${JSON.stringify(activityStatuses)}`
    : '';

  useEffect(() => {
    if (!enabled || !checkpoint) return;
    void syncJourneySurfaces(checkpointToActivityProps(checkpoint, activityStatuses));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  useEffect(() => {
    return () => {
      void resetJourneySurfaces();
    };
  }, []);
}
