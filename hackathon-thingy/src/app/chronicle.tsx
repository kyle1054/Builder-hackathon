import { StyleSheet, Text, View } from 'react-native';

import {
  BodyText,
  Eyebrow,
  PixelButton,
  PixelPanel,
  QuestScreen,
  SectionHeading,
  Title,
} from '@/components/sidequest-ui';
import { SideQuestColors } from '@/constants/theme';
import { DemoMemory, useDemoJourney } from '@/context/demo-journey';

const toneColors = {
  amber: { sky: '#6A3F28', ground: '#E18E3A' },
  blue: { sky: '#164B72', ground: '#49A4BA' },
  green: { sky: '#1E5546', ground: '#62A65E' },
};

function MemoryCard({ memory }: { memory: DemoMemory }) {
  const tone = toneColors[memory.tone];
  return (
    <View style={styles.memoryCard} accessibilityLabel={`${memory.title}, captured by ${memory.owner}, ${memory.votes} votes`}>
      <View style={[styles.memoryImage, { backgroundColor: tone.sky }]}>
        <View style={[styles.memorySun, { backgroundColor: SideQuestColors.gold }]} />
        <View style={[styles.memoryHillBack, { backgroundColor: tone.ground }]} />
        <View style={styles.memoryHillFront} />
        <View style={styles.memoryStamp}>
          <Text style={styles.memoryStampText}>{memory.votes} vote{memory.votes === 1 ? '' : 's'}</Text>
        </View>
      </View>
      <View style={styles.memoryCaption}>
        <Text style={styles.memoryTitle}>{memory.title}</Text>
        <Text style={styles.memoryMeta}>{memory.place} · {memory.time}</Text>
        <Text style={styles.memoryOwner}>By {memory.owner}</Text>
      </View>
    </View>
  );
}

