import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SideQuestColors as C } from "@/constants/theme";
import {
  answerScore,
  bingoLines,
  BOARD_BONUS,
  BINGO_BONUS,
  boardScore,
  emptyProgress,
  FAST_MS,
  parseProgress,
  scoreRound,
  spottingBoard,
  tripQuestions,
  type Answer,
  type GameProgress,
  type Rarity,
  type SpotTile,
} from "@/services/trip-games";
import {
  award,
  BADGES,
  emptyLedger,
  rankFor,
  rewards,
  type Badge,
  type Ledger,
  type RewardStats,
} from "@/services/rewards";
import type { PlanDetails } from "@/services/trip-planner";
import { ps, Option } from "./planner-ui";
import { BodyText, PixelButton } from "./sidequest-ui";

import { QuestRoundResults } from "./quest-round-results";

const SPEED_WINDOW = 8000;
const now = () => Date.now();
const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  legendary: "Legendary",
};
const RARITY_COLOR: Record<Rarity, string> = {
  common: C.textMuted,
  rare: C.cobalt,
  legendary: C.goldSoft,
};

/** The XP bar and rank that sit above every game. */
function RankHeader({ ledger }: { ledger: Ledger }) {
  const rank = rankFor(ledger.xp);
  return (
    <View style={[ps.card, { gap: 12 }]}>
      <View style={ps.row}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[ps.label, { fontSize: 17 }]}>
            Level {rank.level} · {rank.name}
          </Text>
          <Text style={ps.small}>
            {rank.xpForNext
              ? `${rank.xpForNext - rank.xpIntoRank} XP to ${rank.nextName}`
              : "Top rank. Nothing left to prove."}
          </Text>
        </View>
        <Text style={[ps.link, { fontSize: 20 }]}>{ledger.xp} XP</Text>
      </View>
      <View
        accessibilityLabel={`${Math.round(rank.progress * 100)} percent to the next rank`}
        style={{
          height: 9,
          borderRadius: 5,
          backgroundColor: C.surfaceSoft,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 9,
            width: `${Math.max(3, rank.progress * 100)}%`,
            backgroundColor: C.gold,
          }}
        />
      </View>
      <Text style={ps.small}>
        {ledger.badges.length} of {BADGES.length} badges earned
      </Text>
    </View>
  );
}

