import { useCallback, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { DestinationMap } from "./destination-map";
import { BodyText, PixelButton } from "./sidequest-ui";
import { ps } from "./planner-ui";
import { PlannedTrip, planner, Social } from "@/services/trip-planner";
export function PlannedTrips() {
  const [trips, setTrips] = useState<PlannedTrip[]>([]);
  const [invitations, setInvitations] = useState<Social["invitations"]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([
        planner<PlannedTrip[]>("list"),
        planner<Social>("social"),
      ]);
      setTrips(t);
      setInvitations(s.invitations);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load trips.");
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => void load(), 10000);
      return () => clearInterval(timer);
    }, [load]),
  );
  return (
    <View style={{ gap: 20 }}>
      <View style={ps.row}>
        <View style={{ flex: 1 }}>
          <Text style={ps.title}>Your trips</Text>
          <Text style={ps.small}>One adventure at a time. Plan the next whenever you like.</Text>
        </View>
        <PixelButton
          raised label="+ Add trip"
          size="compact"
          onPress={() => router.push("/plan")}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        style={ps.button}
        onPress={() => router.push("/join")}
      >
        <Text style={ps.link}>Have an invite code? Join a trip →</Text>
      </Pressable>
      {!!error && (
        <View style={ps.card}>
          <Text style={ps.error}>{error}</Text>
          <PixelButton
            label="Reload trips"
            variant="ghost"
            onPress={() => void load()}
          />
        </View>
      )}
      {invitations.map((i) => (
        <View style={ps.card} key={i.id}>
          <Text style={ps.label}>{i.from} invited you</Text>
          <BodyText>{i.title}</BodyText>
          <PixelButton
            label="Accept invitation"
            loading={busy}
            onPress={async () => {
              setBusy(true);
              try {
                const t = await planner<{ id: string }>("accept", {
                  inviteId: i.id,
                });
                router.push({ pathname: "/plan", params: { id: t.id } });
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not join.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </View>
      ))}
      {trips
        .filter((t) => ["active", "paused", "planning"].includes(t.status))
        .sort((a, b) => Number(b.status === "active") - Number(a.status === "active"))
        .map((t) => (
          <View style={{ gap: 14 }} key={t.id}>
            <Text style={[ps.label, { fontSize: 20 }]}>{t.status === "planning" ? "Next adventures · Draft" : "Your active quest"}</Text>
            <DestinationMap
              place={t.details.destination}
              origin={t.details.origin}
              stops={t.details.activities
                .filter((a) => a.included)
                .map((a) => a.place)}
              height={170}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${t.details.name}`}
              onPress={() =>
                router.push({ pathname: "/plan", params: { id: t.id } })
              }
              style={{ gap: 7, minHeight: 60 }}
            >
              <Text style={ps.label}>{t.details.name} ↗</Text>
              <Text style={ps.small}>
                {t.details.origin.name} → {t.details.destination.name}
              </Text>
              <Text style={ps.link}>
                {t.status === "planning"
                  ? "Draft · invite your people"
                  : "On the road"}{" "}
                · {t.details.startDate}
              </Text>
            </Pressable>
            {t.status === "active" && <View style={ps.card}>
              <Text style={[ps.label, { fontSize: 20 }]}>Make the journey a game.</Text>
              <Text style={ps.small}>Five quick questions, or spot things along the road. For passengers or when parked.</Text>
              <PixelButton raised label="Play quick trivia →" onPress={() => router.push({ pathname: "/games", params: { id: t.id, game: "trivia" } })} />
              <PixelButton variant="blue" label="Open travel bingo" onPress={() => router.push({ pathname: "/games", params: { id: t.id, game: "spotting" } })} />
              <PixelButton variant="ghost" label="Open active trip" onPress={() => router.push({ pathname: "/plan", params: { id: t.id } })} />
            </View>}
          </View>
        ))}
      {!loading && !error && !trips.some((t) => t.status !== "completed") && (
        <View style={ps.card}>
          <Text style={ps.label}>No trips planned yet.</Text>
          <BodyText muted>
            Your Stellenbosch → Tierfontein Farm plan is ready to customise. Tap
            Add trip, review the stops, then invite your people.
          </BodyText>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        style={ps.button}
        onPress={() => router.push("/chronicle")}
      >
        <Text style={ps.link}>Travel history →</Text>
      </Pressable>
    </View>
  );
}
