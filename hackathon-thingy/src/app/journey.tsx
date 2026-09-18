import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { PlannedTrips } from "@/components/planned-trips";
import { DemoPastTrips } from "@/components/demo-past-trips";
import { AuthGate } from "@/components/auth-gate";
import { QuestScreen } from "@/components/sidequest-ui";
import { SideQuestColors as C } from "@/constants/theme";
import { avatarSource } from "@/lib/avatar";
import { useAuth } from "@/context/auth";
function JourneyContent() {
  const { profile } = useAuth();
  return (
    <QuestScreen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: C.text,
            fontSize: 25,
            fontWeight: "800",
            letterSpacing: -1.1,
          }}
        >
          sidequest<Text style={{ color: C.gold }}> /</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
          onPress={() => router.push("/profile")}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Image
            source={avatarSource(profile?.avatar_seed)}
            contentFit="contain"
            style={{ width: 40, height: 46 }}
          />
        </Pressable>
      </View>
      <PlannedTrips />
      <DemoPastTrips />
    </QuestScreen>
  );
}
export default function JourneyScreen() {
  return (
    <AuthGate>
      <JourneyContent />
    </AuthGate>
  );
}
