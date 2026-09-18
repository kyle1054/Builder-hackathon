import { useCallback, useRef, useState } from "react";
import { AppState, Linking, Pressable, Text, View } from "react-native";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { LANDMARK_FACTS, distanceKm } from "@/constants/landmark-facts";
import { ps } from "./planner-ui";
import { BodyText, PixelButton, SectionHeading } from "./sidequest-ui";
import { DestinationMap } from "./destination-map";
export function NearbyFacts() {
  const [enabled, setEnabled] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [nearby, setNearby] = useState<string | null>(null);
  const seen = useRef(new Set<string>());
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      let alive = true,
        generation = 0,
        subscription: Location.LocationSubscription | undefined;
      const stop = () => {
        generation++;
        subscription?.remove();
        subscription = undefined;
      };
      const start = async () => {
        const attempt = ++generation;
        try {
          const sub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 100,
              timeInterval: 15000,
            },
            (position) => {
              if (
                !alive ||
                attempt !== generation ||
                Date.now() - position.timestamp > 60000 ||
                (position.coords.accuracy ?? Infinity) > 500
              )
                return;
              const fact = LANDMARK_FACTS.filter(
                (f) => distanceKm(position.coords, f) <= f.radiusKm,
              ).sort(
                (a, b) =>
                  distanceKm(position.coords, a) -
                  distanceKm(position.coords, b),
              )[0];
              setNearby(fact?.id ?? null);
              if (fact && !seen.current.has(fact.id)) {
                seen.current.add(fact.id);
                setSelected(fact.id);
              }
            },
          );
          if (
            alive &&
            attempt === generation &&
            AppState.currentState === "active"
          )
            subscription = sub;
          else sub.remove();
        } catch {
          if (alive) {
            setError(
              "Location is unavailable. You can still browse the facts.",
            );
            setEnabled(false);
          }
        }
      };
      if (AppState.currentState === "active") void start();
      const listener = AppState.addEventListener("change", (state) => {
        stop();
        if (state === "active") void start();
      });
      return () => {
        alive = false;
        stop();
        listener.remove();
      };
    }, [enabled]),
  );
  const fact = LANDMARK_FACTS.find((f) => f.id === selected);
  return (
    <View style={ps.section}>
      <SectionHeading title="Little discoveries" />
      <Text style={ps.small}>
        Facts from the Overberg. Browse them, or let nearby places find you.
      </Text>
      <PixelButton
        label={
          enabled ? "Turn off nearby facts" : "Use location for nearby facts"
        }
        variant="ghost"
        loading={pending}
        onPress={async () => {
          if (enabled) {
            setEnabled(false);
            setNearby(null);
            return;
          }
          setPending(true);
          setError("");
          try {
            const permission =
              await Location.requestForegroundPermissionsAsync();
            if (permission.granted) setEnabled(true);
            else
              setError(
                "Location permission was not granted. Manual browsing still works.",
              );
          } catch {
            setError("Could not access location. Manual browsing still works.");
          } finally {
            setPending(false);
          }
        }}
      />
      <Text style={ps.small}>
        {enabled
          ? nearby
            ? "You’re near a featured place."
            : "Listening while this trip screen is open. No featured place nearby yet."
          : "Location stays on your device. Nearby detection runs only while this screen is open."}
      </Text>
      {!!error && <Text style={ps.error}>{error}</Text>}
      {LANDMARK_FACTS.map((f) => (
        <Pressable
          key={f.id}
          accessibilityRole="button"
          accessibilityState={{ expanded: selected === f.id }}
          style={[ps.row, ps.divider]}
          onPress={() => setSelected(selected === f.id ? null : f.id)}
        >
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={ps.label}>{f.title}</Text>
            <Text style={ps.small}>
              {f.area}
              {nearby === f.id ? " · Nearby" : ""}
            </Text>
          </View>
          <Text style={ps.link}>{selected === f.id ? "−" : "+"}</Text>
        </Pressable>
      ))}
      {fact && (
        <View style={ps.card}>
          <Text accessibilityLiveRegion="polite" style={ps.label}>
            {nearby === fact.id ? "You’re passing nearby" : fact.area}
          </Text>
          <BodyText>{fact.body}</BodyText>
          <DestinationMap
            place={{
              name: fact.area,
              latitude: fact.latitude,
              longitude: fact.longitude,
              span: 0.06,
            }}
            height={150}
          />
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              void Linking.openURL(fact.url).catch(() =>
                setError("Could not open the source link."),
              )
            }
            style={ps.button}
          >
            <Text style={ps.link}>Read more · {fact.source} ↗</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
