import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AuthGate } from "@/components/auth-gate";
import { QuestScreen, PixelButton } from "@/components/sidequest-ui";
import { TripGames } from "@/components/trip-games";
import { ps } from "@/components/planner-ui";
import { planner, type PlannedTrip } from "@/services/trip-planner";
import { useAuth } from "@/context/auth";
function GamesContent({ id, game }: { id: string; game?: string }) {
  const { session } = useAuth();
  const [trip, setTrip] = useState<PlannedTrip | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void planner<PlannedTrip>("detail", { id })
      .then((t) => {
        if (active) {
          setTrip(t);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  return (
    <QuestScreen>
      <Pressable
        accessibilityRole="button"
        style={ps.button}
        onPress={() => router.replace({ pathname: "/plan", params: { id } })}
      >
        <Text style={ps.link}>← Back to trip</Text>
      </Pressable>
      <Text style={ps.title}>Earn your keep on the drive.</Text>
      {!!error && (
        <>
          <Text style={ps.error}>{error}</Text>
          <PixelButton
            label="Try again"
            onPress={() => setAttempt((a) => a + 1)}
          />
        </>
      )}
      {!trip && !error && <ActivityIndicator />}
      {trip && session && (
        <>
          <Text style={ps.small}>{trip.details.name}</Text>
          <TripGames
            key={`${session.user.id}:${id}`}
            initialGame={game === "spotting" ? "Spotting" : "Trivia"}
            tripId={id}
            userId={session.user.id}
            plan={trip.details}
          />
        </>
      )}
    </QuestScreen>
  );
}
export default function GamesScreen() {
  const { id, game } = useLocalSearchParams<{ id: string; game?: string }>();
  return (
    <AuthGate>
      <GamesContent key={`${id}:${game}`} id={id} game={game} />
    </AuthGate>
  );
}
