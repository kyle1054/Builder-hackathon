import { LANDMARK_FACTS } from "@/constants/landmark-facts";
import type { PlanDetails } from "./trip-planner";

/* ------------------------------------------------------------------ seeding */

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
/** Small deterministic PRNG so a trip's board and questions are stable. */
function random(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled<T>(items: T[], next: () => number): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/* ------------------------------------------------------------------- trivia */

export type QuestionKind = "route" | "lore" | "world";
export type QuizQuestion = {
  id: string;
  kind: QuestionKind;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  points: number;
  source?: string;
};
export const QUESTIONS_PER_ROUND = 5;
const POINTS: Record<QuestionKind, number> = { route: 10, world: 15, lore: 20 };

/**
 * Shuffle the options so the answer is never in a predictable slot. Plans vary
 * wildly — one stop, four interests, a five-minute coffee — so a question whose
 * decoys collapse into the answer is dropped rather than shown with two
 * choices. Callers filter the nulls out.
 */
function build(
  base: Omit<QuizQuestion, "options" | "correct" | "points"> & {
    answer: string;
    wrong: string[];
  },
  next: () => number,
): QuizQuestion | null {
  const distinct = [
    ...new Set([base.answer, ...base.wrong].map((o) => o.trim()).filter(Boolean)),
  ];
  if (distinct.length < 3) return null;
  const options = shuffled(distinct.slice(0, 3), next);
  return {
    id: base.id,
    kind: base.kind,
    question: base.question,
    explanation: base.explanation,
    source: base.source,
    points: POINTS[base.kind],
    options,
    correct: options.indexOf(base.answer),
  };
}
const asked = (list: (QuizQuestion | null)[]) =>
  list.filter((q): q is QuizQuestion => q !== null);

/** Questions drawn from the traveller's own saved plan. */
function routeQuestions(plan: PlanDetails, next: () => number): QuizQuestion[] {
  const stops = plan.activities.filter((a) => a.included);
  const other = plan.activities.filter((a) => !a.included);
  const days =
    Math.round(
      (Date.parse(plan.endDate) - Date.parse(plan.startDate)) / 86400000,
    ) + 1;
  const questions: (QuizQuestion | null)[] = [
    build(
      {
        id: "route-destination",
        kind: "route",
        question: "Where does today's road end?",
        answer: plan.destination.name,
        wrong: [
          plan.origin.name,
          ...stops.map((s) => s.place.name),
          "Back where we started",
        ],
        explanation: `Your plan finishes at ${plan.destination.name}.`,
      },
      next,
    ),
  ];
  if (stops.length) {
    const longest = stops.reduce((a, b) => (b.duration > a.duration ? b : a));
    questions.push(
      build(
        {
          id: "route-longest",
          kind: "route",
          question: "Which stop gets the most time on the plan?",
          answer: longest.title,
          wrong: [
            ...plan.activities.filter((a) => a.id !== longest.id).map((a) => a.title),
            "None of them — we're driving straight through",
          ],
          explanation: `${longest.title} is booked for ${longest.duration} minutes — the longest stop of the day.`,
        },
        next,
      ),
      build(
        {
          id: "route-duration",
          kind: "route",
          question: `How long are we stopping at ${longest.title.toLowerCase()}?`,
          answer: `${longest.duration} minutes`,
          wrong: [
            `${longest.duration + 15} minutes`,
            `${longest.duration + 40} minutes`,
            `${Math.max(5, longest.duration - 10)} minutes`,
          ],
          explanation: `The plan allows ${longest.duration} minutes there. Nobody is counting too closely.`,
        },
        next,
      ),
    );
  }
  if (stops.length > 1)
    questions.push(
      build(
        {
          id: "route-count",
          kind: "route",
          question: "How many stops are on the itinerary?",
          answer: `${stops.length}`,
          wrong: [`${stops.length + 1}`, `${Math.max(1, stops.length - 1)}`],
          explanation: `${stops.length} stops made the cut: ${stops.map((s) => s.place.name).join(", ")}.`,
        },
        next,
      ),
    );
  if (other.length)
    questions.push(
      build(
        {
          id: "route-cut",
          kind: "route",
          question: "Which of these did we leave off the plan?",
          answer: other[0].title,
          wrong: [
            ...stops.map((s) => s.title),
            ...other.slice(1).map((o) => o.title),
            "Nothing — every suggestion made the cut",
          ],
          explanation: `${other[0].title} is still a suggestion — add it if the day runs long.`,
        },
        next,
      ),
    );
  questions.push(
    build(
      {
        id: "route-pace",
        kind: "route",
        question: "What pace did this party sign up for?",
        answer:
          plan.pace === "relaxed"
            ? "Relaxed"
            : plan.pace === "packed"
              ? "Packed"
              : "Balanced",
        wrong: (["Relaxed", "Balanced", "Packed"] as const).filter(
          (p) => p.toLowerCase() !== plan.pace,
        ),
        explanation: `You chose a ${plan.pace} pace when you built this trip.`,
      },
      next,
    ),
  );
  if (days > 1)
    questions.push(
      build(
        {
          id: "route-days",
          kind: "route",
          question: "How many days are we away for?",
          answer: `${days} days`,
          wrong: [`${days + 1} days`, `${Math.max(1, days - 1)} days`],
          explanation: `${plan.startDate} to ${plan.endDate} — ${days} days on the road.`,
        },
        next,
      ),
    );
  if (plan.interests.length)
    questions.push(
      build(
        {
          id: "route-interest",
          kind: "route",
          question: "Which of these is this trip actually about?",
          answer: plan.interests[0],
          wrong: (["Scenic", "Food", "Local lore", "Curiosity"] as const).filter(
            (i) => !plan.interests.includes(i),
          ),
          explanation: `You picked ${plan.interests.join(", ")} when planning.`,
        },
        next,
      ),
    );
  return asked(questions);
}

/** Overberg road lore. The first two come from the sourced landmark facts. */
function loreQuestions(next: () => number): QuizQuestion[] {
  const kogelberg = LANDMARK_FACTS.find((f) => f.id === "kogelberg");
  const hermanus = LANDMARK_FACTS.find((f) => f.id === "hermanus");
  const list: (QuizQuestion | null)[] = [];
  if (kogelberg)
    list.push(
      build(
        {
          id: "lore-kogelberg",
          kind: "lore",
          question:
            "Roughly how many plant species in the Kogelberg grow naturally nowhere else on earth?",
          answer: "About 150",
          wrong: ["About 15", "About 1,500"],
          explanation: kogelberg.body,
          source: kogelberg.source,
        },
        next,
      ),
    );
  if (hermanus)
    list.push(
      build(
        {
          id: "lore-whale-crier",
          kind: "lore",
          question: "What does the Hermanus Whale Crier use to announce a sighting?",
          answer: "A kelp horn",
          wrong: ["A brass bell", "A signal flag"],
          explanation: hermanus.body,
          source: hermanus.source,
        },
        next,
      ),
    );
  return asked([
    ...list,
    build(
      {
        id: "lore-agulhas",
        kind: "lore",
        question: "Cape Agulhas, just down the coast, is the southernmost point of what?",
        answer: "Africa",
        wrong: ["South Africa only", "The Western Cape"],
        explanation:
          "Cape Agulhas — not Cape Point — is the true southern tip of the African continent.",
      },
      next,
    ),
    build(
      {
        id: "lore-fynbos",
        kind: "lore",
        question: "The Cape Floral Region is the world's smallest what?",
        answer: "Floral kingdom",
        wrong: ["Rainforest", "Desert"],
        explanation:
          "There are six floral kingdoms on earth. This one is the smallest, and the only one contained within a single country.",
      },
      next,
    ),
    build(
      {
        id: "lore-fire",
        kind: "lore",
        question: "What does fynbos actually need in order to regenerate?",
        answer: "Fire",
        wrong: ["Frost", "Flooding"],
        explanation:
          "Many fynbos species only release their seed after a burn. The veld you're driving past is built to burn and come back.",
      },
      next,
    ),
    build(
      {
        id: "lore-elgin",
        kind: "lore",
        question: "Elgin Valley supplies a large share of South Africa's what?",
        answer: "Apples",
        wrong: ["Olives", "Rice"],
        explanation:
          "The cool, high valley is the country's best-known apple growing region — hence all the orchards out the window.",
      },
      next,
    ),
    build(
      {
        id: "lore-bbos",
        kind: "lore",
        question:
          "Baardskeerdersbos is named after a creature said to do what?",
        answer: "Snip hair for its nest",
        wrong: ["Sing at sunset", "Dig up fence posts"],
        explanation:
          "The 'baardskeerder' is a sun spider. Local lore says it shears hair or beard clippings to line its burrow. Its reputation is worse than it deserves.",
      },
      next,
    ),
    build(
      {
        id: "lore-whales",
        kind: "lore",
        question: "Southern right whales show up along this coast mainly in which months?",
        answer: "June to November",
        wrong: ["January to March", "All year round"],
        explanation:
          "They come up from the Southern Ocean to calve in the sheltered bays through the southern winter and spring.",
      },
      next,
    ),
    build(
      {
        id: "lore-houwhoek",
        kind: "lore",
        question: "What makes Houw Hoek Pass notable?",
        answer: "It's one of the oldest passes still in use in the country",
        wrong: [
          "It's the highest pass in South Africa",
          "It's the only toll pass in the Western Cape",
        ],
        explanation:
          "Wagons were crossing Houw Hoek long before tar. You're driving a very old route.",
      },
      next,
    ),
  ]);
}

/** Good car questions: quick to argue about, satisfying to get right. */
function worldQuestions(next: () => number): QuizQuestion[] {
  return asked([
    build(
      {
        id: "world-padkos",
        kind: "world",
        question: "Someone offers you padkos. What are you getting?",
        answer: "Food for the road",
        wrong: ["A shortcut", "A parking spot"],
        explanation:
          "Literally 'road food'. Sandwiches, boiled eggs, biltong — whatever survives the back seat.",
      },
      next,
    ),
    build(
      {
        id: "world-troop",
        kind: "world",
        question: "What do you call a group of baboons?",
        answer: "A troop",
        wrong: ["A clatter", "A parade"],
        explanation:
          "A troop. If one is on the road, keep your windows up and your snacks out of sight.",
      },
      next,
    ),
    build(
      {
        id: "world-timezone",
        kind: "world",
        question: "How many time zones does South Africa have?",
        answer: "One",
        wrong: ["Two", "Three"],
        explanation:
          "One, for the whole mainland. Drive as far as you like today — the clock stays put.",
      },
      next,
    ),
    build(
      {
        id: "world-yellowline",
        kind: "world",
        question: "On an open road, what is the yellow line on the left for?",
        answer: "A shoulder, not a driving lane",
        wrong: ["An overtaking lane", "A bus lane"],
        explanation:
          "Drivers often ease left to let others pass, but it's a shoulder — pedestrians and cyclists use it.",
      },
      next,
    ),
    build(
      {
        id: "world-desert",
        kind: "world",
        question: "Which continent has no desert at all?",
        answer: "Europe",
        wrong: ["South America", "Australia"],
        explanation:
          "Every other continent has one — Antarctica is the largest desert on earth.",
      },
      next,
    ),
    build(
      {
        id: "world-tortoise",
        kind: "world",
        question: "You find a tortoise crossing the road. What's the right move?",
        answer: "Move it across in the direction it was already heading",
        wrong: ["Take it home to safety", "Turn it back the way it came"],
        explanation:
          "It knows where it's going. Put it down on the far verge facing the same way, and don't relocate it.",
      },
      next,
    ),
    build(
      {
        id: "world-protea",
        kind: "world",
        question: "Which flower is South Africa's national flower?",
        answer: "The king protea",
        wrong: ["The strelitzia", "The arum lily"],
        explanation:
          "The king protea. You're driving through the part of the country where it grows wild.",
      },
      next,
    ),
    build(
      {
        id: "world-ostrich",
        kind: "world",
        question: "An ostrich's top speed is closest to what?",
        answer: "70 km/h",
        wrong: ["30 km/h", "120 km/h"],
        explanation:
          "About 70 km/h. It would still be a speeding fine in most towns you'll pass through.",
      },
      next,
    ),
    build(
      {
        id: "world-braai",
        kind: "world",
        question: "In a braai, what is 'the coals are ready' actually judged by?",
        answer: "A grey ash coating over glowing coals",
        wrong: ["Tall orange flames", "Smoke turning white"],
        explanation:
          "Flames char the outside and leave the middle raw. Wait for the grey ash.",
      },
      next,
    ),
    build(
      {
        id: "world-windfarm",
        kind: "world",
        question: "Roughly how long is one blade on a large wind turbine?",
        answer: "About as long as a cricket pitch and a half",
        wrong: ["About the length of a car", "About the length of a bus"],
        explanation:
          "Modern blades run 50–80 metres. They look slow from the road because they're enormous.",
      },
      next,
    ),
  ]);
}

/**
 * A round of five: route questions first so the trip is always in the game,
 * then lore and general questions, re-drawn every round.
 */
export function tripQuestions(plan: PlanDetails, round = 0): QuizQuestion[] {
  const next = random(`${plan.name}|${plan.destination.name}|round:${round}`);
  const route = shuffled(routeQuestions(plan, next), next).slice(0, 2);
  const rest = shuffled([...loreQuestions(next), ...worldQuestions(next)], next);
  return [...route, ...rest].slice(0, QUESTIONS_PER_ROUND);
}

/* ------------------------------------------------------------- trivia scoring */

export type Answer = { choice: number | null; ms: number };
export const FAST_MS = 4000;
const STREAK_BONUS = [0, 0, 5, 10, 15, 15];

/** Points for one answer: the question's value, plus speed and streak bonuses. */
export function answerScore(
  question: QuizQuestion,
  answer: Answer,
  streak: number,
) {
  if (answer.choice !== question.correct)
    return { points: 0, speed: 0, streak: 0, correct: false, fast: false };
  const fast = answer.ms <= FAST_MS;
  const speed = fast ? 10 : answer.ms <= 8000 ? 5 : 0;
  const bonus = STREAK_BONUS[Math.min(streak, STREAK_BONUS.length - 1)];
  return {
    points: question.points + speed + bonus,
    speed,
    streak: bonus,
    correct: true,
    fast,
  };
}

export function scoreRound(questions: QuizQuestion[], answers: Answer[]) {
  let points = 0,
    correct = 0,
    fast = 0,
    streak = 0,
    bestStreak = 0;
  answers.forEach((answer, i) => {
    const question = questions[i];
    if (!question) return;
    const result = answerScore(question, answer, streak + 1);
    points += result.points;
    if (result.correct) {
      correct += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      if (result.fast) fast += 1;
    } else streak = 0;
  });
  return {
    points,
    correct,
    fast,
    bestStreak,
    perfect: correct === questions.length && questions.length > 0,
  };
}

/** The best a round could possibly be worth, for the "x / y" readout. */
export const maxRoundScore = (questions: QuizQuestion[]) =>
  questions.reduce(
    (total, q, i) => total + q.points + 10 + STREAK_BONUS[Math.min(i + 1, 5)],
    0,
  );

/* ----------------------------------------------------------- spotting board */

export type Rarity = "common" | "rare" | "legendary";
export type SpotTile = {
  id: string;
  label: string;
  hint: string;
  rarity: Rarity;
  points: number;
};
export type BoardLeg = { name: string; where: string; tiles: SpotTile[] };
export type Board = { legs: BoardLeg[]; tiles: SpotTile[] };

export const RARITY_POINTS: Record<Rarity, number> = {
  common: 10,
  rare: 25,
  legendary: 60,
};
export const BINGO_BONUS = 75;
export const BOARD_BONUS = 150;

const TILE_POOL: Omit<SpotTile, "points">[] = [
  { id: "windmill", label: "A windpomp", hint: "The old steel water pumps on the farms", rarity: "common" },
  { id: "farmstall", label: "A farmstall sign", hint: "Hand-painted, usually promising pies", rarity: "common" },
  { id: "bakkie", label: "A bakkie with a dog", hint: "Ears out, riding in the back", rarity: "common" },
  { id: "sheep", label: "Sheep", hint: "A whole field counts as one", rarity: "common" },
  { id: "vines", label: "Vineyards", hint: "Rows running up a slope", rarity: "common" },
  { id: "dam", label: "A farm dam", hint: "Still water behind an earth wall", rarity: "common" },
  { id: "steeple", label: "A church steeple", hint: "White, pointed, visible from far off", rarity: "common" },
  { id: "tractor", label: "A tractor", hint: "Bonus points if it's holding up traffic", rarity: "common" },
  { id: "bales", label: "Hay bales", hint: "Round or square, your call", rarity: "common" },
  { id: "bridge", label: "A river bridge", hint: "Look for the name plate", rarity: "common" },
  { id: "orchard", label: "An orchard in rows", hint: "Apples and pears through Elgin", rarity: "common" },
  { id: "cyclist", label: "A cyclist", hint: "Give them a wide berth", rarity: "common" },
  { id: "turbine", label: "A wind turbine", hint: "Bigger than it looks from the road", rarity: "rare" },
  { id: "raptor", label: "A bird of prey on a pole", hint: "Sitting still, watching the verge", rarity: "rare" },
  { id: "horse", label: "A horse and rider", hint: "Off the tar, on the shoulder", rarity: "rare" },
  { id: "vintage", label: "A car older than you", hint: "Pre-1980, be honest", rarity: "rare" },
  { id: "honey", label: "Roadside honey for sale", hint: "A table, a jar, an honesty box", rarity: "rare" },
  { id: "rainbow", label: "A rainbow", hint: "Sun behind you, rain ahead", rarity: "rare" },
  { id: "tortoisesign", label: "A tortoise crossing sign", hint: "Yes, they really exist here", rarity: "rare" },
  { id: "whalesign", label: "A whale watching sign", hint: "Blue board, white tail", rarity: "rare" },
  { id: "ostrich", label: "An ostrich", hint: "Farmed or wild, both count", rarity: "rare" },
  { id: "baboon", label: "A baboon by the road", hint: "Windows up. Snacks away.", rarity: "legendary" },
  { id: "whale", label: "A whale spout from the road", hint: "Winter and spring only", rarity: "legendary" },
  { id: "tortoise", label: "A tortoise actually crossing", hint: "Help it along the way it was facing", rarity: "legendary" },
  { id: "proteas", label: "Proteas in flower", hint: "Pink and enormous, on the fynbos slopes", rarity: "legendary" },
];

const priced = (tile: Omit<SpotTile, "points">): SpotTile => ({
  ...tile,
  points: RARITY_POINTS[tile.rarity],
});

/**
 * A nine-tile board split into three legs of the actual route. Later legs stay
 * locked until the party says they've passed the stop before them, so the
 * board unfolds as the drive does.
 */
export function spottingBoard(plan: PlanDetails, seed = ""): Board {
  const next = random(`${plan.name}|${plan.destination.name}|board|${seed}`);
  const pick = (rarity: Rarity, count: number) =>
    shuffled(
      TILE_POOL.filter((t) => t.rarity === rarity),
      next,
    )
      .slice(0, count)
      .map(priced);
  const commons = pick("common", 5);
  const rares = pick("rare", 3);
  const legendary = pick("legendary", 1);
  const stops = plan.activities.filter((a) => a.included);
  const names = [
    { name: `Leaving ${plan.origin.name}`, where: plan.origin.name },
    ...stops.map((s) => ({ name: `Past ${s.place.name}`, where: s.place.name })),
    {
      name: `The run into ${plan.destination.name}`,
      where: plan.destination.name,
    },
  ];
  // Three legs: the first, the last, and one from the middle if there is one.
  const legNames = [
    names[0],
    names.length > 2 ? names[Math.floor((names.length - 1) / 2)] : names[0],
    names[names.length - 1],
  ];
  const grouped = [
    [commons[0], commons[1], rares[0]],
    [commons[2], rares[1], commons[3]],
    [rares[2], commons[4], legendary[0]],
  ];
  return {
    legs: legNames.map((leg, i) => ({ ...leg, tiles: grouped[i] })),
    tiles: grouped.flat(),
  };
}

export const BINGO_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/** Completed lines, as indexes into board.tiles. */
export function bingoLines(board: Board, spotted: string[]) {
  return BINGO_LINES.filter((line) =>
    line.every((i) => board.tiles[i] && spotted.includes(board.tiles[i].id)),
  );
}

export const boardScore = (board: Board, spotted: string[]) =>
  board.tiles
    .filter((t) => spotted.includes(t.id))
    .reduce((total, t) => total + t.points, 0) +
  bingoLines(board, spotted).length * BINGO_BONUS +
  (board.tiles.every((t) => spotted.includes(t.id)) ? BOARD_BONUS : 0);

/* --------------------------------------------------------------- persistence */

export type GameProgress = {
  version: 3;
  round: number;
  answers: Answer[];
  spotted: string[];
  paid: string[];
  leg: number;
  claimedLines: number;
  boardCleared: boolean;
  bestRound: number;
};
export const emptyProgress = (): GameProgress => ({
  version: 3,
  round: 0,
  answers: [],
  spotted: [],
  paid: [],
  leg: 0,
  claimedLines: 0,
  boardCleared: false,
  bestRound: 0,
});

const ids = (value: unknown) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (v): v is string =>
              typeof v === "string" && TILE_POOL.some((t) => t.id === v),
          ),
        ),
      ]
    : [];

