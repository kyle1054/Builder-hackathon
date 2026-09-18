import { useState } from "react";
import { Linking, Modal, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { DEMO_PAST_TRIPS } from "@/constants/demo-trips";
import { SideQuestColors as C } from "@/constants/theme";
import { ps } from "./planner-ui";
import {
  BodyText,
  PixelButton,
  QuestScreen,
  SectionHeading,
} from "./sidequest-ui";
import { DestinationMap } from "./destination-map";
import { TravelerAvatar } from "./traveler-avatar";
export function DemoPastTrips() {
  return (
    <View style={{ gap: 18 }}>
      <View style={ps.row}>
        <Text style={[ps.label, { fontSize: 20 }]}>Past adventures</Text>
        <Text style={ps.small}>Demo history</Text>
      </View>
      {DEMO_PAST_TRIPS.map((t) => (
        <Pressable
          key={t.id}
          accessibilityRole="button"
          accessibilityLabel={`Open ${t.name}`}
          onPress={() =>
            router.push({ pathname: "/history", params: { id: t.id } })
          }
          style={({ pressed }) => ({
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Image
            source={t.memories[0].image}
            contentFit="cover"
            accessibilityLabel={`Sample memory from ${t.name}`}
            style={{ width: "100%", height: 180 }}
          />
          <View style={{ padding: 18, gap: 8 }}>
            <Text style={[ps.label, { fontSize: 20 }]}>{t.name} ↗</Text>
            <Text style={ps.small}>
              {t.date} · 4 travellers · {t.memories.length} memories
            </Text>
            <Text style={ps.small}>Photo: {t.memories[0].photoCredit}</Text>
            <Text style={ps.small}>
              {t.origin.name} → {t.destination.name}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
export function DemoHistory({ id }: { id: string }) {
  const trip = DEMO_PAST_TRIPS.find((t) => t.id === id)!;
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <QuestScreen>
      <Pressable
        accessibilityRole="button"
        style={ps.button}
        onPress={() => router.back()}
      >
        <Text style={ps.link}>← Back to trips</Text>
      </Pressable>
      <View style={{ gap: 10 }}>
        <Text style={ps.title}>{trip.name}</Text>
        <Text style={ps.small}>{trip.date} · Completed</Text>
        <Text style={ps.small}>
          Demo history · fictional travellers · real venue photos
        </Text>
      </View>
      <BodyText muted>{trip.description}</BodyText>
      <DestinationMap
        place={trip.destination}
        origin={trip.origin}
        stops={trip.activities.map((a) => a.place)}
      />
      <SectionHeading title="Memories together" />
      {trip.memories.map((m, i) => (
        <Pressable
          key={m.title}
          accessibilityRole="button"
          accessibilityLabel={`Open memory: ${m.title}`}
          onPress={() => setSelected(i)}
          style={{ gap: 12 }}
        >
          <Image
            source={m.image}
            contentFit="cover"
            style={{ width: "100%", height: 230, borderRadius: 22 }}
          />
          <View style={ps.row}>
            <TravelerAvatar name={m.person} seed={m.seed} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={ps.label}>{m.title}</Text>
              <Text style={ps.small}>
                {m.person} · {m.caption}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
      <SectionHeading title="Photo sources" />
      {Array.from(new Set(trip.memories.map(m => m.photoSource))).map(url => <Pressable key={url} accessibilityRole="link" style={ps.button} onPress={() => void Linking.openURL(url)}><Text style={ps.link}>{trip.memories.find(m => m.photoSource === url)?.photoCredit} ↗</Text></Pressable>)}
      <SectionHeading title="Where we stopped" />
      {trip.activities.map((a, i) => (
        <View key={a.id} style={ps.divider}>
          <Text style={ps.label}>
            {i + 1}. {a.title}
          </Text>
          <Text style={ps.small}>
            {a.place.name} · {a.duration} min
          </Text>
          <BodyText muted>{a.description}</BodyText>
        </View>
      ))}
      <SectionHeading title="Travelled together" />
      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        {["Kyle", "Sam", "Thandi", "Tebogo"].map((name) => (
          <View key={name} style={{ alignItems: "center", gap: 8 }}>
            <TravelerAvatar name={name} seed={name.toLowerCase()} />
            <Text style={ps.small}>{name}</Text>
          </View>
        ))}
      </View>
      <PixelButton
        label="Plan your next trip"
        onPress={() => router.push("/plan")}
      />
      <Modal
        visible={selected !== null}
        onRequestClose={() => setSelected(null)}
        animationType="fade"
      >
        <SafeAreaProvider>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: C.void, padding: 20, gap: 16 }}
        >
          <PixelButton
            label="Close memory"
            variant="ghost"
            onPress={() => setSelected(null)}
          />
          {selected !== null && (
            <>
              <Image
                source={trip.memories[selected].image}
                contentFit="contain"
                style={{ flex: 1 }}
              />
              <Text style={ps.label}>{trip.memories[selected].title}</Text>
              <Text style={ps.small}>
                {trip.memories[selected].caption} · Venue photo
              </Text>
            </>
          )}
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </QuestScreen>
  );
}
