import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { TRIP } from "@/constants/trip";
import { SideQuestColors as C } from "@/constants/theme";
import { avatarSource } from "@/lib/avatar";

export const DEMO_TRAVELERS = [
  { name: "Kyle", seed: "kyle", role: "Pilot", color: C.gold },
  { name: "Sam", seed: "sam", role: "Navigator", color: C.cobalt },
  { name: "Thandi", seed: "thandi", role: "Passenger", color: C.emerald },
  { name: "Tebogo", seed: "tebogo", role: "Passenger", color: C.amber },
] as const;

/** All travellers share the car's progress. Insets keep every sprite visible at both ends. */
export function TripProgress({
  progress,
  origin = TRIP.origin,
  destination = TRIP.destination,
  travelers = DEMO_TRAVELERS,
}: {
  progress: number;
  origin?: string;
  destination?: string;
  travelers?: readonly { name: string; seed: string; color: string }[];
}) {
  const value = Math.max(0, Math.min(100, progress));
  const [width, setWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [animated] = useState(() => new Animated.Value(value / 100));
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      active = false;
      listener.remove();
    };
  }, []);
  useEffect(() => {
    const animation = Animated.timing(animated, {
      toValue: value / 100,
      duration: reduceMotion ? 0 : 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animated, value, reduceMotion]);
  const groupWidth = Math.min(272, travelers.length * 34);
  const travel = Math.max(0, width - groupWidth);
  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${travelers.map((p) => p.name).join(", ")} shared trip progress`}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: value,
        text: `${value}% of the way to ${destination}`,
      }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value}% of the way to ${destination}`}
    >
      <View style={styles.heading}>
        <Text style={styles.title}>A little further, together.</Text>
        <Text style={styles.percent}>{value}%</Text>
      </View>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={styles.journey}
      >
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              {
                width: animated.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        {[0, 25, 50, 75, 100].map((mark) => (
          <View
            key={mark}
            style={[
              styles.milestone,
              {
                left: `${mark}%`,
                backgroundColor: value >= mark ? C.gold : "#A3B1A3",
              },
            ]}
          />
        ))}
        <Animated.View
          style={[
            styles.party,
            {
              width: groupWidth,
              transform: [
                {
                  translateX: animated.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, travel],
                  }),
                },
              ],
            },
          ]}
        >
          {travelers.map((person, i) => (
            <View
              key={person.seed}
              style={[
                styles.traveler,
                {
                  zIndex: travelers.length - i,
                  width: groupWidth / travelers.length,
                },
              ]}
            >
              <Image
                source={avatarSource(person.seed)}
                contentFit="contain"
                style={styles.sprite}
                accessibilityLabel={person.name}
              />
              <View style={[styles.dot, { backgroundColor: person.color }]} />
            </View>
          ))}
        </Animated.View>
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>{origin}</Text>
        <Text style={styles.label}>{destination}</Text>
      </View>
      <View style={styles.legend}>
        {travelers.map((person) => (
          <View key={person.seed} style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: person.color }]}
            />
            <Text style={styles.legendText}>{person.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 2, paddingBottom: 20 },
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
  },
  title: { color: C.textMuted, fontSize: 12 },
  percent: {
    color: C.goldSoft,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  journey: { height: 91, marginHorizontal: 5 },
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DFE5DC",
    overflow: "hidden",
  },
  fill: { height: 6, backgroundColor: C.gold, borderRadius: 3 },
  milestone: {
    position: "absolute",
    bottom: 6,
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: C.surface,
  },
  party: { position: "absolute", left: 0, bottom: 15, flexDirection: "row" },
  traveler: { width: 34, alignItems: "center" },
  sprite: { width: 47, height: 60 },
  dot: { width: 16, height: 3, borderRadius: 2, opacity: 0.6, marginTop: 2 },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 3,
  },
  label: { color: C.textMuted, fontSize: 11 },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 15,
    marginTop: 18,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 5, height: 5, borderRadius: 3 },
  legendText: { color: C.textMuted, fontSize: 10 },
});
