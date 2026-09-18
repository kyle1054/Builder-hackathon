import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { AuthGate } from '@/components/auth-gate';
import { BodyText, Eyebrow, PixelButton, QuestScreen, SectionHeading, StatBar, Surface, Title } from '@/components/sidequest-ui';
import { SideQuestColors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useDemoJourney } from '@/context/demo-journey';

function MemberCard({ initials, name, role, xp, gold, accent, isYou }: { initials: string; name: string; role: string; xp: string; gold: number; accent: string; isYou?: boolean }) {
  return (
    <View style={styles.member} accessibilityLabel={`${name}, ${role}, ${xp} experience`}>
      <View style={[styles.avatar, { backgroundColor: `${accent}22` }]}><Text style={[styles.avatarText, { color: accent }]}>{initials}</Text></View>
      <View style={styles.memberCopy}>
        <View style={styles.memberNameRow}><Text style={styles.memberName}>{name}</Text>{isYou && <Text style={styles.you}>You</Text>}</View>
        <Text style={styles.memberRole}>{role}</Text>
        <View style={styles.memberMeta}><Text style={styles.metaText}>{xp} XP</Text><Text style={styles.metaDot}>·</Text><Text style={styles.gold}>{gold} Gold</Text></View>
      </View>
      <View style={styles.online} />
    </View>
  );
}

