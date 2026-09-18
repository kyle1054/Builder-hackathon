import { Image } from 'expo-image';
import { DestinationMap } from '@/components/destination-map';
import { MAP_PLACES, activityPlace } from '@/constants/map-places';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthGate } from '@/components/auth-gate';
import { InterestArt } from '@/components/interest-art';
import { BodyText, QuestScreen, SectionHeading, Title } from '@/components/sidequest-ui';
import { DEMO_TRAVELERS, TripProgress } from '@/components/trip-progress';
import { SideQuestColors as C } from '@/constants/theme';
import { TRIP, TRIP_ACTIVITIES, TripActivity } from '@/constants/trip';
import { useDemoJourney } from '@/context/demo-journey';
import { avatarSource } from '@/lib/avatar';

function TripContent({ selected }: { selected?: string }) {
  const { checkpoint, activityStatuses, setActivityStatus } = useDemoJourney();
  const [expanded, setExpanded] = useState<string | null>(selected ?? TRIP_ACTIVITIES.find((item) => item.progress > checkpoint.progress)?.id ?? null);
  const [filter, setFilter] = useState<'upcoming' | 'all'>(selected ? 'all' : 'upcoming');
  const planned = TRIP_ACTIVITIES.filter((item) => activityStatuses[item.id] === 'planned');
  const upcoming = TRIP_ACTIVITIES.filter((item) => item.progress > checkpoint.progress && activityStatuses[item.id] !== 'skipped');
  const shown = filter === 'all' ? TRIP_ACTIVITIES : upcoming;
  const detour = planned.reduce((total, item) => total + item.detour, 0);

  const activityRow = (activity: TripActivity, index: number) => {
    const status = activityStatuses[activity.id];
    const passed = checkpoint.progress >= activity.progress;
    const open = expanded === activity.id;
    const state = status === 'skipped' ? 'Skipped' : passed ? 'Passed on route' : status === 'planned' ? 'Planned stop' : 'Suggested stop';
    return <View key={activity.id} style={styles.activity}>
      <View style={styles.timeline}><View style={[styles.timelineDot, status === 'planned' && styles.plannedDot]} /><View style={styles.timelineLine} /></View>
      <View style={styles.activityContent}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${activity.title}, ${state}. ${open ? 'Hide' : 'Show'} details`} accessibilityState={{ expanded: open }} onPress={() => setExpanded(open ? null : activity.id)} style={({ pressed }) => [styles.activityHeader, pressed && styles.pressed]}>
          <InterestArt category={activity.category} size={58} />
          <View style={styles.activityCopy}><Text style={styles.activityState}>{String(index + 1).padStart(2, '0')} / {activity.place} · {state}</Text><Text style={styles.activityTitle}>{activity.title}</Text><Text style={styles.activityTime}>{activity.detour ? `+${activity.detour} min detour` : 'On the route'} · {activity.duration} min here</Text></View>
          <Text style={styles.expand}>{open ? '−' : '+'}</Text>
        </Pressable>
        {open && <View style={styles.expanded}>
          <BodyText muted style={styles.activityDescription}>{activity.description}</BodyText>
          <View style={styles.mapFrame}><DestinationMap place={activityPlace(activity.id)} height={160} /></View>
          <Text style={styles.bring}>{activity.bring}</Text>
          {!passed && <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => setActivityStatus(activity.id, status === 'planned' || status === 'skipped' ? 'suggested' : 'skipped')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryLabel}>{status === 'planned' ? 'Remove from trip' : status === 'skipped' ? 'Restore suggestion' : 'Skip this stop'}</Text></Pressable>
            {status !== 'planned' && <Pressable accessibilityRole="button" accessibilityLabel={`Add ${activity.title} to trip`} onPress={() => setActivityStatus(activity.id, 'planned')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryLabel}>Add to trip</Text></Pressable>}
          </View>}
          <Text accessibilityLiveRegion="polite" style={styles.confirmation}>{status === 'planned' ? 'Included in your itinerary' : status === 'skipped' ? 'Removed from upcoming activities' : 'Optional — add it if you fancy a stop'}</Text>
        </View>}
      </View>
    </View>;
  };

  return <QuestScreen>
    <View style={styles.toolbar}><Pressable accessibilityRole="button" accessibilityLabel="Back to your trips" onPress={() => router.replace('/journey')} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>←  Your trips</Text></Pressable><Text style={styles.region}>{TRIP.region}</Text></View>
    <View style={styles.tripHeading}><Text style={styles.heroKicker}>THE OVERBERG</Text><Title style={styles.heroTitle}>{TRIP.title}</Title><Text style={styles.address}>{TRIP.destinationAddress}</Text></View>
    <View style={styles.mapFrame}><DestinationMap place={MAP_PLACES.destination} height={240} /></View>
    <View style={styles.summary}><View style={styles.summaryItem}><Text style={styles.summaryValue}>{checkpoint.progress === 100 ? 'Arrived' : checkpoint.eta}</Text><Text style={styles.summaryLabel}>Remaining drive</Text></View><View style={styles.summaryItem}><Text style={styles.summaryValue}>{planned.length} stops</Text><Text style={styles.summaryLabel}>In your itinerary</Text></View><View style={styles.summaryItem}><Text style={styles.summaryValue}>+{detour} min</Text><Text style={styles.summaryLabel}>Added driving</Text></View></View>
    <View style={styles.section}><SectionHeading title="About this trip" /><BodyText muted>{TRIP.description}</BodyText></View>
    <View style={styles.progress}><TripProgress progress={checkpoint.progress} /></View>
    <View style={styles.section}>
      <View style={styles.itineraryHeading}><SectionHeading title="The itinerary" /><Text style={styles.count}>{upcoming.length} upcoming</Text></View>
      <View style={styles.filters}>{(['upcoming', 'all'] as const).map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterLabel, filter === item && styles.filterLabelActive]}>{item === 'upcoming' ? 'Upcoming' : 'Whole trip'}</Text></Pressable>)}</View>
      {shown.length ? <View>{shown.map(activityRow)}</View> : <View style={styles.empty}><Text style={styles.emptyTitle}>{checkpoint.progress === 100 ? 'You’re here. Keep the memories.' : 'A clear road ahead.'}</Text><BodyText muted>{checkpoint.progress === 100 ? 'Open the whole trip to revisit the stops along the way.' : 'No upcoming stops. Check the whole trip to restore a skipped suggestion.'}</BodyText><Pressable accessibilityRole="button" onPress={() => setFilter('all')} style={styles.back}><Text style={styles.backText}>View whole trip →</Text></Pressable></View>}
    </View>
    <View style={styles.section}><SectionHeading title="Your people" /><View style={styles.people}>{DEMO_TRAVELERS.map((person) => <View key={person.seed} style={styles.person}><Image source={avatarSource(person.seed)} contentFit="contain" style={styles.avatar} /><Text style={styles.personName}>{person.name}</Text><Text style={styles.personRole}>{person.role}</Text></View>)}</View></View>
    <Pressable accessibilityRole="button" onPress={() => router.push('/chronicle')} style={({ pressed }) => [styles.chronicle, pressed && styles.pressed]}><Text style={styles.activityTitle}>The trip, remembered.</Text><Text style={styles.backText}>Open Chronicle →</Text></Pressable>
    <Text style={styles.note}>{TRIP.note}</Text>
  </QuestScreen>;
}

export default function TripScreen() {
  const { activity } = useLocalSearchParams<{ activity?: string }>();
  return <AuthGate><TripContent key={activity ?? 'overview'} selected={activity} /></AuthGate>;
}
const styles = StyleSheet.create({
  address: { color: C.textMuted, fontSize: 13, lineHeight: 20 },
  mapFrame: { borderRadius: 14, overflow: 'hidden' }, tripHeading: { gap: 10 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, back: { minHeight: 44, justifyContent: 'center' }, backText: { color: C.goldSoft, fontSize: 14, fontWeight: '600' }, region: { color: C.textMuted, fontSize: 12 }, pressed: { opacity: 0.7 },
  hero: { height: 270, borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end' }, heroCopy: { padding: 24, gap: 12 }, heroKicker: { color: C.goldSoft, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 }, heroTitle: { fontSize: 34, lineHeight: 39 },
  summary: { flexDirection: 'row', paddingBottom: 24, borderBottomWidth: 1, borderColor: C.border, gap: 8 }, summaryItem: { flex: 1, gap: 7 }, summaryValue: { color: C.text, fontSize: 20, fontWeight: '600' }, summaryLabel: { color: C.textMuted, fontSize: 11 },
  section: { gap: 14 }, progress: { marginHorizontal: -20 }, itineraryHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, count: { color: C.textMuted, fontSize: 12 },
  filters: { flexDirection: 'row', gap: 24, borderBottomWidth: 1, borderColor: C.border }, filter: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' }, filterActive: { borderBottomColor: C.gold }, filterLabel: { color: C.textMuted, fontSize: 14 }, filterLabelActive: { color: C.goldSoft, fontWeight: '600' },
  activity: { flexDirection: 'row', gap: 12 }, timeline: { width: 10, alignItems: 'center', paddingTop: 24 }, timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.surface, borderWidth: 1, borderColor: C.textMuted }, plannedDot: { backgroundColor: C.gold, borderColor: C.gold }, timelineLine: { flex: 1, width: 1, backgroundColor: C.border, marginTop: 7 },
  activityContent: { flex: 1, paddingBottom: 20 }, activityHeader: { minHeight: 90, flexDirection: 'row', gap: 10, alignItems: 'center' }, activityCopy: { flex: 1, gap: 6 }, activityState: { color: C.textMuted, fontSize: 10, lineHeight: 15 }, activityTitle: { color: C.text, fontSize: 17, fontWeight: '600', lineHeight: 23 }, activityTime: { color: C.goldSoft, fontSize: 11 }, expand: { color: C.gold, fontSize: 22 },
  expanded: { gap: 14, paddingTop: 8, paddingBottom: 12 }, activityDescription: { fontSize: 15, lineHeight: 24 }, bring: { color: C.textMuted, fontSize: 12, lineHeight: 20 }, actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }, secondaryButton: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 4 }, secondaryLabel: { color: C.textMuted, fontSize: 13 }, primaryButton: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 20, backgroundColor: C.gold, borderRadius: 10 }, primaryLabel: { color: C.ink, fontSize: 13, fontWeight: '700' }, confirmation: { color: C.emerald, fontSize: 11, lineHeight: 17 },
  empty: { paddingVertical: 20, gap: 12 }, emptyTitle: { color: C.text, fontSize: 20, fontWeight: '600' }, people: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, person: { flex: 1, alignItems: 'center', gap: 5 }, avatar: { width: 50, height: 66 }, personName: { color: C.text, fontSize: 12, fontWeight: '600' }, personRole: { color: C.textMuted, fontSize: 10 },
  chronicle: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, paddingVertical: 22, gap: 12 }, note: { color: C.textMuted, fontSize: 11, lineHeight: 18 },
});
