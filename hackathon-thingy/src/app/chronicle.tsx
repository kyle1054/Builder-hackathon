import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthGate } from '@/components/auth-gate';
import { BodyText, Eyebrow, PixelButton, QuestScreen, SectionHeading, Surface, Title } from '@/components/sidequest-ui';
import { SideQuestColors } from '@/constants/theme';
import { DemoMemory, useDemoJourney } from '@/context/demo-journey';

const tones = { amber: ['#906142', '#34261E'], blue: ['#487A96', '#172B38'], green: ['#4D7D67', '#172A24'] } as const;

function MemoryCard({ memory, featured }: { memory: DemoMemory; featured?: boolean }) {
  return (
    <View style={[styles.memoryCard, featured && styles.featuredCard]} accessibilityLabel={`${memory.title}, by ${memory.owner}, ${memory.votes} votes`}>
      <LinearGradient colors={tones[memory.tone]} style={styles.memoryImage}>
        <View style={styles.memorySun} /><View style={styles.memoryHill} /><View style={styles.memoryHillFront} />
        <View style={styles.voteChip}><SymbolView name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} tintColor={SideQuestColors.goldSoft} size={12} /><Text style={styles.voteText}>{memory.votes}</Text></View>
      </LinearGradient>
      <View style={styles.memoryCopy}><Text style={styles.memoryTitle}>{memory.title}</Text><Text style={styles.memoryMeta}>{memory.place} · {memory.time}</Text><Text style={styles.memoryOwner}>{memory.owner}</Text></View>
    </View>
  );
}

function ChronicleContent() {
  const { checkpoint, checkpointIndex, checkpoints, memories, addMemory } = useDemoJourney();
  const complete = checkpointIndex === checkpoints.length - 1;
  const partyComplete = memories.some((memory) => memory.owner === 'Demo Pilot') && memories.some((memory) => memory.owner === 'Demo Navigator');
  return (
    <QuestScreen>
      <View style={styles.header}><View style={styles.headerCopy}><Eyebrow>Traveler’s Chronicle</Eyebrow><Title>Small moments, kept.</Title><BodyText muted>Private to The Roadbound. Nothing is shared publicly.</BodyText></View><View style={styles.lock}><SymbolView name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} tintColor={SideQuestColors.emerald} size={15} /></View></View>

      <Surface style={styles.summary}>
        <View style={styles.summaryTop}><View><Text style={styles.route}>Cape Town → Greyton</Text><Text style={styles.act}>ACT I · {checkpoint.progress}% COMPLETE</Text></View><View style={styles.count}><Text style={styles.countValue}>{memories.length}</Text><Text style={styles.countLabel}>Memories</Text></View></View>
        <View style={styles.stats}>{[['285', 'Trip XP'], ['48', 'Gold'], ['2 / 2', 'Contributors']].map(([value, label]) => <View key={label} style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>)}</View>
      </Surface>

      {partyComplete && <View style={styles.bonus}><View style={styles.bonusIcon}><Text style={styles.bonusRune}>✦</Text></View><View style={styles.bonusCopy}><Text style={styles.bonusTitle}>Party memory bonus</Text><Text style={styles.bonusText}>Every traveler contributed. +50 XP each at arrival.</Text></View></View>}

      <View style={styles.section}><SectionHeading title="Roadside memories" action={<Text style={styles.partyOnly}>Party only</Text>} /><View style={styles.memoryGrid}>{memories.map((memory, index) => <MemoryCard key={memory.id} memory={memory} featured={index === 0} />)}</View></View>

      <Surface>
        <Eyebrow color={SideQuestColors.cobalt}>A gentler camera roll</Eyebrow>
        <BodyText muted>One small memento per traveler unlocks the group reward. Votes remain hidden until arrival, and your own photo is never votable by you.</BodyText>
        <View style={styles.rule}><Text style={styles.ruleLabel}>After arrival</Text><Text style={styles.ruleValue}>24 hours to add extras</Text></View>
        <View style={styles.rule}><Text style={styles.ruleLabel}>Ownership</Text><Text style={styles.ruleValue}>Only the poster can delete</Text></View>
      </Surface>

      <View style={styles.add}><PixelButton label="Add a demo memory" onPress={addMemory} /><Text style={styles.addHint}>Adds a private placeholder at {checkpoint.place}.</Text></View>
      <Pressable accessibilityRole="button" style={[styles.reveal, complete && styles.revealReady]}><Text style={styles.revealEyebrow}>{complete ? 'Votes revealed' : 'Sealed until arrival'}</Text><Text style={styles.revealTitle}>{complete ? 'Dunes at dawn leads the party vote.' : 'Favorite memory award'}</Text></Pressable>
    </QuestScreen>
  );
}

