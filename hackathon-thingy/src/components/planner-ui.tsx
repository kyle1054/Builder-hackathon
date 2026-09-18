import { Text, TextInput, View, StyleSheet, Pressable } from "react-native";
import { SideQuestColors as C } from "@/constants/theme";
import { Image } from "expo-image";
import { create } from "qrcode/lib/core/qrcode";
import { useMemo } from "react";
export const ps = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "#0009",
    justifyContent: "center",
    padding: 16,
  },
  sheet: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "90%",
    alignSelf: "center",
    padding: 20,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BDC9BB",
    gap: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  section: { gap: 16 },
  small: { fontSize: 13, lineHeight: 20, color: C.textMuted },
  label: { fontSize: 14, fontWeight: "600", color: C.text },
  input: {
    borderWidth: 1,
    borderColor: "#BDC9BB",
    borderRadius: 18,
    padding: 14,
    minHeight: 56,
    fontSize: 16,
    color: C.text,
    backgroundColor: "#FFFFFF",
  },
  link: { color: C.goldSoft, fontSize: 14, fontWeight: "600" },
  button: { minHeight: 44, justifyContent: "center" },
  error: { color: C.red, fontSize: 14, lineHeight: 21 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  title: {
    color: C.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  divider: {
    borderTopWidth: 1,
    borderColor: C.border,
    paddingTop: 20,
    gap: 14,
  },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    padding: 13,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#BDC9BB",
    borderRadius: 24,
    justifyContent: "center",
  },
  selected: { borderColor: C.gold, backgroundColor: "#E6EDE3" },
});
export function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={ps.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textDim}
        style={[
          ps.input,
          multiline && { minHeight: 90, textAlignVertical: "top" },
        ]}
        multiline={multiline}
        maxLength={maxLength}
      />
    </View>
  );
}
export function Option({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        ps.option,
        selected && ps.selected,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={selected ? ps.link : ps.small}>
        {label}
        {selected ? " ✓" : ""}
      </Text>
    </Pressable>
  );
}
export function LocalQR({ value }: { value: string }) {
  const source = useMemo(() => {
    const qr = create(value, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    let path = "";
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++)
        if (qr.modules.get(y, x)) path += `M${x + 4} ${y + 4}h1v1h-1z`;
    return {
      uri: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 8} ${n + 8}"><rect width="100%" height="100%" fill="white"/><path d="${path}" fill="#101827"/></svg>`)}`,
    };
  }, [value]);
  return (
    <Image
      source={source}
      style={{ width: 220, height: 220, alignSelf: "center" }}
      accessibilityLabel="Scan this QR code to join the trip"
    />
  );
}
