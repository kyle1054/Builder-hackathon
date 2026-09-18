import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TravelerAvatar } from "@/components/traveler-avatar";
import { router, useFocusEffect } from "expo-router";
import { AuthGate } from "@/components/auth-gate";
import {
  BodyText,
  PixelButton,
  QuestScreen,
  SectionHeading,
} from "@/components/sidequest-ui";
import { ps } from "@/components/planner-ui";
import { planner, PlannedTrip, Social } from "@/services/trip-planner";
function PartyContent() {
  const [social, setSocial] = useState<Social>({
    friends: [],
    travelers: [],
    invitations: [],
  });
  const [trips, setTrips] = useState<PlannedTrip[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([
        planner<Social>("social"),
        planner<PlannedTrip[]>("list"),
      ]);
      setSocial(s);
      setTrips(t);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your people.");
    } finally {
      setLoaded(true);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => void load(), 10000);
      return () => clearInterval(timer);
    }, [load]),
  );
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <QuestScreen>
      <View style={ps.section}>
        <Text style={ps.title}>Your people</Text>
        <BodyText muted>Friends, invitations and the trips you share.</BodyText>
      </View>
      <PixelButton
        label="Join with an invite code"
        variant="ghost"
        onPress={() => router.push("/join")}
      />
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
      {social.invitations.length > 0 && (
        <View style={ps.section}>
          <SectionHeading title="Invitations" />
          {social.invitations.map((i) => (
            <View key={i.id} style={ps.divider}>
              <Text style={ps.label}>{i.title}</Text>
              <Text style={ps.small}>From {i.from}</Text>
              <PixelButton
                label="Join trip"
                loading={busy}
                onPress={() =>
                  run(async () => {
                    const t = await planner<{ id: string }>("accept", {
                      inviteId: i.id,
                    });
                    router.push({ pathname: "/plan", params: { id: t.id } });
                  })
                }
              />
            </View>
          ))}
        </View>
      )}
      <View style={ps.section}>
        <SectionHeading title="Friends" />
        {loaded && !social.friends.length && (
          <BodyText muted>
            No saved friends yet. Join a trip together, then save your
            companions here.
          </BodyText>
        )}
        {social.friends.map((p) => (
          <View key={p.id} style={[ps.row, { minHeight: 72 }]}>
            <TravelerAvatar key={p.seed} seed={p.seed} name={p.name} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={ps.label}>{p.name}</Text>
              <Text style={ps.small}>Saved friend</Text>
            </View>
          </View>
        ))}
      </View>
      {social.travelers.some(
        (p) => !social.friends.some((f) => f.id === p.id),
      ) && (
        <View style={ps.divider}>
          <SectionHeading title="Travel companions" />
          {social.travelers
            .filter((p) => !social.friends.some((f) => f.id === p.id))
            .map((p) => (
              <View key={p.id} style={ps.row}>
                <TravelerAvatar key={p.seed} seed={p.seed} name={p.name} />
                <Text style={[ps.label, { flex: 1 }]}>{p.name}</Text>
                <PixelButton
                  label="Add friend"
                  size="compact"
                  variant="ghost"
                  disabled={busy}
                  onPress={() =>
                    run(async () => {
                      await planner("save_friend", { userId: p.id });
                    })
                  }
                />
              </View>
            ))}
        </View>
      )}
      <View style={ps.divider}>
        <SectionHeading title="Your groups" />
        {trips.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/plan", params: { id: t.id } })
            }
            style={({ pressed }) => ({
              paddingVertical: 14,
              gap: 7,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={ps.label}>{t.details.name} ↗</Text>
            <Text style={ps.small}>
              {t.details.destination.name} ·{" "}
              {t.status === "planning"
                ? "Draft"
                : t.status === "completed"
                  ? "Completed"
                  : "On the road"}
            </Text>
          </Pressable>
        ))}
        {loaded && !trips.length && (
          <BodyText muted>Create a trip to bring your group together.</BodyText>
        )}
      </View>
    </QuestScreen>
  );
}
export default function PartyScreen() {
  return (
    <AuthGate>
      <PartyContent />
    </AuthGate>
  );
}
