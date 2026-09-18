import { useState } from "react";
import { Text, View, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { SideQuestColors as C } from "@/constants/theme";
import { ps } from "./planner-ui";
export function TripPhoto({
  uri,
  label,
  style,
}: {
  uri: string | null;
  label: string;
  style: StyleProp<ViewStyle>;
}) {
  const [unavailable, setUnavailable] = useState(false);
  return (
    <View
      style={[
        { overflow: "hidden", borderRadius: 12, backgroundColor: C.surface },
        style,
      ]}
    >
      <View
        style={{
          position: "absolute",
          inset: 0,
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          padding: 12,
        }}
      >
        <SymbolView
          name={{ ios: "photo", android: "image", web: "image" }}
          tintColor={C.textMuted}
          size={28}
        />
        <Text style={[ps.small, { textAlign: "center" }]}>
          {uri ? "Photo unavailable" : "No photos yet · open to add one"}
        </Text>
      </View>
      {uri && !unavailable && (
        <Image
          source={{ uri }}
          accessibilityLabel={label}
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
          onError={() => setUnavailable(true)}
          onLoad={(e) => {
            if (e.source.width < 8 || e.source.height < 8) setUnavailable(true);
          }}
        />
      )}
    </View>
  );
}
