import { StyleSheet, Text, View } from 'react-native';

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

type MemberProps = {
  initials: string;
  name: string;
  role: string;
  level: number;
  xp: string;
  gold: number;
  color: string;
  isYou?: boolean;
};

function MemberCard({ initials, name, role, level, xp, gold, color, isYou }: MemberProps) {
  return (
    <View style={styles.memberCard} accessibilityLabel={`${name}, ${role}, level ${level}, ${xp} XP and ${gold} Gold`}>
      <View style={[styles.avatar, { borderColor: color }]}>
        <Text style={[styles.avatarText, { color }]}>{initials}</Text>
      </View>
      <View style={styles.memberCopy}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName}>{name}</Text>
          {isYou && <Text style={styles.youBadge}>You</Text>}
        </View>
        <Text style={styles.memberRole}>{role}</Text>
        <View style={styles.memberStats}>
          <Text style={styles.memberStat}>LV {level}</Text>
          <Text style={styles.memberStat}>{xp} XP</Text>
          <Text style={[styles.memberStat, styles.goldText]}>{gold} G</Text>
        </View>
      </View>
      <View style={[styles.onlineDot, { backgroundColor: SideQuestColors.emerald }]} />
    </View>
  );
}

export default function PartyScreen() {
  const { roleRequestPending, requestRoleSwap, poolGold, contributeGold, checkpoint } = useDemoJourney();

  return (
    <QuestScreen>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Eyebrow>Party command</Eyebrow>
          <Title>The Roadbound</Title>
          <BodyText muted>Room SQ-7K4P · Two humans online</BodyText>
        </View>
        <View style={styles.lockBadge}>
          <Text style={styles.lockBadgeText}>Private</Text>
        </View>
      </View>

      {roleRequestPending && (
        <View style={styles.pendingBanner} accessibilityLiveRegion="polite">
          <View style={styles.pendingPulse} />
          <View style={styles.pendingCopy}>
            <Text style={styles.pendingTitle}>Pilot handoff requested</Text>
            <Text style={styles.pendingText}>The journey will pause if Demo Pilot accepts.</Text>
          </View>
        </View>
      )}

      <View style={styles.sectionBlock}>
        <SectionHeading title="Active travelers" action={<Text style={styles.capacity}>2 / 2</Text>} />
        <PixelPanel>
          <MemberCard initials="DP" name="Demo Pilot" role="Pilot · Driving" level={8} xp="1,240" gold={310} color={SideQuestColors.cobalt} />
          <View style={styles.memberDivider} />
          <MemberCard initials="DN" name="Demo Navigator" role="Navigator · Quest Giver" level={6} xp="860" gold={225} color={SideQuestColors.gold} isYou />
          <PixelButton
            label={roleRequestPending ? 'Awaiting Pilot response' : 'Request Pilot role'}
            onPress={requestRoleSwap}
            disabled={roleRequestPending}
            variant="ghost"
            accessibilityHint="Asks the current Pilot to approve a role handoff"
          />
        </PixelPanel>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeading title="Shared condition" action={<Text style={styles.liveText}>{checkpoint.place}</Text>} />
        <PixelPanel>
          <StatBar label="Demo Pilot stamina" value={Math.max(0, checkpoint.stamina - 7)} color={SideQuestColors.emerald} />
          <StatBar label="Demo Navigator stamina" value={checkpoint.stamina} color={SideQuestColors.emerald} />
          <View style={styles.conditionNote}>
            <Text style={styles.conditionNoteLabel}>Party HUD rule</Text>
            <Text style={styles.conditionNoteText}>Warnings surface the lowest traveler stat so nobody gets left behind.</Text>
          </View>
        </PixelPanel>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeading title="Pool request" action={<Text style={styles.poolTime}>Ends at arrival</Text>} />
        <PixelPanel style={styles.poolPanel}>
          <View style={styles.itemRow}>
            <View style={styles.itemPreview}>
              <View style={styles.itemPreviewInner}><Text style={styles.itemPreviewText}>F</Text></View>
            </View>
            <View style={styles.itemCopy}>
              <Text style={styles.itemTitle}>Traveler’s Chronicle Frame</Text>
              <Text style={styles.itemSub}>Party cosmetic · Requested by Demo Pilot</Text>
            </View>
          </View>
          <View style={styles.poolAmountRow}>
            <Text style={styles.poolAmount}>{poolGold} / 200 G</Text>
            <Text style={styles.poolPercent}>{Math.round((poolGold / 200) * 100)}%</Text>
          </View>
          <View style={styles.poolTrack}>
            <View style={[styles.poolFill, { width: `${(poolGold / 200) * 100}%` }]} />
          </View>
          <PixelButton
            label={poolGold >= 200 ? 'Item unlocked' : 'Contribute 20 Gold'}
            onPress={contributeGold}
            disabled={poolGold >= 200}
            variant="gold"
          />
        </PixelPanel>
      </View>

      <View style={styles.virtualRow}>
        <View style={styles.virtualAvatar}><Text style={styles.virtualAvatarText}>M</Text></View>
        <View style={styles.virtualCopy}>
          <Text style={styles.virtualTitle}>Moogle Scout</Text>
          <Text style={styles.virtualText}>Virtual companion · Flavor only · Cannot vote</Text>
        </View>
      </View>
    </QuestScreen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingCopy: { flex: 1, gap: 5 },
  lockBadge: { borderWidth: 2, borderColor: SideQuestColors.emerald, backgroundColor: '#002D1A', paddingHorizontal: 10, paddingVertical: 7 },
  lockBadgeText: { color: SideQuestColors.emerald, fontFamily: 'monospace', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' },
  pendingBanner: { borderWidth: 2, borderColor: SideQuestColors.cobalt, backgroundColor: '#101A49', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pendingPulse: { width: 12, height: 12, backgroundColor: SideQuestColors.cobalt },
  pendingCopy: { flex: 1 },
  pendingTitle: { color: SideQuestColors.white, fontFamily: 'monospace', fontWeight: '900', fontSize: 12 },
  pendingText: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 10, lineHeight: 15, marginTop: 2 },
  sectionBlock: { gap: 10 },
  capacity: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 10 },
  memberCard: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderWidth: 3, backgroundColor: SideQuestColors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'monospace', fontWeight: '900', fontSize: 14 },
  memberCopy: { flex: 1, gap: 3 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  memberName: { color: SideQuestColors.white, fontFamily: 'monospace', fontWeight: '900', fontSize: 14 },
  youBadge: { color: SideQuestColors.ink, backgroundColor: SideQuestColors.gold, fontFamily: 'monospace', fontWeight: '900', fontSize: 8, textTransform: 'uppercase', paddingHorizontal: 5, paddingVertical: 2 },
  memberRole: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 10 },
  memberStats: { flexDirection: 'row', gap: 10, marginTop: 3, flexWrap: 'wrap' },
  memberStat: { color: SideQuestColors.cobalt, fontFamily: 'monospace', fontWeight: '900', fontSize: 9 },
  goldText: { color: SideQuestColors.gold },
  onlineDot: { width: 9, height: 9, alignSelf: 'flex-start', marginTop: 8 },
  memberDivider: { height: 1, backgroundColor: '#363C78' },
  liveText: { color: SideQuestColors.emerald, fontFamily: 'monospace', fontSize: 9 },
  conditionNote: { borderLeftWidth: 4, borderLeftColor: SideQuestColors.emerald, backgroundColor: '#002D1A', padding: 10 },
  conditionNoteLabel: { color: SideQuestColors.emerald, fontFamily: 'monospace', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  conditionNoteText: { color: SideQuestColors.white, fontFamily: 'monospace', fontSize: 11, lineHeight: 17, marginTop: 3 },
  poolTime: { color: SideQuestColors.textDim, fontFamily: 'monospace', fontSize: 9 },
  poolPanel: { borderColor: SideQuestColors.gold },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemPreview: { width: 58, height: 58, padding: 5, borderWidth: 2, borderColor: SideQuestColors.gold, backgroundColor: '#292000' },
  itemPreviewInner: { flex: 1, borderWidth: 2, borderColor: SideQuestColors.white, alignItems: 'center', justifyContent: 'center' },
  itemPreviewText: { color: SideQuestColors.gold, fontFamily: 'monospace', fontWeight: '900', fontSize: 18 },
  itemCopy: { flex: 1, gap: 4 },
  itemTitle: { color: SideQuestColors.white, fontFamily: 'monospace', fontWeight: '900', fontSize: 13, lineHeight: 18 },
  itemSub: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 9, lineHeight: 14 },
  poolAmountRow: { flexDirection: 'row', justifyContent: 'space-between' },
  poolAmount: { color: SideQuestColors.gold, fontFamily: 'monospace', fontWeight: '900', fontSize: 13 },
  poolPercent: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontSize: 11 },
  poolTrack: { height: 14, padding: 2, backgroundColor: SideQuestColors.ink, borderWidth: 1, borderColor: SideQuestColors.white },
  poolFill: { height: '100%', backgroundColor: SideQuestColors.gold },
  virtualRow: { borderWidth: 1, borderColor: '#363C78', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  virtualAvatar: { width: 38, height: 38, backgroundColor: '#272B54', alignItems: 'center', justifyContent: 'center' },
  virtualAvatarText: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontWeight: '900' },
  virtualCopy: { flex: 1 },
  virtualTitle: { color: SideQuestColors.textMuted, fontFamily: 'monospace', fontWeight: '900', fontSize: 11 },
  virtualText: { color: SideQuestColors.textDim, fontFamily: 'monospace', fontSize: 9, marginTop: 2 },
});
