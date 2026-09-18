import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthGate } from '@/components/auth-gate';
import { BodyText, Eyebrow, PixelButton, QuestScreen, SectionHeading, StatBar, Surface, Title } from '@/components/sidequest-ui';
import { SideQuestColors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useDemoJourney } from '@/context/demo-journey';

function RouteMap({ progress }: { progress: number }) {
  return (
    <View style={styles.map} accessibilityLabel={`Route is ${progress}% complete`}>
      <LinearGradient colors={['#30495A', '#182B36', '#121923']} style={StyleSheet.absoluteFill} />
      <View style={styles.mapGlow} />
      <View style={styles.mountainOne} />
      <View style={styles.mountainTwo} />
      <View style={styles.routeTrack}>
        <View style={[styles.routeDone, { width: `${progress}%` }]} />
        {[0, 34, 67, 100].map((position) => (
          <View key={position} style={[styles.routeNode, position <= progress && styles.routeNodeDone, { left: `${position}%` }]} />
        ))}
      </View>
      <View style={styles.mapLabel}>
        <Text style={styles.mapPlace}>Cape Town</Text>
        <Text style={styles.mapArrow}>→</Text>
        <Text style={styles.mapPlace}>Greyton</Text>
      </View>
    </View>
  );
}

function JourneyContent() {
  const { profile } = useAuth();
  const {
    checkpoint,
    checkpointIndex,
    checkpoints,
    challengeOpen,
    answerSubmitted,
    advanceCheckpoint,
    dismissChallenge,
    submitAnswer,
  } = useDemoJourney();
  const complete = checkpointIndex === checkpoints.length - 1;

  return (
    <>
      <QuestScreen>
        <View style={styles.header}>
          <View style={styles.headingCopy}>
            <Eyebrow>Act I · The roadbound</Eyebrow>
            <Title>Cape Town to Greyton</Title>
            <BodyText muted>Good morning, {profile?.display_name ?? 'traveler'}. The road is calm.</BodyText>
          </View>
          <View style={styles.rolePill}><Text style={styles.roleText}>Navigator</Text></View>
        </View>

        <Surface style={styles.heroCard}>
          <RouteMap progress={checkpoint.progress} />
          <View style={styles.routeSummary}>
            <View>
              <Text style={styles.currentLabel}>CURRENT WAYMARK</Text>
              <Text style={styles.currentPlace}>{checkpoint.place}</Text>
            </View>
            <View style={styles.etaBlock}>
              <Text style={styles.etaValue}>{checkpoint.eta}</Text>
              <Text style={styles.etaLabel}>{checkpoint.distance}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${checkpoint.progress}%` }]} /></View>
          <Text style={styles.eventText}>{checkpoint.event}</Text>
        </Surface>

        <View style={styles.sectionBlock}>
          <SectionHeading title="Party condition" action={<Text style={styles.live}>Live demo</Text>} />
          <Surface style={styles.vitals}>
            <StatBar label="Stamina" value={checkpoint.stamina} color={SideQuestColors.emerald} />
            <StatBar label="Rations" value={checkpoint.rations} color={SideQuestColors.amber} />
            <StatBar label="Airship core" value={checkpoint.fuel} color={SideQuestColors.cobalt} />
          </Surface>
        </View>

        <Surface style={styles.questCard}>
          <View style={styles.questTop}>
            <View style={styles.questIcon}><SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} tintColor={SideQuestColors.goldSoft} size={21} /></View>
            <View style={styles.questCopy}>
              <Eyebrow>Quest nearby · 7 min detour</Eyebrow>
              <Text style={styles.questTitle}>The orchard behind the mist</Text>
            </View>
            <Text style={styles.xp}>+120 XP</Text>
          </View>
          <BodyText muted>A quiet farmstall, warm apple pie, and a view over the valley. Completely optional.</BodyText>
          <View style={styles.questActions}>
            <Pressable accessibilityRole="button" style={styles.passButton}><Text style={styles.passText}>Not this time</Text></Pressable>
            <View style={styles.acceptButton}><PixelButton label="Add to route" onPress={() => {}} /></View>
          </View>
        </Surface>

        <View style={styles.demoControl}>
          <BodyText muted style={styles.demoHint}>Demo controls move the party through preselected waymarks.</BodyText>
          <PixelButton label={complete ? 'Journey complete' : 'Advance to next waymark'} onPress={advanceCheckpoint} disabled={complete} variant="ghost" />
        </View>
      </QuestScreen>

      <Modal visible={challengeOpen} transparent animationType="fade" onRequestClose={dismissChallenge}>
        <View style={styles.modalBackdrop}>
          <View style={styles.challengeCard}>
            <View style={styles.challengeMark}><Text style={styles.challengeMarkText}>?</Text></View>
            <Eyebrow>Roadside challenge</Eyebrow>
            <Text style={styles.challengeTitle}>Which fruit made Elgin Valley famous?</Text>
            <BodyText muted>Answers stay hidden until everyone responds. Faster correct answers earn more XP.</BodyText>
            {answerSubmitted ? (
              <View style={styles.answerResult}>
                <Text style={styles.answerResultTitle}>Answer sealed</Text>
                <Text style={styles.answerResultText}>Waiting for the quest giver to reveal the party’s answers.</Text>
              </View>
            ) : (
              <View style={styles.answers}>
                {['Apples', 'Olives', 'Grapes'].map((answer) => (
                  <Pressable key={answer} accessibilityRole="button" onPress={submitAnswer} style={({ pressed }) => [styles.answer, pressed && styles.answerPressed]}>
                    <Text style={styles.answerText}>{answer}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <PixelButton label={answerSubmitted ? 'Return to journey' : 'Skip without penalty'} onPress={dismissChallenge} variant="ghost" />
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function JourneyScreen() {
  return <AuthGate><JourneyContent /></AuthGate>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingCopy: { flex: 1, gap: 5 },
  rolePill: { borderRadius: 999, borderWidth: 1, borderColor: SideQuestColors.borderStrong, backgroundColor: 'rgba(216,180,119,0.08)', paddingHorizontal: 12, paddingVertical: 8 },
  roleText: { color: SideQuestColors.goldSoft, fontSize: 11, fontWeight: '700' },
  heroCard: { padding: 0, overflow: 'hidden', gap: 0 },
  map: { height: 190, padding: 18, justifyContent: 'flex-end', overflow: 'hidden' },
  mapGlow: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: SideQuestColors.gold, opacity: 0.13, top: -30, right: 30 },
  mountainOne: { position: 'absolute', width: 220, height: 170, backgroundColor: '#213542', transform: [{ rotate: '38deg' }], left: -90, bottom: -110 },
  mountainTwo: { position: 'absolute', width: 250, height: 180, backgroundColor: '#192832', transform: [{ rotate: '44deg' }], right: -100, bottom: -110 },
  routeTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 9, marginBottom: 26 },
  routeDone: { height: 4, borderRadius: 2, backgroundColor: SideQuestColors.goldSoft },
  routeNode: { position: 'absolute', top: -5, width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: '#596877', borderWidth: 3, borderColor: '#B5C0C8' },
  routeNodeDone: { backgroundColor: SideQuestColors.gold, borderColor: '#F4E1BE' },
  mapLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mapPlace: { color: SideQuestColors.white, fontSize: 12, fontWeight: '700' },
  mapArrow: { color: SideQuestColors.gold, fontSize: 18 },
  routeSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingBottom: 13, gap: 12 },
  currentLabel: { color: SideQuestColors.textDim, fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  currentPlace: { color: SideQuestColors.white, fontFamily: 'Georgia', fontSize: 20, marginTop: 4 },
  etaBlock: { alignItems: 'flex-end' },
  etaValue: { color: SideQuestColors.goldSoft, fontSize: 20, fontWeight: '700' },
  etaLabel: { color: SideQuestColors.textMuted, fontSize: 10, marginTop: 2 },
  progressTrack: { height: 3, marginHorizontal: 18, backgroundColor: '#303947', borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: SideQuestColors.gold, borderRadius: 2 },
  eventText: { color: SideQuestColors.textMuted, fontSize: 13, lineHeight: 20, fontStyle: 'italic', padding: 18 },
  sectionBlock: { gap: 10 },
  live: { color: SideQuestColors.emerald, fontSize: 11, fontWeight: '700' },
  vitals: { gap: 17 },
  questCard: { borderColor: 'rgba(216,180,119,0.32)' },
  questTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  questIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(216,180,119,0.12)', alignItems: 'center', justifyContent: 'center' },
  questCopy: { flex: 1, gap: 4 },
  questTitle: { color: SideQuestColors.white, fontFamily: 'Georgia', fontSize: 18, lineHeight: 24 },
  xp: { color: SideQuestColors.gold, fontSize: 11, fontWeight: '700' },
  questActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  passButton: { minHeight: 52, paddingHorizontal: 12, justifyContent: 'center' },
  passText: { color: SideQuestColors.textMuted, fontSize: 13, fontWeight: '600' },
  acceptButton: { flex: 1 },
  demoControl: { gap: 10 },
  demoHint: { textAlign: 'center', fontSize: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3,5,9,0.78)', padding: 16 },
  challengeCard: { width: '100%', maxWidth: 600, alignSelf: 'center', borderRadius: 26, backgroundColor: '#141B27', borderWidth: 1, borderColor: SideQuestColors.borderStrong, padding: 22, gap: 16, marginBottom: 12 },
  challengeMark: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(216,180,119,0.14)', alignItems: 'center', justifyContent: 'center' },
  challengeMarkText: { color: SideQuestColors.goldSoft, fontFamily: 'Georgia', fontSize: 25 },
  challengeTitle: { color: SideQuestColors.white, fontFamily: 'Georgia', fontSize: 25, lineHeight: 32 },
  answers: { gap: 9 },
  answer: { minHeight: 51, justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: SideQuestColors.borderStrong, paddingHorizontal: 16, backgroundColor: SideQuestColors.surface },
  answerPressed: { borderColor: SideQuestColors.gold, backgroundColor: 'rgba(216,180,119,0.1)' },
  answerText: { color: SideQuestColors.white, fontSize: 15, fontWeight: '600' },
  answerResult: { borderRadius: 14, padding: 15, backgroundColor: 'rgba(117,198,157,0.1)' },
  answerResultTitle: { color: SideQuestColors.emerald, fontSize: 14, fontWeight: '700' },
  answerResultText: { color: SideQuestColors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
