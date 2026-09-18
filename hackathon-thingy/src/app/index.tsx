import { Modal, StyleSheet, Text, View } from 'react-native';

import {
  BodyText,
  Eyebrow,
  PixelButton,
  PixelPanel,
  QuestScreen,
  SectionHeading,
  StatBar,
  Title,
} from '@/components/sidequest-ui';
import { SideQuestColors } from '@/constants/theme';
import { useDemoJourney } from '@/context/demo-journey';

function RouteMap() {
  const { checkpoint, checkpointIndex, checkpoints } = useDemoJourney();

  return (
    <View style={styles.map} accessibilityLabel={`Route progress ${checkpoint.progress} percent, currently at ${checkpoint.place}`}>
      <View style={[styles.pixelCloud, styles.pixelCloudLeft]} />
      <View style={[styles.pixelCloud, styles.pixelCloudRight]} />
      <View style={styles.mountainBack} />
      <View style={styles.mountainFront} />
      <View style={styles.routeLine} />
      <View style={styles.routeNodes}>
        {checkpoints.map((item, index) => {
          const reached = index <= checkpointIndex;
          const active = index === checkpointIndex;
          return (
            <View key={item.id} style={styles.nodeSlot}>
              <View style={[styles.routeNode, reached && styles.routeNodeReached, active && styles.routeNodeActive]}>
                <Text style={[styles.nodeText, reached && styles.nodeTextReached]}>{index + 1}</Text>
              </View>
              {active && <View style={styles.activePointer} />}
            </View>
          );
        })}
      </View>
      <View style={styles.mapCaption}>
        <View>
          <Text style={styles.mapPlace}>{checkpoint.place}</Text>
          <Text style={styles.mapMeta}>{checkpoint.distance}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressBadgeValue}>{checkpoint.progress}%</Text>
          <Text style={styles.progressBadgeLabel}>Route</Text>
        </View>
      </View>
    </View>
  );
}

function ChallengeDialog() {
  const { challengeOpen, answerSubmitted, checkpoint, dismissChallenge, submitAnswer } = useDemoJourney();

  return (
    <Modal visible={challengeOpen} animationType="fade" transparent onRequestClose={dismissChallenge}>
      <View style={styles.modalScrim}>
        <View style={styles.modalWrap}>
          <PixelPanel accessibilityLabel="Roadside challenge">
            <View style={styles.challengeTopline}>
              <Eyebrow>Voice quest · Checkpoint {checkpoint.progress}%</Eyebrow>
              <Text style={styles.rewardText}>+100 XP</Text>
            </View>
            <Title style={styles.challengeTitle}>The watcher in the fields</Title>
            <BodyText>
              Quest Giver: read this aloud. Each traveler names the strangest thing they can spot
              outside. Funniest answer wins.
            </BodyText>
            <View style={styles.hintBox}>
              <Text style={styles.hintLabel}>Free hint</Text>
              <Text style={styles.hintText}>Look beyond the road signs—movement earns style points.</Text>
            </View>
            <View style={styles.safetyRow}>
              <View style={styles.safetyDot} />
              <Text style={styles.safetyText}>Pilot answers by voice. Navigator handles the screen.</Text>
            </View>
            {answerSubmitted ? (
              <View style={styles.submittedBox}>
                <Text style={styles.submittedTitle}>Answer locked</Text>
                <Text style={styles.submittedText}>Waiting for the Quest Giver to reveal results.</Text>
              </View>
            ) : (
              <PixelButton label="Record answer" onPress={submitAnswer} variant="gold" />
            )}
            <PixelButton label="Return to route" onPress={dismissChallenge} variant="ghost" />
          </PixelPanel>
        </View>
      </View>
    </Modal>
  );
}

