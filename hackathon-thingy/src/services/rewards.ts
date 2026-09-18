import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * The rewards ledger. Today it lives on the device; the store below is the only
 * place that knows that, so a party-shared Supabase version can replace it
 * without any screen changing.
 */
export type RewardStats = {
  rounds: number;
  perfectRounds: number;
  correct: number;
  fastAnswers: number;
  bestStreak: number;
  spotted: number;
  rareSpotted: number;
  bingos: number;
  boardsCleared: number;
};
export type Ledger = {
  version: 3;
  xp: number;
  badges: string[];
  stats: RewardStats;
};
export type RewardScope = { userId: string; tripId: string };

export const emptyStats = (): RewardStats => ({
  rounds: 0,
  perfectRounds: 0,
  correct: 0,
  fastAnswers: 0,
  bestStreak: 0,
  spotted: 0,
  rareSpotted: 0,
  bingos: 0,
  boardsCleared: 0,
});
export const emptyLedger = (): Ledger => ({
  version: 3,
  xp: 0,
  badges: [],
  stats: emptyStats(),
});

export const RANKS = [
  { at: 0, name: "Backseat rookie" },
  { at: 150, name: "Map reader" },
  { at: 400, name: "Farmstall regular" },
  { at: 800, name: "Pass conqueror" },
  { at: 1400, name: "Overberg veteran" },
  { at: 2200, name: "Road legend" },
] as const;

export function rankFor(xp: number) {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].at) index = i;
  const next = RANKS[index + 1];
  const floor = RANKS[index].at;
  return {
    level: index + 1,
    name: RANKS[index].name,
    xpIntoRank: xp - floor,
    xpForNext: next ? next.at - floor : 0,
    nextName: next?.name,
    progress: next
      ? Math.min(1, (xp - floor) / (next.at - floor))
      : 1,
  };
}

export type Badge = {
  id: string;
  name: string;
  detail: string;
  icon: string;
  earned: (s: RewardStats) => boolean;
};

export const BADGES: Badge[] = [
  {
    id: "first-round",
    name: "Ignition",
    detail: "Finish your first trivia round.",
    icon: "🔑",
    earned: (s) => s.rounds >= 1,
  },
  {
    id: "sharp-eyes",
    name: "Sharp eyes",
    detail: "Spot five things on the board.",
    icon: "👀",
    earned: (s) => s.spotted >= 5,
  },
  {
    id: "quick-draw",
    name: "Quick draw",
    detail: "Answer five questions in under five seconds.",
    icon: "⚡",
    earned: (s) => s.fastAnswers >= 5,
  },
  {
    id: "on-a-roll",
    name: "On a roll",
    detail: "Get four correct answers in a row.",
    icon: "🔥",
    earned: (s) => s.bestStreak >= 4,
  },
  {
    id: "clean-sweep",
    name: "Clean sweep",
    detail: "Finish a round with every answer right.",
    icon: "🎯",
    earned: (s) => s.perfectRounds >= 1,
  },
  {
    id: "bingo",
    name: "Line caller",
    detail: "Complete a line on the spotting board.",
    icon: "🎉",
    earned: (s) => s.bingos >= 1,
  },
  {
    id: "rare-find",
    name: "Rare find",
    detail: "Spot three rare sightings.",
    icon: "💎",
    earned: (s) => s.rareSpotted >= 3,
  },
  {
    id: "full-board",
    name: "Full house",
    detail: "Clear an entire spotting board.",
    icon: "🏆",
    earned: (s) => s.boardsCleared >= 1,
  },
  {
    id: "know-it-all",
    name: "Know-it-all",
    detail: "Answer thirty questions correctly.",
    icon: "🧠",
    earned: (s) => s.correct >= 30,
  },
];

/** Badges that the new stats have earned but the old ledger had not. */
export function newBadges(before: string[], stats: RewardStats): Badge[] {
  return BADGES.filter((b) => b.earned(stats) && !before.includes(b.id));
}

/** Apply a stat delta and XP, returning the next ledger and anything unlocked. */
export function award(
  ledger: Ledger,
  xp: number,
  delta: Partial<RewardStats>,
): { ledger: Ledger; unlocked: Badge[] } {
  const stats: RewardStats = { ...ledger.stats };
  for (const [key, value] of Object.entries(delta) as [
    keyof RewardStats,
    number,
  ][]) {
    stats[key] =
      key === "bestStreak"
        ? Math.max(stats[key], value)
        : stats[key] + value;
  }
  const unlocked = newBadges(ledger.badges, stats);
  return {
    ledger: {
      version: 3,
      xp: Math.max(0, ledger.xp + xp),
      badges: [...ledger.badges, ...unlocked.map((b) => b.id)],
      stats,
    },
    unlocked,
  };
}

const number = (value: unknown, max = 100000) =>
  Math.max(0, Math.min(max, Math.trunc(Number(value)) || 0));

export function parseLedger(value: string | null): Ledger {
  try {
    const raw = JSON.parse(value ?? "null");
    if (raw?.version !== 3) return emptyLedger();
    const stats = emptyStats();
    for (const key of Object.keys(stats) as (keyof RewardStats)[])
      stats[key] = number(raw.stats?.[key]);
    const ids = new Set(BADGES.map((b) => b.id));
    return {
      version: 3,
      xp: number(raw.xp, 10_000_000),
      badges: Array.isArray(raw.badges)
        ? [...new Set<string>(raw.badges.filter((b: unknown) => ids.has(String(b))))]
        : [],
      stats,
    };
  } catch {
    return emptyLedger();
  }
}

export type RewardStore = {
  load: (scope: RewardScope) => Promise<Ledger>;
  save: (scope: RewardScope, ledger: Ledger) => Promise<void>;
};

/**
 * Device-local store. Scores are kept per traveller across every trip so a
 * rank means something; swap this for a Supabase-backed store to share it
 * with the party.
 */
export const localRewardStore: RewardStore = {
  load: async ({ userId }) =>
    parseLedger(await AsyncStorage.getItem(`sidequest.rewards.v3:${userId}`)),
  save: async ({ userId }, ledger) =>
    AsyncStorage.setItem(
      `sidequest.rewards.v3:${userId}`,
      JSON.stringify(ledger),
    ),
};

let store: RewardStore = localRewardStore;
export const rewards: RewardStore = {
  load: (scope) => store.load(scope),
  save: (scope, ledger) => store.save(scope, ledger),
};
export function setRewardStore(next: RewardStore) {
  store = next;
}