export default function ChronicleScreen() { return <AuthGate><ChronicleContent /></AuthGate>; }

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, headerCopy: { flex: 1, gap: 5 }, lock: { width: 39, height: 39, borderRadius: 14, backgroundColor: 'rgba(117,198,157,0.1)', alignItems: 'center', justifyContent: 'center' },
  summary: { borderColor: 'rgba(216,180,119,0.28)' }, summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, route: { color: SideQuestColors.white, fontFamily: 'Georgia', fontSize: 18 }, act: { color: SideQuestColors.textDim, fontSize: 9, fontWeight: '700', letterSpacing: 1.1, marginTop: 5 }, count: { alignItems: 'center', minWidth: 74 }, countValue: { color: SideQuestColors.goldSoft, fontFamily: 'Georgia', fontSize: 25 }, countLabel: { color: SideQuestColors.textDim, fontSize: 9, textTransform: 'uppercase' },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: SideQuestColors.border, paddingTop: 14 }, stat: { flex: 1, alignItems: 'center' }, statValue: { color: SideQuestColors.white, fontSize: 15, fontWeight: '700' }, statLabel: { color: SideQuestColors.textDim, fontSize: 9, textTransform: 'uppercase', marginTop: 3 },
  bonus: { borderRadius: 18, padding: 14, backgroundColor: 'rgba(117,198,157,0.09)', flexDirection: 'row', gap: 11, alignItems: 'center' }, bonusIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(117,198,157,0.13)', alignItems: 'center', justifyContent: 'center' }, bonusRune: { color: SideQuestColors.emerald, fontSize: 18 }, bonusCopy: { flex: 1 }, bonusTitle: { color: SideQuestColors.emerald, fontSize: 12, fontWeight: '700' }, bonusText: { color: SideQuestColors.textMuted, fontSize: 11, marginTop: 3 },
  section: { gap: 10 }, partyOnly: { color: SideQuestColors.emerald, fontSize: 10, fontWeight: '700' }, memoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, memoryCard: { flexGrow: 1, flexBasis: 155, maxWidth: 356, borderRadius: 18, overflow: 'hidden', backgroundColor: SideQuestColors.surface, borderWidth: 1, borderColor: SideQuestColors.border }, featuredCard: { borderColor: 'rgba(216,180,119,0.34)' }, memoryImage: { height: 140, overflow: 'hidden' }, memorySun: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: SideQuestColors.goldSoft, opacity: 0.7, right: 21, top: 20 }, memoryHill: { position: 'absolute', width: 160, height: 90, backgroundColor: 'rgba(19,39,45,0.75)', transform: [{ rotate: '27deg' }], bottom: -55, left: -32 }, memoryHillFront: { position: 'absolute', width: 200, height: 100, backgroundColor: 'rgba(10,22,29,0.82)', transform: [{ rotate: '-22deg' }], bottom: -65, right: -38 }, voteChip: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 5, alignItems: 'center', borderRadius: 999, backgroundColor: 'rgba(8,11,18,0.72)', paddingHorizontal: 8, paddingVertical: 5 }, voteText: { color: SideQuestColors.white, fontSize: 10, fontWeight: '700' }, memoryCopy: { padding: 13 }, memoryTitle: { color: SideQuestColors.white, fontFamily: 'Georgia', fontSize: 16 }, memoryMeta: { color: SideQuestColors.textMuted, fontSize: 10, marginTop: 5 }, memoryOwner: { color: SideQuestColors.gold, fontSize: 9, fontWeight: '700', marginTop: 7, textTransform: 'uppercase' },
  rule: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, borderTopWidth: 1, borderTopColor: SideQuestColors.border, paddingTop: 11 }, ruleLabel: { color: SideQuestColors.textDim, fontSize: 11 }, ruleValue: { color: SideQuestColors.white, fontSize: 11, textAlign: 'right' }, add: { gap: 8 }, addHint: { color: SideQuestColors.textDim, fontSize: 11, textAlign: 'center' }, reveal: { borderRadius: 18, borderWidth: 1, borderColor: SideQuestColors.border, backgroundColor: SideQuestColors.surface, padding: 16, opacity: 0.62 }, revealReady: { borderColor: 'rgba(216,180,119,0.35)', opacity: 1 }, revealEyebrow: { color: SideQuestColors.gold, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1 }, revealTitle: { color: SideQuestColors.white, fontFamily: 'Georgia', fontSize: 17, marginTop: 5 },
});