export default function JourneyScreen() {
  const { checkpoint, checkpointIndex, checkpoints, advanceCheckpoint } = useDemoJourney();
  const complete = checkpointIndex === checkpoints.length - 1;

  return (
    <QuestScreen>
      <View style={styles.heroHeader}>
        <View style={styles.heroCopy}>
          <Eyebrow>Act I · The Cape Run</Eyebrow>
          <Title>Cape Town to Greyton</Title>
          <BodyText muted>Party of two · Demo route</BodyText>
        </View>
        <View style={styles.roleChip} accessibilityLabel="Current role Navigator">
          <Text style={styles.roleChipTop}>You are</Text>
          <Text style={styles.roleChipMain}>Navigator</Text>
        </View>
      </View>

      <PixelPanel>
        <RouteMap />
        <View style={styles.etaRow}>
          <View>
            <Text style={styles.infoLabel}>Arrival</Text>
            <Text style={styles.infoValue}>{checkpoint.eta}</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaRight}>
            <Text style={styles.infoLabel}>Current event</Text>
            <Text style={styles.eventValue}>{checkpoint.event}</Text>
          </View>
        </View>
      </PixelPanel>

      <View style={styles.sectionBlock}>
        <SectionHeading title="Party vitals" action={<Text style={styles.liveLabel}>Live</Text>} />
        <PixelPanel>
          <View style={styles.vitalsGrid}>
            <StatBar label="Stamina" value={checkpoint.stamina} color={SideQuestColors.emerald} />
            <StatBar label="Rations" value={checkpoint.rations} color={SideQuestColors.amber} />
            <StatBar label="Airship core" value={checkpoint.fuel} color={SideQuestColors.cobalt} />
          </View>
          <View style={styles.buffRow}>
            <View style={styles.buffMark}><Text style={styles.buffMarkText}>B</Text></View>
            <View style={styles.buffCopy}>
              <Text style={styles.buffTitle}>Well Rested</Text>
              <Text style={styles.buffText}>Next completed quest grants +20% XP.</Text>
            </View>
          </View>
        </PixelPanel>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeading title="Quest radar" action={<Text style={styles.questCount}>2 nearby</Text>} />
        <PixelPanel style={styles.questPanel}>
          <View style={styles.questHeader}>
            <View style={styles.questGlyph}><Text style={styles.questGlyphText}>Q</Text></View>
            <View style={styles.questCopy}>
              <Eyebrow color={SideQuestColors.amber}>Food · 7 min detour</Eyebrow>
              <Text style={styles.questTitle}>The Whispering Orchard</Text>
            </View>
            <Text style={styles.questXp}>120 XP</Text>
          </View>
          <BodyText>Find the farmstall whose apple pie has guarded this valley for three generations.</BodyText>
          <View style={styles.voteStrip}>
            <View style={styles.voteStatus}>
              <View style={styles.voteDot} />
              <Text style={styles.voteText}>Secret vote ready</Text>
            </View>
            <Text style={styles.voteEligible}>1 eligible voter</Text>
          </View>
        </PixelPanel>
      </View>

      <View style={styles.demoControl}>
        <Eyebrow color={SideQuestColors.cobalt}>Demo control</Eyebrow>
        <BodyText muted>
          {complete
            ? 'The party has arrived. Open the Chronicle to review the expedition.'
            : 'Advance one scripted checkpoint to trigger the next route event.'}
        </BodyText>
        <PixelButton
          label={complete ? 'Expedition complete' : 'Advance checkpoint'}
          onPress={advanceCheckpoint}
          disabled={complete}
          variant="blue"
          accessibilityHint="Updates route progress, vitals, and checkpoint events"
        />
      </View>

      <ChallengeDialog />
    </QuestScreen>
  );
}

