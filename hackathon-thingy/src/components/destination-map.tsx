import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { MapCanvas } from "@/components/maps/map-canvas";
import type { MapPlace } from "@/constants/map-places";
import { SideQuestColors as C } from "@/constants/theme";

export function DestinationMap({
  place,
  height = 220,
  origin,
  stops,
}: {
  place: MapPlace;
  height?: number;
  origin?: MapPlace;
  stops?: MapPlace[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <View style={[styles.preview, { height }]}>
        <MapCanvas
          key={place.name}
          place={place}
          origin={origin}
          stops={stops}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Expand map of ${place.name}`}
          onPress={() => setExpanded(true)}
          style={styles.tapTarget}
        >
          <View style={styles.expand}>
            <Text style={styles.expandText}>⤢</Text>
          </View>
        </Pressable>
      </View>
      <Modal
        visible={expanded}
        animationType="slide"
        onRequestClose={() => setExpanded(false)}
        presentationStyle="fullScreen"
      >
        {/* A native Modal has its own window and must measure its own insets. */}
        <SafeAreaProvider>
        <SafeAreaView style={styles.fullscreen} edges={["top", "bottom", "left", "right"]}>
          <View style={styles.toolbar}>
            <View style={styles.heading}>
              <Text style={styles.title}>{place.name}</Text>
              <Text style={styles.subtitle}>
                {place.address ?? "Destination area"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close expanded map"
              onPress={() => setExpanded(false)}
              style={({ pressed }) => [styles.close, pressed && { backgroundColor: C.surfaceSoft }]}
            >
              <Text style={styles.closeText}>Done</Text>
            </Pressable>
          </View>
          <View style={styles.map}>
            {expanded && (
              <MapCanvas
                place={place}
                origin={origin}
                stops={stops}
                interactive
              />
            )}
          </View>
          <View style={styles.footer}>
            <Text style={styles.hint}>
              Drag to explore · Pinch or use + / − to zoom
            </Text>
          </View>
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  preview: { borderRadius: 24, overflow: "hidden", backgroundColor: "#E2E5DE" },
  // Attribution remains readable below the tap overlay.
  tapTarget: { position: "absolute", top: 0, left: 0, right: 0, bottom: 22 },
  expand: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  expandText: { color: C.text, fontSize: 28 },
  fullscreen: { flex: 1, backgroundColor: C.void },
  toolbar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heading: { flex: 1, gap: 4 },
  title: { color: C.text, fontSize: 22, fontWeight: "600" },
  subtitle: { color: C.textMuted, fontSize: 12 },
  close: {
    flexShrink: 0,
    borderRadius: 24,
    paddingHorizontal: 16,
    minWidth: 72,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: C.goldSoft, fontSize: 16, fontWeight: "600" },
  map: { flex: 1 },
  footer: { padding: 16, alignItems: "center", gap: 4 },
  hint: { color: C.textMuted, fontSize: 12 },
  external: { minHeight: 44, justifyContent: "center" },
  externalText: { color: C.goldSoft, fontSize: 13 },
});
