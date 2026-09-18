import { DemoPastTrips } from "@/components/demo-past-trips";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { TripPhoto } from "@/components/trip-photo";
import { router, useFocusEffect } from "expo-router";
import { AuthGate } from "@/components/auth-gate";
import { BodyText, PixelButton, QuestScreen } from "@/components/sidequest-ui";
import { ps } from "@/components/planner-ui";
import { SideQuestColors as C } from "@/constants/theme";
import { historyTrips, HistoryTrip } from "@/services/trip-history";
function ChronicleContent() {
  const [trips, setTrips] = useState<HistoryTrip[]>([]);
  const [filter, setFilter] = useState("All trips");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setTrips(await historyTrips());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your trips.");
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const shown = trips.filter(
    (t) =>
      filter === "All trips" ||
      (filter === "Past trips"
        ? t.journey.status === "completed"
        : ["active", "paused"].includes(t.journey.status)),
  );
  return (
    <QuestScreen>
      <View style={ps.section}>
        <Text style={ps.title}>Travel history</Text>
        <BodyText muted>Your trips and the photos you took together.</BodyText>
      </View>
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderColor: C.border,
        }}
      >
        {["All trips", "On the road", "Past trips"].map((f) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === f }}
            key={f}
            onPress={() => setFilter(f)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
              borderBottomWidth: 2,
              borderColor: filter === f ? C.gold : "transparent",
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Text style={filter === f ? ps.link : ps.small}>{f}</Text>
          </Pressable>
        ))}
      </View>
      {loading && <ActivityIndicator color={C.gold} />}
      {!!error && (
        <>
          <Text style={ps.error}>{error}</Text>
          <PixelButton
            label="Try again"
            variant="ghost"
            onPress={() => void load()}
          />
        </>
      )}
      {!loading && !error && !shown.length && (
        <View style={ps.section}>
          <Text style={ps.label}>
            {filter === "Past trips"
              ? "No completed trips yet."
              : "No trips here yet."}
          </Text>
          <BodyText muted>
            {filter === "Past trips"
              ? "When a trip ends, its photos and itinerary stay here."
              : "Plan a trip or join your friends to start your shared album."}
          </BodyText>
          <PixelButton
            label="Plan a trip"
            onPress={() => router.push("/plan")}
          />
        </View>
      )}
      {shown.map(({ journey: j, cover, photoCount, name }) => (
        <Pressable
          key={j.id}
          accessibilityRole="button"
          accessibilityLabel={`Open travel history for ${name}`}
          onPress={() =>
            router.push({ pathname: "/history", params: { id: j.id } })
          }
          style={({ pressed }) => ({
            gap: 12,
            opacity: pressed ? 0.75 : 1,
            marginBottom: 12,
          })}
        >
          <TripPhoto
            key={cover ?? j.id}
            uri={cover}
            label={`Photo uploaded by a member of ${name}`}
            style={{ height: 210, width: "100%" }}
          />
          <View style={ps.row}>
            <Text style={[ps.label, { flex: 1, fontSize: 20, lineHeight: 26 }]}>
              {name}
            </Text>
            <Text style={ps.link}>↗</Text>
          </View>
          <Text style={ps.small}>
            {new Date(j.started_at ?? j.created_at).toLocaleDateString()} ·{" "}
            {photoCount} {photoCount === 1 ? "photo" : "photos"} ·{" "}
            {j.status === "planning"
              ? "Draft"
              : j.status === "completed"
                ? "Completed"
                : j.status === "active"
                  ? "On the road"
                  : j.status}
          </Text>
        </Pressable>
      ))}
      {filter !== "On the road" && <DemoPastTrips />}
    </QuestScreen>
  );
}
export default function ChronicleScreen() {
  return (
    <AuthGate>
      <ChronicleContent />
    </AuthGate>
  );
}