const styles = StyleSheet.create({
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  heroCopy: { flex: 1, gap: 5 },
  roleChip: { borderWidth: 2, borderColor: SideQuestColors.gold, backgroundColor: '#241F00', paddingHorizontal: 10, paddingVertical: 8, minWidth: 92 },
  roleChipTop: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  roleChipMain: { color: SideQuestColors.gold, fontFamily: 'monospace', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  map: { height: 220, overflow: 'hidden', backgroundColor: '#111A43', borderWidth: 2, borderColor: '#434C7B' },
  pixelCloud: { position: 'absolute', width: 70, height: 12, backgroundColor: '#303B72' },
  pixelCloudLeft: { top: 28, left: 20 },
  pixelCloudRight: { top: 54, right: 34, width: 48 },
  mountainBack: { position: 'absolute', width: 220, height: 120, backgroundColor: '#17285A', transform: [{ rotate: '45deg' }], left: -30, top: 78 },
  mountainFront: { position: 'absolute', width: 260, height: 140, backgroundColor: '#0B1639', transform: [{ rotate: '45deg' }], right: -80, top: 88 },
  routeLine: { position: 'absolute', left: 34, right: 34, top: 104, height: 5, backgroundColor: SideQuestColors.road },
  routeNodes: { position: 'absolute', left: 25, right: 25, top: 88, flexDirection: 'row', justifyContent: 'space-between' },
  nodeSlot: { alignItems: 'center' },
  routeNode: { width: 36, height: 36, backgroundColor: SideQuestColors.ink, borderWidth: 3, borderColor: SideQuestColors.road, alignItems: 'center', justifyContent: 'center' },
  routeNodeReached: { borderColor: SideQuestColors.gold, backgroundColor: '#292000' },
  routeNodeActive: { borderColor: SideQuestColors.white, backgroundColor: SideQuestColors.cobalt },
  nodeText: { color: SideQuestColors.textDim, fontFamily: 'monospace', fontWeight: '900' },
  nodeTextReached: { color: SideQuestColors.white },
  activePointer: { width: 8, height: 8, marginTop: 5, backgroundColor: SideQuestColors.white, transform: [{ rotate: '45deg' }] },
  mapCaption: { position: 'absolute', bottom: 10, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  mapPlace: { color: SideQuestColors.white, fontFamily: 'monospace', fontSize: 14, fontWeight: '900' },
  mapMeta: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
  progressBadge: { minWidth: 68, backgroundColor: SideQuestColors.ink, borderWidth: 2, borderColor: SideQuestColors.white, padding: 7, alignItems: 'center' },
  progressBadgeValue: { color: SideQuestColors.gold, fontFamily: 'monospace', fontWeight: '900', fontSize: 17 },
  progressBadgeLabel: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 8, textTransform: 'uppercase' },
  etaRow: { flexDirection: 'row', alignItems: 'stretch', gap: 14 },
  etaDivider: { width: 2, backgroundColor: '#32387A' },
  etaRight: { flex: 1 },
  infoLabel: { color: SideQuestColors.textDim, fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: '800', fontSize: 9 },
  infoValue: { color: SideQuestColors.white, fontFamily: 'monospace', fontSize: 18, fontWeight: '900', marginTop: 4 },
  eventValue: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 12, lineHeight: 17, marginTop: 4 },
  sectionBlock: { gap: 10 },
  liveLabel: { color: SideQuestColors.emerald, fontFamily: 'monospace', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' },
  vitalsGrid: { gap: 12 },
  buffRow: { borderTopWidth: 1, borderTopColor: '#363C78', paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  buffMark: { width: 34, height: 34, borderWidth: 2, borderColor: SideQuestColors.emerald, backgroundColor: '#002D1A', alignItems: 'center', justifyContent: 'center' },
  buffMarkText: { color: SideQuestColors.emerald, fontFamily: 'monospace', fontWeight: '900' },
  buffCopy: { flex: 1 },
  buffTitle: { color: SideQuestColors.emerald, fontFamily: 'monospace', fontWeight: '900', fontSize: 12 },
  buffText: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 11, marginTop: 2 },
  questCount: { color: SideQuestColors.gold, fontFamily: 'monospace', fontSize: 10, fontWeight: '900' },
  questPanel: { borderColor: SideQuestColors.gold },
  questHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  questGlyph: { width: 40, height: 40, borderWidth: 2, borderColor: SideQuestColors.gold, backgroundColor: '#292000', alignItems: 'center', justifyContent: 'center' },
  questGlyphText: { color: SideQuestColors.gold, fontFamily: 'monospace', fontWeight: '900' },
  questCopy: { flex: 1, gap: 2 },
  questTitle: { color: SideQuestColors.white, fontFamily: 'monospace', fontWeight: '900', fontSize: 15 },
  questXp: { color: SideQuestColors.gold, fontFamily: 'monospace', fontWeight: '900', fontSize: 11 },
  voteStrip: { backgroundColor: SideQuestColors.ink, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  voteStatus: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  voteDot: { width: 8, height: 8, backgroundColor: SideQuestColors.cobalt },
  voteText: { color: SideQuestColors.white, fontFamily: 'monospace', fontSize: 10, fontWeight: '800' },
  voteEligible: { color: SideQuestColors.textDim, fontFamily: 'monospace', fontSize: 9 },
  demoControl: { gap: 9, marginTop: 2 },
  modalScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'center', padding: 16 },
  modalWrap: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  challengeTopline: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  challengeTitle: { fontSize: 21, lineHeight: 28 },
  rewardText: { color: SideQuestColors.gold, fontFamily: 'monospace', fontSize: 11, fontWeight: '900' },
  hintBox: { backgroundColor: '#111A43', borderLeftWidth: 4, borderLeftColor: SideQuestColors.cobalt, padding: 12 },
  hintLabel: { color: SideQuestColors.cobalt, fontFamily: 'monospace', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  hintText: { color: SideQuestColors.white, fontFamily: 'monospace', fontSize: 12, lineHeight: 18, marginTop: 4 },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  safetyDot: { width: 9, height: 9, backgroundColor: SideQuestColors.emerald },
  safetyText: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 11, flex: 1, lineHeight: 17 },
  submittedBox: { borderWidth: 2, borderColor: SideQuestColors.emerald, backgroundColor: '#002D1A', padding: 12 },
  submittedTitle: { color: SideQuestColors.emerald, fontFamily: 'monospace', fontWeight: '900', textTransform: 'uppercase' },
  submittedText: { color: SideQuestColors.white, fontFamily: 'monospace', fontSize: 12, marginTop: 4 },
});
