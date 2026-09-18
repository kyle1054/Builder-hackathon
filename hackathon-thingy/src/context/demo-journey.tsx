import { ActivityStatus, TRIP } from '@/constants/trip';
import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

export type Checkpoint = {
  id: string;
  progress: number;
  place: string;
  distance: string;
  eta: string;
  stamina: number;
  rations: number;
  fuel: number;
  event: string;
};

// Illustrative drive times and distances for the Stellenbosch → Tierfontein demo.
const checkpoints: Checkpoint[] = [
  { id: 'departure', progress: 0, place: TRIP.origin, distance: '195 km left', eta: '2h 50m', stamina: 100, rations: 100, fuel: 95, event: 'Leaving Stellenbosch for the Overberg.' },
  { id: 'orchard', progress: 35, place: 'Elgin Valley', distance: '127 km left', eta: '1h 55m', stamina: 82, rations: 75, fuel: 72, event: 'An orchard lunch is a short turn off the road.' },
  { id: 'pass', progress: 48, place: 'Houw Hoek Pass', distance: '101 km left', eta: '1h 30m', stamina: 73, rations: 66, fuel: 60, event: 'Take in the mountain views before heading towards Stanford.' },
  { id: 'stanford', progress: 80, place: 'Stanford', distance: '39 km left', eta: '40m', stamina: 65, rations: 54, fuel: 42, event: 'The last stretch heads towards Baardskeerdersbos.' },
  { id: 'village', progress: 95, place: 'Baardskeerdersbos', distance: '8 km left', eta: '12m', stamina: 60, rations: 48, fuel: 35, event: 'A village wander before the final drive to the farm.' },
  { id: 'arrival', progress: 100, place: TRIP.destination, distance: 'Arrived', eta: 'Arrived', stamina: 58, rations: 44, fuel: 31, event: 'Welcome to Tierfontein Farm. Your Chronicle has a new chapter.' },
];

type DemoJourneyContextValue = {
  activityStatuses: Record<string, ActivityStatus>;
  setActivityStatus: (id: string, status: ActivityStatus) => void;
  checkpoint: Checkpoint;
  checkpointIndex: number;
  checkpoints: Checkpoint[];
  advanceCheckpoint: () => void;
};

const DemoJourneyContext = createContext<DemoJourneyContextValue | null>(null);

export function DemoJourneyProvider({ children }: PropsWithChildren) {
  const [activityStatuses, setActivityStatuses] = useState<Record<string, ActivityStatus>>({ farmstall: 'suggested', viewpoint: 'planned', village: 'planned', find: 'suggested' });
  const [checkpointIndex, setCheckpointIndex] = useState(1);

  const value = useMemo<DemoJourneyContextValue>(
    () => ({
      activityStatuses,
      setActivityStatus: (id, status) => setActivityStatuses((current) => ({ ...current, [id]: status })),
      checkpoint: checkpoints[checkpointIndex],
      checkpointIndex,
      checkpoints,
      advanceCheckpoint: () => setCheckpointIndex((current) => Math.min(current + 1, checkpoints.length - 1)),
    }),
    [activityStatuses, checkpointIndex],
  );

  return <DemoJourneyContext.Provider value={value}>{children}</DemoJourneyContext.Provider>;
}

export function useDemoJourney() {
  const value = useContext(DemoJourneyContext);
  if (!value) throw new Error('useDemoJourney must be used within DemoJourneyProvider');
  return value;
}
