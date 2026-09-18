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
  hasChallenge?: boolean;
};

export type DemoMemory = {
  id: string;
  title: string;
  place: string;
  time: string;
  votes: number;
  tone: 'amber' | 'blue' | 'green';
  owner: string;
};

const checkpoints: Checkpoint[] = [
  {
    id: 'departure',
    progress: 18,
    place: 'Baden Powell Drive',
    distance: '112 km left',
    eta: '1h 42m',
    stamina: 92,
    rations: 81,
    fuel: 76,
    event: 'The road opens beyond the dunes.',
  },
  {
    id: 'orchard',
    progress: 42,
    place: 'Elgin Valley',
    distance: '74 km left',
    eta: '1h 06m',
    stamina: 74,
    rations: 63,
    fuel: 58,
    event: 'A hidden orchard appears on the quest radar.',
    hasChallenge: true,
  },
  {
    id: 'pass',
    progress: 68,
    place: 'Houw Hoek Pass',
    distance: '39 km left',
    eta: '38m',
    stamina: 53,
    rations: 44,
    fuel: 41,
    event: 'Mountain mist reveals an old traveler’s riddle.',
    hasChallenge: true,
  },
  {
    id: 'tavern',
    progress: 84,
    place: 'Bot River Farmstall',
    distance: '18 km left',
    eta: '19m',
    stamina: 100,
    rations: 92,
    fuel: 36,
    event: 'Tavern rest complete. Well Rested buff gained.',
  },
  {
    id: 'arrival',
    progress: 100,
    place: 'Greyton',
    distance: 'Arrived',
    eta: 'Victory',
    stamina: 88,
    rations: 78,
    fuel: 28,
    event: 'Expedition complete. The Chronicle is ready.',
  },
];

type DemoJourneyContextValue = {
  checkpoint: Checkpoint;
  checkpointIndex: number;
  checkpoints: Checkpoint[];
  challengeOpen: boolean;
  answerSubmitted: boolean;
  roleRequestPending: boolean;
  poolGold: number;
  memories: DemoMemory[];
  advanceCheckpoint: () => void;
  dismissChallenge: () => void;
  submitAnswer: () => void;
  requestRoleSwap: () => void;
  contributeGold: () => void;
  addMemory: () => void;
};

const DemoJourneyContext = createContext<DemoJourneyContextValue | null>(null);

export function DemoJourneyProvider({ children }: PropsWithChildren) {
  const [checkpointIndex, setCheckpointIndex] = useState(1);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [roleRequestPending, setRoleRequestPending] = useState(false);
  const [poolGold, setPoolGold] = useState(140);
  const [memories, setMemories] = useState<DemoMemory[]>([
    {
      id: 'memory-1',
      title: 'Dunes at dawn',
      place: 'False Bay',
      time: '08:42',
      votes: 1,
      tone: 'blue',
      owner: 'Demo Pilot',
    },
    {
      id: 'memory-2',
      title: 'The pie stop',
      place: 'Elgin Valley',
      time: '09:26',
      votes: 0,
      tone: 'amber',
      owner: 'Demo Navigator',
    },
  ]);

  const value = useMemo<DemoJourneyContextValue>(() => {
    const advanceCheckpoint = () => {
      const nextIndex = Math.min(checkpointIndex + 1, checkpoints.length - 1);
      setCheckpointIndex(nextIndex);
      setAnswerSubmitted(false);
      setChallengeOpen(Boolean(checkpoints[nextIndex].hasChallenge));
    };

    return {
      checkpoint: checkpoints[checkpointIndex],
      checkpointIndex,
      checkpoints,
      challengeOpen,
      answerSubmitted,
      roleRequestPending,
      poolGold,
      memories,
      advanceCheckpoint,
      dismissChallenge: () => setChallengeOpen(false),
      submitAnswer: () => setAnswerSubmitted(true),
      requestRoleSwap: () => setRoleRequestPending(true),
      contributeGold: () => setPoolGold((current) => Math.min(200, current + 20)),
      addMemory: () =>
        setMemories((current) => [
          ...current,
          {
            id: `memory-${current.length + 1}`,
            title: 'Roadside wonder',
            place: checkpoints[checkpointIndex].place,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            votes: 0,
            tone: 'green',
            owner: 'Demo Navigator',
          },
        ]),
    };
  }, [answerSubmitted, challengeOpen, checkpointIndex, memories, poolGold, roleRequestPending]);

  return <DemoJourneyContext.Provider value={value}>{children}</DemoJourneyContext.Provider>;
}

export function useDemoJourney() {
  const value = useContext(DemoJourneyContext);
  if (!value) throw new Error('useDemoJourney must be used within DemoJourneyProvider');
  return value;
}
