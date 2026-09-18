import { DEMO_PAST_TRIPS } from "@/constants/demo-trips";
import { DemoHistory } from "@/components/demo-past-trips";
import { useCallback, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthGate } from "@/components/auth-gate";
import {
  BodyText,
  PixelButton,
  QuestScreen,
  SectionHeading,
} from "@/components/sidequest-ui";
import { ps } from "@/components/planner-ui";
import {
  historyDetail,
  MemoryPhoto,
  pickTripPhoto,
} from "@/services/trip-history";
import { SideQuestColors as C } from "@/constants/theme";
import { DestinationMap } from "@/components/destination-map";
function HistoryContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<Awaited<
    ReturnType<typeof historyDetail>
  > | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<MemoryPhoto | null>(null);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      setData(await historyDetail(id));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this trip.");
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => void load(), 30000);
      return () => clearInterval(timer);
    }, [load]),
  );
  const upload = async () => {
    setBusy(true);
    setError("");
    try {
      const added = await pickTripPhoto(
        id,
        data?.journey.destination_name ?? "",
      );
      if (added) {
        await load();
        setNotice("Photo added to the shared album.");
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Photo upload failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <QuestScreen>
      <Pressable
        accessibilityRole="button"
        style={ps.button}
        onPress={() => router.replace("/chronicle")}
      >
        <Text style={ps.link}>← Travel history</Text>
      </Pressable>
      {!!error && (
        <>
          <Text accessibilityRole="alert" style={ps.error}>
            {error}
          </Text>
          <PixelButton
            label="Reload trip"
            variant="ghost"
            onPress={() => void load()}
          />
        </>
      )}
      {!data && !error && <ActivityIndicator color={C.gold} />}
      {data && (
        <>
          <View style={ps.section}>
            <Text style={ps.title}>
              {data.plan?.details.name ??
                `${data.journey.origin_name} to ${data.journey.destination_name}`}
            </Text>
            <Text style={ps.small}>
              {data.plan
                ? `${data.plan.details.startDate} — ${data.plan.details.endDate}`
                : new Date(
                    data.journey.started_at ?? data.journey.created_at,
                  ).toLocaleDateString()}{" "}
              ·{" "}
              {data.journey.status === "completed"
                ? "Completed"
                : data.journey.status === "planning"
                  ? "Draft"
                  : "On the road"}
            </Text>
            <BodyText muted>
              {data.journey.origin_name} → {data.journey.destination_name}
            </BodyText>
          </View>
          <View style={[ps.row, ps.divider]}>
            <View>
              <Text style={ps.label}>{data.photos.length} photos</Text>
              <Text style={ps.small}>
                From {new Set(data.photos.map((p) => p.captured_by)).size}{" "}
                members
              </Text>
            </View>
            <PixelButton
              label="Add photos"
              size="compact"
              loading={busy}
              onPress={upload}
            />
          </View>
          {!!notice && (
            <Text accessibilityLiveRegion="polite" style={ps.link}>
              {notice}
            </Text>
          )}
          {!data.photos.length && (
            <View style={[ps.card, { paddingVertical: 36 }]}>
              <Text style={ps.label}>No photos yet</Text>
              <BodyText muted>
                Add a photo from this trip. Everyone in the group can see it
                here.
              </BodyText>
            </View>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {data.photos.map((photo) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open photo by ${photo.owner}`}
                key={photo.id}
                onPress={() => setSelected(photo)}
                style={({ pressed }) => ({
                  width: "48%",
                  gap: 8,
                  marginBottom: 12,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                {photo.url ? (
                  <Image
                    source={{ uri: photo.url }}
                    contentFit="cover"
                    style={{ width: "100%", aspectRatio: 1, borderRadius: 10 }}
                  />
                ) : (
                  <View
                    style={[
                      ps.card,
                      { aspectRatio: 1, justifyContent: "center" },
                    ]}
                  >
                    <Text style={ps.small}>Photo unavailable</Text>
                  </View>
                )}
                <Text style={ps.label}>{photo.owner}</Text>
                <Text style={ps.small}>
                  {photo.location_name ?? "Trip photo"}
                </Text>
                <Text style={ps.small}>
                  {new Date(photo.captured_at).toLocaleDateString()}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={ps.divider}>
            <SectionHeading title="Trip details" />
            <BodyText muted>
              {data.plan?.details.description ??
                "A shared journey with your travel group."}
            </BodyText>
            {data.plan && (
              <DestinationMap
                place={data.plan.details.destination}
                height={180}
              />
            )}
          </View>
          <View style={ps.divider}>
            <SectionHeading title="Itinerary" />
            {data.plan
              ? data.plan.details.activities
                  .filter((a) => a.included)
                  .map((a) => (
                    <View key={a.id} style={ps.section}>
                      <Text style={ps.label}>{a.title}</Text>
                      <Text style={ps.small}>
                        {a.place.name} · {a.duration} min
                      </Text>
                      <BodyText muted>{a.description}</BodyText>
                    </View>
                  ))
              : data.quests.map((q) => (
                  <View key={q.id} style={ps.section}>
                    <Text style={ps.label}>{q.title_snapshot}</Text>
                    <Text style={ps.small}>{q.state}</Text>
                    <BodyText muted>
                      {q.flavor_snapshot ?? q.objective_snapshot}
                    </BodyText>
                  </View>
                ))}
          </View>
          <View style={ps.divider}>
            <SectionHeading title="Travelled together" />
            {data.members.map((m) => (
              <View key={m.user_id} style={ps.row}>
                <Text style={ps.label}>{m.display_name}</Text>
                <Text style={ps.small}>
                  {m.user_id === data.journey.created_by
                    ? "Organiser"
                    : "Member"}
                </Text>
              </View>
            ))}
          </View>
          {data.plan && data.journey.status !== "completed" && (
            <PixelButton
              label="Open trip plan"
              variant="ghost"
              onPress={() => router.push({ pathname: "/plan", params: { id } })}
            />
          )}
        </>
      )}
      <Modal
        visible={!!selected}
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: C.void, padding: 20, gap: 16 }}
        >
          <View style={ps.row}>
            <Text style={ps.label}>{selected?.owner}</Text>
            <PixelButton
              label="Close photo"
              size="compact"
              variant="ghost"
              onPress={() => setSelected(null)}
            />
          </View>
          {selected?.url && (
            <Image
              source={{ uri: selected.url }}
              contentFit="contain"
              style={{ flex: 1 }}
            />
          )}
          <Text style={ps.small}>
            {selected?.location_name} ·{" "}
            {selected && new Date(selected.captured_at).toLocaleString()}
          </Text>
        </SafeAreaView>
      </Modal>
    </QuestScreen>
  );
}
export default function HistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <AuthGate>
      {DEMO_PAST_TRIPS.some((t) => t.id === id) ? (
        <DemoHistory id={id} />
      ) : (
        <HistoryContent key={id} />
      )}
    </AuthGate>
  );
}
