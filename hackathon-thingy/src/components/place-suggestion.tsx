import { useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { drivingRoute, type RouteStop } from "@/services/route-planning";
import type { PlanDetails } from "@/services/trip-planner";
import { SideQuestColors as C } from "@/constants/theme";
import { QuestStopPreview } from "./quest-stop-preview";
import { PixelButton } from "./sidequest-ui";
import { ps } from "./planner-ui";
export function PlaceSuggestion({
  stop,
  plan,
  included,
  canAdd,
  onAdd,
  sample = false,
}: {
  stop: RouteStop;
  plan: PlanDetails;
  included: boolean;
  canAdd: boolean;
  onAdd: () => Promise<void>;
  sample?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [detour, setDetour] = useState<{ minutes: number; km: number } | null>(
      null,
    );
  async function estimate() {
    setBusy(true);
    setError("");
    try {
      const [direct, via] = await Promise.all([
        drivingRoute([plan.origin, plan.destination]),
        drivingRoute([plan.origin, stop.place, plan.destination]),
      ]);
      setDetour({
        minutes: Math.max(0, Math.round(via.minutes - direct.minutes)),
        km: Math.max(0, Math.round(via.distanceKm - direct.distanceKm)),
      });
    } catch {
      setError("Could not calculate the detour. Try again.");
    } finally {
      setBusy(false);
    }
  }
  async function link(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setError("Could not open that link.");
    }
  }
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${stop.title}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [ps.card, { opacity: pressed ? 0.75 : 1 }]}
      >
        <View style={ps.row}>
          <Text style={[ps.label, { fontSize: 18, flex: 1 }]}>
            {stop.title}
          </Text>
          <Text style={ps.link}>↗</Text>
        </View>
        <Text style={ps.small}>
          {stop.kind === "fuel"
            ? "Fuel stop"
            : stop.kind === "food"
              ? "Food & coffee"
              : stop.kind === "scenic"
                ? "Scenery"
                : "Local discovery"}{" "}
          · {stop.duration} min
          {sample
            ? " · Curated venue"
            : ` · ~${Math.round(stop.routeKm)} km along route`}
        </Text>
        <Text style={ps.link}>
          {included ? "✓ In your itinerary" : "View place & detour"}
        </Text>
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: C.void }}>
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              gap: 20,
              maxWidth: 680,
              width: "100%",
              alignSelf: "center",
            }}
          >
            <View style={ps.row}>
              <Text style={[ps.title, { flex: 1 }]}>{stop.title}</Text>
              <Pressable
                accessibilityRole="button"
                style={ps.button}
                onPress={() => setOpen(false)}
              >
                <Text style={ps.link}>Done</Text>
              </Pressable>
            </View>
            <Text style={ps.small}>
              {sample
                ? "Curated venue · official website checked"
                : "Mapped place · OpenStreetMap"}
            </Text>
            <QuestStopPreview activity={stop} />
            {!!stop.cuisine && (
              <Text style={ps.small}>Food: {stop.cuisine}</Text>
            )}
            <View style={ps.card}>
              <Text style={ps.label}>Before you stop</Text>
              <Text style={ps.small}>
                Allow {stop.duration} min at the stop
              </Text>
              <Text style={ps.small}>
                Opening hours: {stop.openingHours ?? "Not provided"}
              </Text>
              {!!stop.wheelchair && (
                <Text style={ps.small}>
                  Wheelchair access: {stop.wheelchair}
                </Text>
              )}
              <Text style={ps.small}>
                Hours and access are map listings, not live availability.
              </Text>
            </View>
            {detour ? (
              <Text style={ps.label}>
                About {detour.minutes} extra driving min · {detour.km} extra km
                · plus {stop.duration} min at the stop
              </Text>
            ) : (
              <PixelButton
                label="Estimate driving detour"
                variant="ghost"
                loading={busy}
                onPress={() => void estimate()}
              />
            )}
            <Text style={ps.small}>
              Detour compares the direct route with a route via this stop. Other
              planned stops are excluded.
            </Text>
            {!!error && (
              <Text accessibilityRole="alert" style={ps.error}>
                {error}
              </Text>
            )}
            {canAdd && (
              <PixelButton
                raised label={included ? "Added to itinerary" : "Add to trip"}
                disabled={included || busy}
                loading={busy}
                onPress={() => {
                  setBusy(true);
                  setError("");
                  void onAdd()
                    .catch((e) => setError(e.message))
                    .finally(() => setBusy(false));
                }}
              />
            )}
            {!canAdd && (
              <Text style={ps.small}>
                You can explore this place. Only the organiser can change a
                draft itinerary.
              </Text>
            )}
            <PixelButton
              label="Open directions"
              variant="ghost"
              onPress={() =>
                void link(
                  `https://www.google.com/maps/dir/?api=1&destination=${stop.place.latitude},${stop.place.longitude}&travelmode=driving`,
                )
              }
            />
            {stop.website && (
              <PixelButton
                label="Visit website"
                variant="ghost"
                onPress={() => void link(stop.website!)}
              />
            )}
            {stop.osmUrl && (
              <Pressable
                accessibilityRole="link"
                style={ps.button}
                onPress={() => void link(stop.osmUrl!)}
              >
                <Text style={ps.link}>View OpenStreetMap listing ↗</Text>
              </Pressable>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
