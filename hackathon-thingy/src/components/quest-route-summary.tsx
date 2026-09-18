import { StyleSheet, Text, View } from "react-native";
import { SideQuestColors as C } from "@/constants/theme";
import type { PlanDetails } from "@/services/trip-planner";
import type { RouteData } from "@/services/route-planning";

export function travelDuration(minutes: number) {
  const total = Math.round(minutes);
  return total < 60 ? `${total} min` : `${Math.floor(total / 60)} hr${total % 60 ? ` ${total % 60} min` : ""}`;
}
function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}
export function QuestRouteSummary({ plan, route, direct }: { plan: PlanDetails; route: RouteData | null; direct: RouteData | null }) {
  const stops = plan.activities.filter(a => a.included);
  const resting = stops.reduce((sum, a) => sum + a.duration, 0);
  const metrics = route ?? direct;
  return <View style={s.summary}>
    <Text style={s.date}>{dateLabel(plan.startDate)}{plan.startDate !== plan.endDate ? ` – ${dateLabel(plan.endDate)}` : " · Day trip"}</Text>
    <View style={s.route}><View style={s.line} /><View style={s.point}><Text style={s.marker}>A</Text><Text style={s.place}>{plan.origin.name}</Text></View><View style={s.point}><Text style={s.marker}>B</Text><Text style={s.place}>{plan.destination.name}</Text></View></View>
    <View style={s.stats}>
      {[{ label: route ? "Route distance" : "Direct distance", value: metrics ? `${Math.round(metrics.distanceKm)} km` : "—" }, { label: route ? "Driving" : "Direct drive", value: metrics ? travelDuration(metrics.minutes) : "—" }, { label: `${stops.length} stops`, value: travelDuration(resting) }].map(item => <View style={s.stat} key={item.label}><Text style={s.value}>{item.value}</Text><Text style={s.label}>{item.label}</Text></View>)}
    </View>
    <Text style={s.total}>{route ? `Allow about ${travelDuration(route.minutes + resting)} including stops` : "Calculating your route through the stops…"}</Text>
    <Text style={s.note}>Driving is an estimate. Time at each stop is added separately.</Text>
  </View>;
}
const s = StyleSheet.create({
  summary: { gap: 18, padding: 20, borderRadius: 24, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  date: { color: C.goldSoft, fontSize: 13, fontWeight: "600" },
  route: { gap: 20, position: "relative" },
  line: { position: "absolute", left: 13, top: 14, bottom: 14, borderLeftWidth: 1, borderStyle: "dashed", borderColor: C.borderStrong },
  point: { flexDirection: "row", alignItems: "center", gap: 12 },
  marker: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surfaceSoft, color: C.text, textAlign: "center", lineHeight: 28, fontSize: 12, fontWeight: "800", overflow: "hidden" },
  place: { flex: 1, color: C.text, fontSize: 16, fontWeight: "600" },
  stats: { flexDirection: "row", gap: 10, paddingTop: 18, borderTopWidth: 1, borderColor: C.border },
  stat: { flex: 1, gap: 6 },
  value: { color: C.text, fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"] },
  label: { color: C.textMuted, fontSize: 11 },
  total: { color: C.goldSoft, fontWeight: "600", fontSize: 14, lineHeight: 21 },
  note: { color: C.textMuted, fontSize: 11, lineHeight: 16, marginTop: -10 },
});