/** Announces a badge the moment it unlocks. */
function BadgeToast({ badges, onDismiss }: { badges: Badge[]; onDismiss: () => void }) {
  if (!badges.length) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Badge unlocked: ${badges.map((b) => b.name).join(", ")}. Tap to dismiss.`}
      accessibilityLiveRegion="polite"
      onPress={onDismiss}
      style={{
        borderRadius: 22,
        borderWidth: 1,
        borderColor: C.gold,
        backgroundColor: C.surfaceSoft,
        padding: 18,
        gap: 10,
      }}
    >
      <Text style={[ps.label, { color: C.goldSoft }]}>
        {badges.length === 1 ? "Badge unlocked" : `${badges.length} badges unlocked`}
      </Text>
      {badges.map((b) => (
        <View key={b.id} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 28 }}>{b.icon}</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={ps.label}>{b.name}</Text>
            <Text style={ps.small}>{b.detail}</Text>
          </View>
        </View>
      ))}
      <Text style={ps.small}>Tap to dismiss</Text>
    </Pressable>
  );
}

/**
 * The draining speed bonus. Remounted per question via a key, so it owns its
 * own clock and starts at zero without the parent resetting any state.
 */
function SpeedBar() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = now();
    const timer = setInterval(() => {
      const ms = now() - started;
      setElapsed(ms);
      if (ms >= SPEED_WINDOW) clearInterval(timer);
    }, 120);
    return () => clearInterval(timer);
  }, []);
  const bonus = elapsed <= FAST_MS ? 10 : elapsed < SPEED_WINDOW ? 5 : 0;
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: C.surfaceSoft,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 6,
            width: `${Math.max(0, 100 - (elapsed / SPEED_WINDOW) * 100)}%`,
            backgroundColor: bonus === 10 ? C.emerald : C.gold,
          }}
        />
      </View>
      <Text style={ps.small}>
        {bonus
          ? `Speed bonus +${bonus} XP`
          : "Speed bonus gone — take your time"}
      </Text>
    </View>
  );
}

export function TripGames({
  tripId,
  userId,
  plan,
  initialGame = "Trivia",
}: {
  tripId: string;
  userId: string;
  plan: PlanDetails;
  initialGame?: "Trivia" | "Spotting";
}) {
  const [game, setGame] = useState<"Trivia" | "Spotting" | "Trophies">(initialGame);
  const [progress, setProgress] = useState<GameProgress>(emptyProgress);
  const [ledger, setLedger] = useState<Ledger>(emptyLedger);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [toast, setToast] = useState<Badge[]>([]);

  const state = useRef(progress);
  const book = useRef(ledger);
  const writes = useRef(Promise.resolve());
  const asked = useRef(0);
  const key = `sidequest.games.v3:${userId}:${tripId}`;

  const questions = useMemo(
    () => tripQuestions(plan, progress.round),
    [plan, progress.round],
  );
  const board = useMemo(() => spottingBoard(plan, tripId), [plan, tripId]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      AsyncStorage.getItem(key).then(parseProgress),
      rewards.load({ userId, tripId }).catch(() => emptyLedger()),
    ])
      .then(([saved, book_]) => {
        if (!active) return;
        state.current = saved;
        book.current = book_;
        setProgress(saved);
        setLedger(book_);
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setError("Could not load saved progress. You can still play this session.");
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [key, tripId, userId]);

  const index = revealed ? progress.answers.length - 1 : progress.answers.length;
  const question = questions[index];
  const finished = progress.answers.length === questions.length && !revealed;

  // Restart the clock whenever a new question comes up.
  useEffect(() => {
    if (game !== "Trivia" || revealed || finished || !ready) return;
    asked.current = now();
  }, [game, revealed, finished, ready, index]);

  function persist(next: GameProgress) {
    state.current = next;
    setProgress(next);
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(key, JSON.stringify(next)))
      .catch(() => setError("Progress could not be saved on this device."));
  }

  function grant(xp: number, delta: Partial<RewardStats>) {
    const result = award(book.current, xp, delta);
    book.current = result.ledger;
    setLedger(result.ledger);
    if (result.unlocked.length) setToast(result.unlocked);
    writes.current = writes.current
      .then(() => rewards.save({ userId, tripId }, result.ledger))
      .catch(() => setError("Rewards could not be saved on this device."));
  }

  const streakBefore = (answers: Answer[]) => {
    let streak = 0;
    answers.forEach((a, i) => {
      streak = a.choice === questions[i]?.correct ? streak + 1 : 0;
    });
    return streak;
  };

  function answer(choice: number | null) {
    if (revealed || state.current.answers.length >= questions.length) return;
    const given: Answer = { choice, ms: now() - asked.current };
    const scored = answerScore(question, given, streakBefore(state.current.answers) + 1);
    const answers = [...state.current.answers, given];
    const round = scoreRound(questions, answers);
    const complete = answers.length === questions.length;
    persist({
      ...state.current,
      answers,
      bestRound: Math.max(state.current.bestRound, round.points),
    });
    grant(scored.points + (complete && round.perfect ? 50 : 0), {
      correct: scored.correct ? 1 : 0,
      fastAnswers: scored.fast ? 1 : 0,
      bestStreak: round.bestStreak,
      ...(complete ? { rounds: 1, perfectRounds: round.perfect ? 1 : 0 } : {}),
    });
    setRevealed(true);
  }

  function spot(tile: SpotTile) {
    const current = state.current;
    const already = current.spotted.includes(tile.id);
    const spotted = already
      ? current.spotted.filter((id) => id !== tile.id)
      : [...current.spotted, tile.id];
    const lines = bingoLines(board, spotted).length;
    const cleared = board.tiles.every((t) => spotted.includes(t.id));
    // Only pay out the first time a tile is marked, so undo cannot be farmed.
    const payTile = !already && !current.paid.includes(tile.id);
    const newLines = Math.max(0, lines - current.claimedLines);
    const payBoard = cleared && !current.boardCleared;
    persist({
      ...current,
      spotted,
      paid: payTile ? [...current.paid, tile.id] : current.paid,
      claimedLines: Math.max(current.claimedLines, lines),
      boardCleared: current.boardCleared || cleared,
    });
    const xp =
      (payTile ? tile.points : 0) +
      newLines * BINGO_BONUS +
      (payBoard ? BOARD_BONUS : 0);
    if (xp || payTile || newLines || payBoard)
      grant(xp, {
        spotted: payTile ? 1 : 0,
        rareSpotted: payTile && tile.rarity !== "common" ? 1 : 0,
        bingos: newLines,
        boardsCleared: payBoard ? 1 : 0,
      });
  }

  if (!ready) return <ActivityIndicator color={C.goldSoft} />;

  const lines = bingoLines(board, progress.spotted);
  const spotPoints = boardScore(board, progress.spotted);

  return (
    <View style={{ gap: 22 }}>
      <RankHeader ledger={ledger} />
      <BadgeToast badges={toast} onDismiss={() => setToast([])} />
      <View style={ps.options}>
        {(["Trivia", "Spotting", "Trophies"] as const).map((g) => (
          <Option key={g} label={g} selected={game === g} onPress={() => setGame(g)} />
        ))}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={ps.error}>
          {error}
        </Text>
      )}

      {game === "Trivia" && (
        <>
          <View style={{ gap: 6 }}>
            <Text style={[ps.label, { fontSize: 18 }]}>Road trivia</Text>
            <BodyText muted>
              Five questions drawn from your own plan and the country you’re driving
              through. Answer fast, keep the streak alive.
            </BodyText>
            <Text style={ps.small}>
              Round {progress.round + 1} · best round {progress.bestRound} XP
            </Text>
          </View>
          {finished ? (
            <QuestRoundResults
              questions={questions}
              answers={progress.answers}
              chapter={progress.round + 1}
              onNext={() => {
                setRevealed(false);
                persist({ ...state.current, answers: [], round: state.current.round + 1 });
              }}
            />
          ) : (
            <View style={ps.card}>
              <View style={ps.row}>
                <Text style={ps.small}>
                  QUESTION {index + 1} / {questions.length} ·{" "}
                  {question.kind === "route"
                    ? "YOUR TRIP"
                    : question.kind === "lore"
                      ? "ROAD LORE"
                      : "GENERAL"}{" "}
                  · {question.points} XP
                </Text>
                {streakBefore(progress.answers) > 1 && (
                  <Text style={[ps.link, { color: C.amber }]}>
                    🔥 {streakBefore(progress.answers)} streak
                  </Text>
                )}
              </View>
              {!revealed && <SpeedBar key={index} />}
              <Text style={[ps.title, { fontSize: 24, lineHeight: 30 }]}>
                {question.question}
              </Text>
              {question.options.map((option, i) => {
                const chosen = revealed && progress.answers[index]?.choice === i;
                const right = revealed && i === question.correct;
                return (
                  <Pressable
                    key={option + i}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: revealed, selected: chosen }}
                    disabled={revealed}
                    onPress={() => answer(i)}
                    style={({ pressed }) => [
                      ps.input,
                      {
                        backgroundColor: right
                          ? C.surfaceSoft
                          : chosen
                            ? "#F6E7E9"
                            : C.surface,
                        borderColor: right
                          ? C.emerald
                          : chosen
                            ? C.red
                            : C.borderStrong,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={ps.label}>
                      {option}
                      {right ? "  ✓" : chosen ? "  ✗" : ""}
                    </Text>
                  </Pressable>
                );
              })}
              {revealed ? (
                <>
                  <Text accessibilityLiveRegion="polite" style={[ps.label, { fontSize: 16 }]}>
                    {progress.answers[index]?.choice === question.correct
                      ? `Correct · +${answerScore(question, progress.answers[index], streakBefore(progress.answers.slice(0, index)) + 1).points} XP`
                      : progress.answers[index]?.choice === null
                        ? "Skipped"
                        : "Not this time"}
                  </Text>
                  <BodyText muted>{question.explanation}</BodyText>
                  {!!question.source && (
                    <Text style={[ps.small, { fontSize: 11 }]}>
                      Source: {question.source}
                    </Text>
                  )}
                  <PixelButton
                    raised
                    label={
                      progress.answers.length === questions.length
                        ? "See your round"
                        : "Next question"
                    }
                    onPress={() => setRevealed(false)}
                  />
                </>
              ) : (
                <PixelButton
                  label="Skip this one"
                  variant="ghost"
                  onPress={() => answer(null)}
                />
              )}
            </View>
          )}
        </>
      )}

      {game === "Spotting" && (
        <>
          <View style={{ gap: 6 }}>
            <Text style={[ps.label, { fontSize: 18 }]}>Spot it before they do</Text>
            <BodyText muted>
              Nine things to find between {plan.origin.name} and{" "}
              {plan.destination.name}. Rarer sightings are worth more. Complete a
              row, column or diagonal for a bingo.
            </BodyText>
            <Text accessibilityLiveRegion="polite" style={[ps.link, { fontSize: 16 }]}>
              {progress.spotted.length} / 9 spotted · {spotPoints} XP earned
              {lines.length ? ` · ${lines.length} bingo!` : ""}
            </Text>
          </View>
          {board.tiles.every((t) => progress.spotted.includes(t.id)) && (
            <View
              style={{
                borderRadius: 22,
                borderWidth: 1,
                borderColor: C.gold,
                backgroundColor: C.surfaceSoft,
                padding: 18,
                gap: 6,
              }}
            >
              <Text style={[ps.label, { fontSize: 18, color: C.goldSoft }]}>
                🏆 Full board
              </Text>
              <Text style={ps.small}>
                Every square found. That is not a normal drive.
              </Text>
            </View>
          )}
          {board.legs.map((leg, legIndex) => {
            const locked = legIndex > progress.leg;
            return (
              <View key={leg.name} style={{ gap: 10, opacity: locked ? 0.55 : 1 }}>
                <View style={ps.row}>
                  <Text style={[ps.label, { flex: 1 }]}>
                    {locked ? "🔒 " : ""}
                    Leg {legIndex + 1} · {leg.name}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {leg.tiles.map((tile) => {
                    const found = progress.spotted.includes(tile.id);
                    return (
                      <Pressable
                        key={tile.id}
                        accessibilityRole="checkbox"
                        accessibilityLabel={`${tile.label}. ${RARITY_LABEL[tile.rarity]}, ${tile.points} XP. ${tile.hint}`}
                        accessibilityState={{ checked: found, disabled: locked }}
                        disabled={locked}
                        onPress={() => spot(tile)}
                        style={({ pressed }) => ({
                          flex: 1,
                          minHeight: 132,
                          padding: 10,
                          borderRadius: 18,
                          borderWidth: found ? 2 : 1,
                          borderColor: found ? C.emerald : C.borderStrong,
                          backgroundColor: found ? C.surfaceSoft : C.surface,
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 7,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text
                          style={{
                            color: found ? C.emerald : RARITY_COLOR[tile.rarity],
                            fontSize: 20,
                          }}
                        >
                          {found ? "✓" : tile.rarity === "legendary" ? "★" : "○"}
                        </Text>
                        <Text
                          style={[ps.label, { textAlign: "center", fontSize: 13 }]}
                        >
                          {tile.label}
                        </Text>
                        <Text
                          style={[
                            ps.small,
                            {
                              fontSize: 10,
                              textAlign: "center",
                              color: RARITY_COLOR[tile.rarity],
                            },
                          ]}
                        >
                          {RARITY_LABEL[tile.rarity]} · {tile.points}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {!locked && (
                  <Text style={[ps.small, { fontSize: 11 }]}>
                    {leg.tiles.map((t) => t.hint).join(" · ")}
                  </Text>
                )}
              </View>
            );
          })}
          {progress.leg < board.legs.length - 1 ? (
            <PixelButton
              raised label={`We've reached ${board.legs[progress.leg + 1].where}`}
              accessibilityHint="Unlocks the next three squares"
              onPress={() => persist({ ...state.current, leg: state.current.leg + 1 })}
            />
          ) : (
            <Text style={ps.small}>
              Every leg is open. Tapped the wrong square? Tap it again to undo — the
              XP stays put.
            </Text>
          )}
          <PixelButton
            label="Reset the board"
            variant="ghost"
            onPress={() =>
              persist({
                ...state.current,
                spotted: [],
                leg: 0,
                claimedLines: 0,
                boardCleared: false,
              })
            }
          />
        </>
      )}

      {game === "Trophies" && (
        <>
          <View style={{ gap: 6 }}>
            <Text style={[ps.label, { fontSize: 18 }]}>Trophy case</Text>
            <BodyText muted>
              Earned across every trip you play. Your party will see these once
              rewards go shared.
            </BodyText>
          </View>
          {BADGES.map((badge) => {
            const earned = ledger.badges.includes(badge.id);
            return (
              <View
                key={badge.id}
                accessibilityLabel={`${badge.name}. ${badge.detail} ${earned ? "Earned." : "Not earned yet."}`}
                style={{
                  flexDirection: "row",
                  gap: 14,
                  alignItems: "center",
                  padding: 14,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: earned ? C.gold : C.border,
                  backgroundColor: earned ? C.surfaceSoft : C.surface,
                }}
              >
                <Text style={{ fontSize: 30, opacity: earned ? 1 : 0.3 }}>
                  {earned ? badge.icon : "🔒"}
                </Text>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[ps.label, earned && { color: C.goldSoft }]}>
                    {badge.name}
                  </Text>
                  <Text style={ps.small}>{badge.detail}</Text>
                </View>
              </View>
            );
          })}
          <View style={ps.divider}>
            <Text style={ps.label}>Your numbers</Text>
            {(
              [
                ["Rounds played", ledger.stats.rounds],
                ["Correct answers", ledger.stats.correct],
                ["Best streak", ledger.stats.bestStreak],
                ["Answered in under 4s", ledger.stats.fastAnswers],
                ["Things spotted", ledger.stats.spotted],
                ["Rare sightings", ledger.stats.rareSpotted],
                ["Bingos", ledger.stats.bingos],
              ] as const
            ).map(([label, value]) => (
              <View key={label} style={ps.row}>
                <Text style={ps.small}>{label}</Text>
                <Text style={ps.label}>{value}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      <Text style={ps.small}>
        For passengers, or when you’re parked. Progress stays on this device for now.
      </Text>
    </View>
  );
}