function PartyContent() {
  const { profile } = useAuth();
  const { roleRequestPending, requestRoleSwap, poolGold, contributeGold, checkpoint } = useDemoJourney();
  const currentName = profile?.display_name ?? 'Demo Navigator';
  const initials = currentName.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();

  return (
    <QuestScreen>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Eyebrow>Private party · SQ-7K4P</Eyebrow><Title>The Roadbound</Title><BodyText muted>Two travelers connected on the same expedition.</BodyText></View>
        <View style={styles.privateBadge}><SymbolView name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} tintColor={SideQuestColors.emerald} size={14} /><Text style={styles.privateText}>Private</Text></View>
      </View>

      {roleRequestPending && <Surface style={styles.pending} accessibilityLabel="Pilot handoff pending"><View style={styles.pendingIcon}><SymbolView name={{ ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' }} tintColor={SideQuestColors.cobalt} size={21} /></View><View style={styles.pendingCopy}><Text style={styles.pendingTitle}>Role request sent</Text><Text style={styles.pendingText}>The current Pilot must accept before roles change.</Text></View></Surface>}

      <View style={styles.section}>
        <SectionHeading title="Travelers" action={<Text style={styles.capacity}>2 of 2 online</Text>} />
        <Surface>
          <MemberCard initials="DP" name="Demo Pilot" role="Pilot · Driving" xp="1,240" gold={310} accent={SideQuestColors.cobalt} />
          <View style={styles.divider} />
          <MemberCard initials={initials} name={currentName} role="Navigator · Quest giver" xp="860" gold={225} accent={SideQuestColors.gold} isYou />
          <PixelButton label={roleRequestPending ? 'Waiting for Pilot' : 'Request Pilot role'} onPress={requestRoleSwap} disabled={roleRequestPending} variant="ghost" accessibilityHint="The Pilot must approve the handoff" />
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Party condition" action={<Text style={styles.waymark}>{checkpoint.place}</Text>} />
        <Surface>
          <StatBar label="Demo Pilot stamina" value={Math.max(0, checkpoint.stamina - 7)} color={SideQuestColors.emerald} />
          <StatBar label={`${currentName}'s stamina`} value={checkpoint.stamina} color={SideQuestColors.emerald} />
          <View style={styles.note}><Text style={styles.noteTitle}>Shared safety rule</Text><Text style={styles.noteText}>The HUD surfaces the lowest traveler stat, so rest prompts arrive before anyone is exhausted.</Text></View>
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Party request" action={<Text style={styles.capacity}>Ends at arrival</Text>} />
        <Surface style={styles.poolCard}>
          <View style={styles.itemRow}><View style={styles.itemIcon}><Text style={styles.itemRune}>✦</Text></View><View style={styles.itemCopy}><Text style={styles.itemTitle}>Chronicle frame</Text><Text style={styles.itemSub}>Shared cosmetic · Requested by Demo Pilot</Text></View></View>
          <View style={styles.poolLabels}><Text style={styles.poolValue}>{poolGold} / 200 Gold</Text><Text style={styles.poolPercent}>{Math.round((poolGold / 200) * 100)}%</Text></View>
          <View style={styles.poolTrack}><View style={[styles.poolFill, { width: `${(poolGold / 200) * 100}%` }]} /></View>
          <PixelButton label={poolGold >= 200 ? 'Item unlocked' : 'Contribute 20 Gold'} onPress={contributeGold} disabled={poolGold >= 200} />
        </Surface>
      </View>

      <View style={styles.companion}><View style={styles.companionAvatar}><Text style={styles.companionInitial}>M</Text></View><View><Text style={styles.companionName}>Moogle Scout</Text><Text style={styles.companionSub}>Virtual companion · Cannot vote</Text></View></View>
    </QuestScreen>
  );
}

export default function PartyScreen() { return <AuthGate><PartyContent /></AuthGate>; }

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, headerCopy: { flex: 1, gap: 5 },
  privateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: 'rgba(117,198,157,0.1)', paddingHorizontal: 11, paddingVertical: 8 }, privateText: { color: SideQuestColors.emerald, fontSize: 11, fontWeight: '700' },
  pending: { flexDirection: 'row', alignItems: 'center' }, pendingIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(127,168,201,0.11)', alignItems: 'center', justifyContent: 'center' }, pendingCopy: { flex: 1 }, pendingTitle: { color: SideQuestColors.white, fontSize: 14, fontWeight: '700' }, pendingText: { color: SideQuestColors.textMuted, fontSize: 12, marginTop: 3, lineHeight: 18 },
  section: { gap: 10 }, capacity: { color: SideQuestColors.textMuted, fontSize: 11 }, waymark: { color: SideQuestColors.emerald, fontSize: 11, fontWeight: '600' },
  member: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: 'Georgia', fontSize: 17, fontWeight: '700' }, memberCopy: { flex: 1, gap: 3 }, memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, memberName: { color: SideQuestColors.white, fontSize: 15, fontWeight: '700' }, you: { color: SideQuestColors.goldSoft, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 }, memberRole: { color: SideQuestColors.textMuted, fontSize: 12 }, memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }, metaText: { color: SideQuestColors.cobalt, fontSize: 10, fontWeight: '700' }, metaDot: { color: SideQuestColors.textDim }, gold: { color: SideQuestColors.gold, fontSize: 10, fontWeight: '700' }, online: { width: 9, height: 9, borderRadius: 5, backgroundColor: SideQuestColors.emerald, alignSelf: 'flex-start', marginTop: 8 }, divider: { height: 1, backgroundColor: SideQuestColors.border },
  note: { borderRadius: 13, backgroundColor: 'rgba(117,198,157,0.08)', padding: 13 }, noteTitle: { color: SideQuestColors.emerald, fontSize: 11, fontWeight: '700' }, noteText: { color: SideQuestColors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  poolCard: { borderColor: 'rgba(216,180,119,0.3)' }, itemRow: { flexDirection: 'row', alignItems: 'center', gap: 13 }, itemIcon: { width: 55, height: 55, borderRadius: 17, backgroundColor: 'rgba(216,180,119,0.12)', alignItems: 'center', justifyContent: 'center' }, itemRune: { color: SideQuestColors.goldSoft, fontSize: 24 }, itemCopy: { flex: 1 }, itemTitle: { color: SideQuestColors.white, fontFamily: 'Georgia', fontSize: 18 }, itemSub: { color: SideQuestColors.textMuted, fontSize: 11, marginTop: 4 }, poolLabels: { flexDirection: 'row', justifyContent: 'space-between' }, poolValue: { color: SideQuestColors.goldSoft, fontSize: 13, fontWeight: '700' }, poolPercent: { color: SideQuestColors.textMuted, fontSize: 12 }, poolTrack: { height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: '#2A3240' }, poolFill: { height: 7, borderRadius: 4, backgroundColor: SideQuestColors.gold },
  companion: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 4 }, companionAvatar: { width: 40, height: 40, borderRadius: 15, backgroundColor: SideQuestColors.surface, alignItems: 'center', justifyContent: 'center' }, companionInitial: { color: SideQuestColors.textDim, fontFamily: 'Georgia', fontSize: 16 }, companionName: { color: SideQuestColors.textMuted, fontSize: 12, fontWeight: '700' }, companionSub: { color: SideQuestColors.textDim, fontSize: 10, marginTop: 2 },
});