export default function ChronicleScreen() {
  const { checkpoint, checkpointIndex, checkpoints, memories, addMemory } = useDemoJourney();
  const complete = checkpointIndex === checkpoints.length - 1;
  const partyComplete = memories.some((memory) => memory.owner === 'Demo Pilot') && memories.some((memory) => memory.owner === 'Demo Navigator');

  return (
    <QuestScreen>
      <View style={styles.header}>
        <Eyebrow>The Traveler’s Chronicle</Eyebrow>
        <Title>Small moments, kept.</Title>
        <BodyText muted>Private to The Roadbound · No public share link</BodyText>
      </View>

      <PixelPanel style={styles.summaryPanel}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryRoute}>Cape Town → Greyton</Text>
            <Text style={styles.summaryMeta}>Act I · {checkpoint.progress}% complete</Text>
          </View>
          <View style={styles.memoryCount}>
            <Text style={styles.memoryCountValue}>{memories.length}</Text>
            <Text style={styles.memoryCountLabel}>Memories</Text>
          </View>
        </View>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>285</Text>
            <Text style={styles.summaryStatLabel}>Trip XP</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>48 G</Text>
            <Text style={styles.summaryStatLabel}>Gold</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>2 / 2</Text>
            <Text style={styles.summaryStatLabel}>Contributors</Text>
          </View>
        </View>
      </PixelPanel>

      {partyComplete && (
        <View style={styles.multiplayerBanner}>
          <View style={styles.multiplayerMark}><Text style={styles.multiplayerMarkText}>M</Text></View>
          <View style={styles.multiplayerCopy}>
            <Text style={styles.multiplayerTitle}>Multiplayer memory bonus</Text>
            <Text style={styles.multiplayerText}>Every human traveler contributed. +50 XP each at arrival.</Text>
          </View>
        </View>
      )}

      <View style={styles.sectionBlock}>
        <SectionHeading
          title="Roadside memories"
          action={<Text style={styles.privateLabel}>Party only</Text>}
        />
        <View style={styles.memoryGrid}>
          {memories.map((memory) => <MemoryCard key={memory.id} memory={memory} />)}
        </View>
      </View>

      <PixelPanel>
        <Eyebrow color={SideQuestColors.cobalt}>Memory rules</Eyebrow>
        <BodyText>
          Each traveler earns 25 XP for their first photo. Votes stay hidden until arrival, and you
          cannot vote for your own memory.
        </BodyText>
        <View style={styles.ruleRow}>
          <Text style={styles.ruleKey}>After arrival</Text>
          <Text style={styles.ruleValue}>24 hours to add extras</Text>
        </View>
        <View style={styles.ruleRow}>
          <Text style={styles.ruleKey}>Deletion</Text>
          <Text style={styles.ruleValue}>Poster always controls their photo</Text>
        </View>
      </PixelPanel>

      <View style={styles.addBlock}>
        <PixelButton label="Add a demo memory" onPress={addMemory} variant="gold" />
        <BodyText muted style={styles.addHint}>
          Camera access comes next. This button adds a styled placeholder at {checkpoint.place}.
        </BodyText>
      </View>

      <View style={[styles.favoriteReveal, complete && styles.favoriteRevealReady]}>
        <Text style={styles.favoriteEyebrow}>{complete ? 'Votes revealed' : 'Locked until arrival'}</Text>
        <Text style={styles.favoriteTitle}>{complete ? 'Dunes at dawn leads the party vote.' : 'Favorite memory award'}</Text>
      </View>
    </QuestScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6 },
  summaryPanel: { borderColor: SideQuestColors.gold },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  summaryRoute: { color: SideQuestColors.white, fontFamily: 'monospace', fontWeight: '900', fontSize: 15 },
  summaryMeta: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 10, marginTop: 4 },
  memoryCount: { borderWidth: 2, borderColor: SideQuestColors.gold, backgroundColor: '#292000', minWidth: 74, padding: 8, alignItems: 'center' },
  memoryCountValue: { color: SideQuestColors.gold, fontFamily: 'monospace', fontSize: 20, fontWeight: '900' },
  memoryCountLabel: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 8, textTransform: 'uppercase' },
  summaryStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#363C78', paddingTop: 12 },
  summaryStat: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#363C78' },
  summaryStatValue: { color: SideQuestColors.white, fontFamily: 'monospace', fontWeight: '900', fontSize: 14 },
  summaryStatLabel: { color: SideQuestColors.textDim, fontFamily: 'monospace', fontSize: 8, textTransform: 'uppercase', marginTop: 3 },
  multiplayerBanner: { backgroundColor: '#002D1A', borderWidth: 2, borderColor: SideQuestColors.emerald, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  multiplayerMark: { width: 36, height: 36, backgroundColor: SideQuestColors.emerald, alignItems: 'center', justifyContent: 'center' },
  multiplayerMarkText: { color: SideQuestColors.ink, fontFamily: 'monospace', fontWeight: '900' },
  multiplayerCopy: { flex: 1 },
  multiplayerTitle: { color: SideQuestColors.emerald, fontFamily: 'monospace', fontWeight: '900', fontSize: 11, textTransform: 'uppercase' },
  multiplayerText: { color: SideQuestColors.white, fontFamily: 'monospace', fontSize: 10, lineHeight: 15, marginTop: 3 },
  sectionBlock: { gap: 10 },
  privateLabel: { color: SideQuestColors.emerald, fontFamily: 'monospace', fontWeight: '900', fontSize: 9, textTransform: 'uppercase' },
  memoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  memoryCard: { flexGrow: 1, flexBasis: 154, maxWidth: 356, borderWidth: 3, borderColor: SideQuestColors.white, backgroundColor: SideQuestColors.ink, padding: 3 },
  memoryImage: { height: 132, overflow: 'hidden' },
  memorySun: { position: 'absolute', width: 34, height: 34, top: 17, right: 20 },
  memoryHillBack: { position: 'absolute', width: 150, height: 90, transform: [{ rotate: '30deg' }], bottom: -45, left: -20 },
  memoryHillFront: { position: 'absolute', width: 190, height: 90, transform: [{ rotate: '-24deg' }], backgroundColor: '#14263D', bottom: -50, right: -35 },
  memoryStamp: { position: 'absolute', top: 8, left: 8, backgroundColor: SideQuestColors.ink, borderWidth: 1, borderColor: SideQuestColors.white, paddingHorizontal: 6, paddingVertical: 4 },
  memoryStampText: { color: SideQuestColors.white, fontFamily: 'monospace', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  memoryCaption: { padding: 9, gap: 3 },
  memoryTitle: { color: SideQuestColors.white, fontFamily: 'monospace', fontSize: 12, fontWeight: '900' },
  memoryMeta: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 9 },
  memoryOwner: { color: SideQuestColors.gold, fontFamily: 'monospace', fontSize: 8, textTransform: 'uppercase', marginTop: 3 },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: '#363C78', paddingTop: 9 },
  ruleKey: { color: SideQuestColors.textDim, fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase' },
  ruleValue: { color: SideQuestColors.white, fontFamily: 'monospace', fontSize: 10, textAlign: 'right', flex: 1 },
  addBlock: { gap: 8 },
  addHint: { textAlign: 'center', fontSize: 11, lineHeight: 17 },
  favoriteReveal: { borderWidth: 2, borderColor: '#363C78', backgroundColor: '#11132F', padding: 14, opacity: 0.62 },
  favoriteRevealReady: { borderColor: SideQuestColors.gold, backgroundColor: '#292000', opacity: 1 },
  favoriteEyebrow: { color: SideQuestColors.gold, fontFamily: 'monospace', fontWeight: '900', fontSize: 9, textTransform: 'uppercase' },
  favoriteTitle: { color: SideQuestColors.white, fontFamily: 'monospace', fontWeight: '900', fontSize: 13, lineHeight: 19, marginTop: 4 },
});
