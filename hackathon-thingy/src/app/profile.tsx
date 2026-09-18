import { Image } from 'expo-image';
import { avatarSource } from '@/lib/avatar';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthGate } from '@/components/auth-gate';
import { BodyText, Eyebrow, PixelButton, QuestScreen, SectionHeading, Surface, Title } from '@/components/sidequest-ui';
import { SideQuestColors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { signOut, updateDisplayName } from '@/services/auth';
import { getTravelerRoleStats, TravelerRoleStats } from '@/services/sidequest-api';

const emptyRoleStats: TravelerRoleStats = {
  pilotDistanceM: 0,
  navigatorDistanceM: 0,
  pilotSeconds: 0,
  navigatorSeconds: 0,
  journeysCount: 0,
};

function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(meters >= 100000 ? 0 : 1)} km`;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function ProfileContent() {
  const { session, profile, refreshProfile } = useAuth();
  const displayName = profile?.display_name ?? 'Traveler';
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleStats, setRoleStats] = useState<TravelerRoleStats>(emptyRoleStats);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    let active = true;
    getTravelerRoleStats(session.user.id)
      .then((stats) => { if (active) setRoleStats(stats); })
      .catch(() => { if (active) setRoleStats(emptyRoleStats); })
      .finally(() => { if (active) setStatsLoading(false); });
    return () => { active = false; };
  }, [session]);

  const save = async () => {
    if (!session) return;
    setSaving(true); setError(null);
    try { await updateDisplayName(session.user.id, name); await refreshProfile(); setEditing(false); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save your profile.'); }
    finally { setSaving(false); }
  };

  const exit = async () => { await signOut(); router.replace('/'); };

  return (
    <QuestScreen>
      <View style={styles.header}><View style={styles.headerCopy}><Eyebrow>Traveler profile</Eyebrow><Title>Made for the long way.</Title><BodyText muted>Your identity, progress, and privacy settings.</BodyText></View><Pressable accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => setEditing((value) => !value)} style={styles.editIcon}><SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} tintColor={SideQuestColors.goldSoft} size={18} /></Pressable></View>

      <Surface style={styles.identityCard}>
        <View style={styles.avatar}><Image source={avatarSource(profile?.avatar_seed)} contentFit="contain" style={{ width: 78, height: 90 }} accessibilityLabel="Your voxel character" /><View style={styles.levelBadge}><Text style={styles.levelText}>8</Text></View></View>
        {editing ? (
          <View style={styles.editArea}>
            <Text style={styles.inputLabel}>Traveler name</Text>
            <TextInput value={name} onChangeText={setName} maxLength={40} autoFocus accessibilityLabel="Traveler name" placeholder="Traveler name" placeholderTextColor={SideQuestColors.textDim} style={styles.input} />
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.editActions}><Pressable accessibilityRole="button" onPress={() => { setEditing(false); setName(displayName); }} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable accessibilityRole="button" disabled={saving} onPress={save} style={styles.save}>{saving ? <ActivityIndicator color={SideQuestColors.ink} /> : <Text style={styles.saveText}>Save changes</Text>}</Pressable></View>
          </View>
        ) : (
          <View style={styles.identityCopy}><Text style={styles.name}>{displayName}</Text><Text style={styles.email}>{session?.user.email}</Text><View style={styles.titlePill}><Text style={styles.titlePillText}>Wayfinder · Level 8</Text></View></View>
        )}
      </Surface>

      <View style={styles.section}>
        <SectionHeading title="Role record" action={<Text style={styles.journeyCount}>{roleStats.journeysCount} journeys</Text>} />
        <Surface>
          {statsLoading ? <ActivityIndicator color={SideQuestColors.gold} /> : (
            <>
              <View style={styles.roleStatRow}>
                <View style={styles.roleStatIcon}><SymbolView name={{ ios: 'steeringwheel', android: 'directions_car', web: 'directions_car' }} tintColor={SideQuestColors.cobalt} size={22} /></View>
                <View style={styles.roleStatCopy}><Text style={styles.roleStatLabel}>As Pilot</Text><Text style={styles.roleStatValue}>{formatDistance(roleStats.pilotDistanceM)} driven</Text></View>
                <Text style={styles.roleTime}>{formatDuration(roleStats.pilotSeconds)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.roleStatRow}>
                <View style={[styles.roleStatIcon, styles.navigatorIcon]}><SymbolView name={{ ios: 'map.fill', android: 'map', web: 'map' }} tintColor={SideQuestColors.goldSoft} size={22} /></View>
                <View style={styles.roleStatCopy}><Text style={styles.roleStatLabel}>As Navigator</Text><Text style={styles.roleStatValue}>{formatDistance(roleStats.navigatorDistanceM)} navigated</Text></View>
                <Text style={styles.roleTime}>{formatDuration(roleStats.navigatorSeconds)}</Text>
              </View>
            </>
          )}
          {!statsLoading && roleStats.journeysCount === 0 && <Text style={styles.statsEmpty}>Distance starts counting after the second accepted route sample.</Text>}
        </Surface>
      </View>

      <View style={styles.section}><SectionHeading title="Traveler traits" /><Surface>
        <View style={styles.trait}><View style={[styles.traitIcon, { backgroundColor: 'rgba(117,198,157,0.1)' }]}><SymbolView name={{ ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' }} tintColor={SideQuestColors.emerald} size={20} /></View><View style={styles.traitCopy}><Text style={styles.traitTitle}>Steady endurance</Text><Text style={styles.traitText}>Your demo stamina depletes at the standard rate.</Text></View></View>
        <View style={styles.divider} />
        <View style={styles.trait}><View style={[styles.traitIcon, { backgroundColor: 'rgba(223,164,91,0.1)' }]}><SymbolView name={{ ios: 'fork.knife', android: 'restaurant', web: 'restaurant' }} tintColor={SideQuestColors.amber} size={20} /></View><View style={styles.traitCopy}><Text style={styles.traitTitle}>Regular rations</Text><Text style={styles.traitText}>Meal prompts arrive after 2½ hours on the road.</Text></View></View>
      </Surface></View>

      <View style={styles.section}><SectionHeading title="Privacy & account" /><Surface>
        <View style={styles.setting}><View><Text style={styles.settingTitle}>Private Chronicle</Text><Text style={styles.settingText}>Only registered trip members can view photos.</Text></View><View style={styles.onPill}><Text style={styles.onText}>On</Text></View></View>
        <View style={styles.divider} />
        <View style={styles.setting}><View><Text style={styles.settingTitle}>Photo ownership</Text><Text style={styles.settingText}>Only you can permanently delete your uploads.</Text></View><SymbolView name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} tintColor={SideQuestColors.emerald} size={21} /></View>
      </Surface></View>

      <PixelButton label="Sign out" onPress={() => void exit()} variant="ghost" />
      <Text style={styles.version}>SIDEQUEST DEMO · BUILD 0.2</Text>
    </QuestScreen>
  );
}

export default function ProfileScreen() { return <AuthGate><ProfileContent /></AuthGate>; }

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, headerCopy: { flex: 1, gap: 5 }, editIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(216,180,119,0.1)', alignItems: 'center', justifyContent: 'center' },
  identityCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderColor: 'rgba(216,180,119,0.28)' }, avatar: { width: 86, height: 98, borderRadius: 25, backgroundColor: 'rgba(216,180,119,0.12)', alignItems: 'center', justifyContent: 'center' }, initials: { color: SideQuestColors.goldSoft, fontFamily: 'system-ui', fontSize: 25, fontWeight: '700' }, levelBadge: { position: 'absolute', right: -5, bottom: -5, width: 28, height: 28, borderRadius: 14, backgroundColor: SideQuestColors.gold, borderWidth: 3, borderColor: SideQuestColors.surface, alignItems: 'center', justifyContent: 'center' }, levelText: { color: SideQuestColors.ink, fontSize: 10, fontWeight: '800' }, identityCopy: { flex: 1 }, name: { color: SideQuestColors.text, fontFamily: 'system-ui', fontSize: 23 }, email: { color: SideQuestColors.textMuted, fontSize: 11, marginTop: 5 }, titlePill: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: 'rgba(127,168,201,0.1)', paddingHorizontal: 10, paddingVertical: 6, marginTop: 10 }, titlePillText: { color: SideQuestColors.cobalt, fontSize: 10, fontWeight: '700' },
  editArea: { flex: 1, gap: 8 }, inputLabel: { color: SideQuestColors.textMuted, fontSize: 11, fontWeight: '600' }, input: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: SideQuestColors.borderStrong, backgroundColor: SideQuestColors.surface, color: SideQuestColors.text, paddingHorizontal: 13, fontSize: 15 }, error: { color: SideQuestColors.red, fontSize: 11 }, editActions: { flexDirection: 'row', gap: 8 }, cancel: { minHeight: 43, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: SideQuestColors.textMuted, fontSize: 12, fontWeight: '600' }, save: { flex: 1, minHeight: 43, borderRadius: 12, backgroundColor: SideQuestColors.gold, alignItems: 'center', justifyContent: 'center' }, saveText: { color: SideQuestColors.ink, fontSize: 12, fontWeight: '700' },
  section: { gap: 10 }, journeyCount: { color: SideQuestColors.textMuted, fontSize: 11 }, roleStatRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, roleStatIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(127,168,201,0.11)', alignItems: 'center', justifyContent: 'center' }, navigatorIcon: { backgroundColor: 'rgba(216,180,119,0.11)' }, roleStatCopy: { flex: 1 }, roleStatLabel: { color: SideQuestColors.textMuted, fontSize: 11, fontWeight: '600' }, roleStatValue: { color: SideQuestColors.text, fontFamily: 'system-ui', fontSize: 19, marginTop: 3 }, roleTime: { color: SideQuestColors.textDim, fontSize: 11, fontVariant: ['tabular-nums'] }, statsEmpty: { color: SideQuestColors.textDim, fontSize: 11, lineHeight: 17, textAlign: 'center' }, trait: { flexDirection: 'row', alignItems: 'center', gap: 12 }, traitIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, traitCopy: { flex: 1 }, traitTitle: { color: SideQuestColors.text, fontSize: 13, fontWeight: '700' }, traitText: { color: SideQuestColors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 3 }, divider: { height: 1, backgroundColor: SideQuestColors.border }, setting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, settingTitle: { color: SideQuestColors.text, fontSize: 13, fontWeight: '700' }, settingText: { color: SideQuestColors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 3, maxWidth: 280 }, onPill: { borderRadius: 999, backgroundColor: 'rgba(117,198,157,0.12)', paddingHorizontal: 11, paddingVertical: 6 }, onText: { color: SideQuestColors.emerald, fontSize: 10, fontWeight: '700' }, version: { color: SideQuestColors.textDim, fontSize: 9, letterSpacing: 1.2, textAlign: 'center' },
});
