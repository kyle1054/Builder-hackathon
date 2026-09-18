import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SideQuestColors as C } from "@/constants/theme";
import { scoreRound, type Answer, type QuizQuestion } from "@/services/trip-games";
import { PixelButton } from "./sidequest-ui";

/** A completed chapter: rewards first, optional field notes below. */
export function QuestRoundResults({ questions, answers, chapter, onNext }: {
  questions: QuizQuestion[];
  answers: Answer[];
  chapter: number;
  onNext: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const round = scoreRound(questions, answers);
  return (
    <View style={s.book}>
      <View style={s.heading}>
        <Text style={s.kicker}>QUEST JOURNAL</Text>
        <Text style={s.chapter}>CH. {String(chapter).padStart(2, "0")}</Text>
      </View>
      <View style={s.intro}>
        <Text style={s.title}>Chapter complete.</Text>
        <Text style={s.subtitle}>{round.perfect ? "Every answer found. A clean sweep." : "A few more stories for the road."}</Text>
      </View>
      <View style={s.reward}>
        <View style={s.seal}><Text style={s.sealMark}>✦</Text></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.kicker}>ROUND REWARD</Text>
          <Text style={s.xp}>+{round.points + (round.perfect ? 50 : 0)} XP</Text>
          {round.perfect && <Text style={s.bonus}>Includes 50 XP clean sweep bonus</Text>}
        </View>
      </View>
      <View style={s.stats}>
        {[{ value: `${round.correct}/${questions.length}`, label: "Correct" }, { value: round.bestStreak, label: "Best streak" }, { value: round.fast, label: "Quick answers" }].map(stat => (
          <View key={stat.label} style={s.stat}><Text style={s.statValue}>{stat.value}</Text><Text style={s.statLabel}>{stat.label}</Text></View>
        ))}
      </View>
      <View style={s.logHeader}><Text style={s.kicker}>YOUR FIELD NOTES</Text><Text style={s.hint}>Tap to read</Text></View>
      {questions.map((q, i) => {
        const correct = answers[i]?.choice === q.correct;
        const skipped = answers[i]?.choice == null;
        const expanded = open === q.id;
        return (
          <View key={q.id} style={s.entry}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel={`${i + 1}. ${q.question}. ${correct ? "Solved" : skipped ? "Skipped" : "Missed"}`} onPress={() => setOpen(expanded ? null : q.id)} style={({ pressed }) => [s.entryButton, pressed && { backgroundColor: C.surfaceSoft }]}>
              <View style={[s.number, correct && s.numberSolved]}><Text style={[s.numberText, correct && { color: C.white }]}>{correct ? "✓" : String(i + 1).padStart(2, "0")}</Text></View>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={[s.status, { color: correct ? C.emerald : C.textMuted }]}>{correct ? "SOLVED" : skipped ? "SKIPPED" : "MISSED"} · {q.kind === "route" ? "YOUR ROUTE" : q.kind === "lore" ? "LOCAL LORE" : "WORLD"}</Text>
                <Text style={s.question}>{q.question}</Text>
              </View>
              <Text style={s.expand}>{expanded ? "−" : "+"}</Text>
            </Pressable>
            {expanded && <View style={s.notes}>
              {!correct && !skipped && <Text style={s.note}>Your answer: {q.options[answers[i].choice!]}</Text>}
              <Text style={s.answer}>{q.options[q.correct]}</Text>
              <Text style={s.note}>{q.explanation}</Text>
              {!!q.source && <Text style={s.source}>Source · {q.source}</Text>}
            </View>}
          </View>
        );
      })}
      <View style={s.footer}><PixelButton raised label="Next chapter →" onPress={onNext} /><Text style={s.footerNote}>Five new questions. Another little adventure.</Text></View>
    </View>
  );
}
const s = StyleSheet.create({
  book: { backgroundColor: "#FFFCF4", borderWidth: 1, borderColor: C.borderStrong, borderLeftWidth: 5, borderLeftColor: C.gold, borderRadius: 18, overflow: "hidden" },
  heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: C.borderStrong },
  kicker: { fontSize: 10, letterSpacing: 1.5, fontWeight: "800", color: C.goldSoft },
  chapter: { fontSize: 11, fontWeight: "700", color: C.textMuted, fontVariant: ["tabular-nums"] },
  intro: { padding: 20, gap: 6 },
  title: { fontSize: 27, lineHeight: 33, fontWeight: "700", color: C.text, letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 21, color: C.textMuted },
  reward: { marginHorizontal: 20, paddingVertical: 15, flexDirection: "row", alignItems: "center", gap: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.gold },
  seal: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.gold, borderWidth: 2, borderColor: C.goldSoft, alignItems: "center", justifyContent: "center" },
  sealMark: { fontSize: 31, color: C.ink },
  xp: { fontSize: 32, fontWeight: "800", color: C.text, fontVariant: ["tabular-nums"] },
  bonus: { fontSize: 11, color: C.emerald },
  stats: { flexDirection: "row", paddingVertical: 20, marginHorizontal: 14 },
  stat: { flex: 1, alignItems: "center", gap: 5 },
  statValue: { color: C.text, fontSize: 20, fontWeight: "700" },
  statLabel: { color: C.textMuted, fontSize: 10, textAlign: "center" },
  logHeader: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: C.surfaceSoft, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hint: { fontSize: 11, color: C.textMuted },
  entry: { borderBottomWidth: 1, borderColor: C.border },
  entryButton: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 17, minHeight: 72 },
  number: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: C.borderStrong, alignItems: "center", justifyContent: "center" },
  numberSolved: { backgroundColor: C.emerald, borderColor: C.emerald },
  numberText: { fontSize: 12, fontWeight: "700", color: C.textMuted },
  status: { fontSize: 9, letterSpacing: 0.7, fontWeight: "700" },
  question: { color: C.text, fontWeight: "600", fontSize: 14, lineHeight: 20 },
  expand: { color: C.goldSoft, fontSize: 22 },
  notes: { marginLeft: 58, paddingRight: 20, paddingBottom: 20, gap: 8 },
  answer: { color: C.emerald, fontWeight: "700", fontSize: 15, lineHeight: 21 },
  note: { color: C.textMuted, fontSize: 13, lineHeight: 20 },
  source: { color: C.textMuted, fontSize: 11, lineHeight: 17 },
  footer: { padding: 20, gap: 14 },
  footerNote: { color: C.textMuted, fontSize: 11, textAlign: "center" },
});
