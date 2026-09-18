import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AuthGate } from "@/components/auth-gate";
import { QuestScreen, PixelButton } from "@/components/sidequest-ui";
import { PlaceSuggestion } from "@/components/place-suggestion";
import { ps, Field, Option } from "@/components/planner-ui";
import { planner, type PlannedTrip } from "@/services/trip-planner";
import {
  discoverStops,
  drivingRoute,
  routePosition,
  type RouteStop,
  type RouteData,
} from "@/services/route-planning";
import { VERIFIED_STARTER_ACTIVITIES } from "@/constants/verified-venues";
import { MAP_PLACES } from "@/constants/map-places";
import { useAuth } from "@/context/auth";
function PlacesContent({ id }: { id: string }) {
  const { session } = useAuth();
  const [trip, setTrip] = useState<PlannedTrip | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState("All");
  const [stops, setStops] = useState<RouteStop[]>([]),
    [route, setRoute] = useState<RouteData | null>(null),
    [searched, setSearched] = useState(false);
  async function load() {
    try {
      setTrip(await planner<PlannedTrip>("detail", { id }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load trip.");
    }
  }
  useEffect(() => {
    let active = true;
    void planner<PlannedTrip>("detail", { id })
      .then((t) => {
        if (active) setTrip(t);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function search() {
    if (!trip) return;
    setBusy(true);
    setError("");
    try {
      const road = await drivingRoute([
        trip.details.origin,
        trip.details.destination,
      ]);
      setRoute(road);
      setStops(await discoverStops(road));
      setSearched(true);
    } catch {
      setError(
        "Live place search is unavailable. Try again in a moment; your itinerary is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  }
  const sampleRoute =
    trip?.details.origin.name === MAP_PLACES.origin.name &&
    trip?.details.destination.name === MAP_PLACES.destination.name;
  const ideas: RouteStop[] =
    !searched && sampleRoute
      ? VERIFIED_STARTER_ACTIVITIES.map((a) => ({ ...a, kind: "food" as const, routeKm: 0 }))
      : stops;
  const shown = ideas.filter(
    (s) =>
      (kind === "All" || s.kind === kind.toLowerCase()) &&
      `${s.title} ${s.place.name} ${s.cuisine ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <QuestScreen>
      <Pressable
        accessibilityRole="button"
        style={ps.button}
        onPress={() => router.replace({ pathname: "/plan", params: { id } })}
      >
        <Text style={ps.link}>← Back to trip</Text>
      </Pressable>
      <Text style={ps.title}>Worth a little detour.</Text>
      {!trip && !error && <ActivityIndicator />}
      {!!error && (
        <Text accessibilityRole="alert" style={ps.error}>
          {error}
        </Text>
      )}
      {!trip && !!error && (
        <PixelButton label="Reload trip" onPress={() => void load()} />
      )}
      {trip && (
        <>
          <Text style={ps.small}>
            {trip.details.origin.name} → {trip.details.destination.name}
          </Text>
          <PixelButton
            label={
              searched
                ? "Refresh mapped places"
                : "Find mapped places on this route"
            }
            loading={busy}
            onPress={() => void search()}
          />
          <Text style={ps.small}>
            {searched
              ? `${stops.length} mapped places within 2 km of the route. Check the driving detour before adding.`
              : sampleRoute
                ? "Start with these real venues, or search for mapped places including fuel stops."
                : "Search for food, scenery, local discoveries and fuel stops along your route."}
          </Text>
          <Field
            label="Search places"
            value={query}
            onChangeText={setQuery}
            placeholder="Coffee, viewpoints, a place name…"
          />
          <View style={ps.options}>
            {["All", "Food", "Scenic", "Culture", "Fuel"].map((k) => (
              <Option
                key={k}
                label={k}
                selected={kind === k}
                onPress={() => setKind(k)}
              />
            ))}
          </View>
          {!shown.length && (
            <Text style={ps.small}>
              {busy
                ? "Searching along your route…"
                : kind === "Fuel" && !searched
                  ? "Search mapped places above to find potential fuel stops."
                  : "No places match this filter. Try another category or search."}
            </Text>
          )}
          {shown.slice(0, 40).map((stop) => (
            <PlaceSuggestion
              key={stop.id}
              stop={stop}
              sample={!searched}
              plan={trip.details}
              included={trip.details.activities.some(
                (a) => a.id === stop.id && a.included,
              )}
              canAdd={
                trip.ownerId === session?.user.id && trip.status === "planning"
              }
              onAdd={async () => {
                const existing = trip.details.activities.find(
                  (a) => a.id === stop.id,
                );
                if (!existing && trip.details.activities.length >= 20)
                  throw new Error(
                    "Your itinerary has 20 stops. Remove one before adding another.",
                  );
                const activities = existing
                  ? trip.details.activities.map((a) =>
                      a.id === stop.id ? { ...a, included: true } : a,
                    )
                  : [...trip.details.activities, stop];
                if (route)
                  activities.sort(
                    (a, b) =>
                      routePosition(route, a.place.longitude, a.place.latitude)
                        .routeKm -
                      routePosition(route, b.place.longitude, b.place.latitude)
                        .routeKm,
                  );
                await planner("update", {
                  id,
                  revision: trip.revision,
                  details: { ...trip.details, activities },
                });
                setTrip(await planner<PlannedTrip>("detail", { id }));
              }}
            />
          ))}
        </>
      )}
    </QuestScreen>
  );
}
export default function PlacesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <AuthGate>
      <PlacesContent key={id} id={id} />
    </AuthGate>
  );
}