export function parseProgress(value: string | null): GameProgress {
  try {
    const p = JSON.parse(value ?? "null");
    if (p?.version !== 3) return emptyProgress();
    return {
      version: 3,
      round: Math.max(0, Math.min(9999, Number(p.round) || 0)),
      answers: Array.isArray(p.answers)
        ? p.answers
            .slice(0, QUESTIONS_PER_ROUND)
            .filter(
              (a: unknown): a is Answer =>
                !!a &&
                typeof a === "object" &&
                (("choice" in a && (a as Answer).choice === null) ||
                  Number.isInteger((a as Answer).choice)),
            )
            .map((a: Answer) => ({
              choice: a.choice === null ? null : Math.max(0, Math.min(2, a.choice)),
              ms: Math.max(0, Math.min(600000, Number(a.ms) || 0)),
            }))
        : [],
      spotted: ids(p.spotted),
      paid: ids(p.paid),
      leg: Math.max(0, Math.min(2, Number(p.leg) || 0)),
      claimedLines: Math.max(0, Math.min(8, Number(p.claimedLines) || 0)),
      boardCleared: p.boardCleared === true,
      bestRound: Math.max(0, Math.min(10000, Number(p.bestRound) || 0)),
    };
  } catch {
    return emptyProgress();
  }
}
