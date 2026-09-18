import { useState, type PropsWithChildren } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { SideQuestColors as C } from "@/constants/theme";
import { avatarSource } from "@/lib/avatar";

export function Wordmark() {
  return (
    <Text style={a.wordmark}>
      sidequest<Text style={{ color: C.gold }}> /</Text>
    </Text>
  );
}
const PARTY = [
  { seed: "kyle", role: "Pilot" },
  { seed: "sam", role: "Navigator" },
  { seed: "thandi", role: "Scout" },
  { seed: "tebogo", role: "DJ" },
] as const;
export function TravelPanel({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[a.travelPanel, compact && { padding: 22 }]}>
      {!compact && (
        <View style={a.panelHeading}>
          <Text style={a.panelKicker}>MADE FOR THE JOURNEY</Text>
          <Text
            style={[a.panelTitle, compact && { fontSize: 30, lineHeight: 36 }]}
          >
            The best part{"\n"}is the drive.
          </Text>
        </View>
      )}
      <View
        style={[
          a.routeCard,
          compact && { padding: 0, backgroundColor: "transparent" },
        ]}
      >
        <View style={a.routeLine}>
          <View style={a.originDot} />
          <View style={a.routeRule} />
          <View style={a.waypoint}>
            <SymbolView
              name={{ ios: "star.fill", android: "star", web: "star" }}
              tintColor="#8A6A1E"
              size={13}
            />
          </View>
          <View style={a.routeRule} />
          <SymbolView
            name={{ ios: "mappin", android: "location_on", web: "location_on" }}
            tintColor="#31483C"
            size={22}
          />
        </View>
        <View style={a.routeNames}>
          <Text style={a.routeLabel}>Stellenbosch</Text>
          <Text style={[a.routeLabel, { textAlign: "right" }]}>
            Tierfontein Farm
          </Text>
        </View>
        <View style={a.detourChip}>
          <Text style={a.detourText}>+6 min detour · Valley Viewpoint</Text>
        </View>
        <View style={a.travelers}>
          {PARTY.map(({ seed, role }) => (
            <View key={seed} style={a.traveller}>
              <Image
                source={avatarSource(seed)}
                style={{ width: 54, height: 72 }}
                contentFit="contain"
                accessibilityLabel={`${seed}, ${role}`}
              />
              <Text numberOfLines={1} style={a.roleBadge}>
                {role}
              </Text>
            </View>
          ))}
        </View>
        <Text style={a.panelNote}>Active party · 3 quests discovered</Text>
      </View>
      {!compact && (
        <Text style={a.panelFooter}>
          Side quests, shared detours and the photos you keep.
        </Text>
      )}
    </View>
  );
}
export function AuthFrame({
  children,
  onBack,
  backDisabled,
}: PropsWithChildren<{ onBack?: () => void; backDisabled?: boolean }>) {
  const { width } = useWindowDimensions();
  const wide = width >= 980;
  return (
    <KeyboardAvoidingView
      style={a.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[a.scroll, wide && { padding: 40 }]}
        >
          <View style={[a.shell, wide && a.shellWide]}>
            {wide && (
              <View style={a.visual}>
                <Wordmark />
                <TravelPanel />
              </View>
            )}
            <View style={[a.formColumn, wide && { padding: 48 }]}>
              {(!wide || onBack) && (
                <View style={[a.row, { marginBottom: 12 }]}>
                  {!wide && <Wordmark />}
                  {onBack && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Back"
                      disabled={backDisabled}
                      onPress={onBack}
                      style={({ pressed }) => [
                        a.backButton,
                        pressed && { backgroundColor: "#DFE5DC" },
                      ]}
                    >
                      <SymbolView
                        name={{
                          ios: "arrow.left",
                          android: "arrow_back",
                          web: "arrow_back",
                        }}
                        tintColor={C.text}
                        size={20}
                      />
                    </Pressable>
                  )}
                </View>
              )}
              {children}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
export function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  secondary = false,
  raised = false,
  provider,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  raised?: boolean;
  provider?: "google" | "apple";
}) {
  const [focus, setFocus] = useState(false);
  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={({ pressed }) => [
        a.button,
        (secondary || provider) && a.outline,
        raised && a.buttonRaised,
        focus && a.buttonFocus,
        pressed && {
          backgroundColor: secondary || provider ? "#E6EDE3" : "#C6A163",
        },
        raised && { transform: [{ translateY: pressed ? 0 : -4 }] },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary || provider ? C.text : C.ink} />
      ) : (
        <>
          {provider && (
            <Image
              source={
                provider === "google"
                  ? require("../../../assets/brand/google.png")
                  : require("../../../assets/brand/apple.svg")
              }
              style={{ width: 20, height: 20, position: "absolute", left: 24 }}
              contentFit="contain"
            />
          )}
          <Text
            style={[
              a.buttonLabel,
              (secondary || provider) && { color: C.text },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
  return raised ? (
    <View style={a.buttonShadow}>{button}</View>
  ) : (
    button
  );
}
export function PartyCodeEntry({
  onSubmit,
  disabled,
}: {
  onSubmit: (code: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  if (!open)
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[a.textButton, { alignSelf: "center" }]}
      >
        <Text style={a.muted}>
          Riding along? <Text style={a.link}>Enter a party code</Text>
        </Text>
      </Pressable>
    );
  return (
    <View style={a.codeRow}>
      <TextInput
        accessibilityLabel="Party code"
        autoFocus
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        placeholder="PARTY CODE"
        placeholderTextColor="#6C786E"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={40}
        returnKeyType="go"
        onSubmitEditing={() => code.trim() && onSubmit(code.trim())}
        style={[a.input, a.codeInput]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Join with party code"
        disabled={disabled || !code.trim()}
        onPress={() => onSubmit(code.trim())}
        style={({ pressed }) => [
          a.codeGo,
          pressed && { backgroundColor: "#C6A163" },
          (disabled || !code.trim()) && { opacity: 0.45 },
        ]}
      >
        <Text style={a.buttonLabel}>Join</Text>
      </Pressable>
    </View>
  );
}
export function AuthField({
  label,
  value,
  onChange,
  placeholder,
  secure = false,
  kind = "text",
  error,
  onSubmit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  kind?: "text" | "email" | "password" | "new-password";
  error?: string;
  onSubmit?: () => void;
}) {
  const [hidden, setHidden] = useState(secure);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={a.label}>{label}</Text>
      <View
        style={[
          a.field,
          focused && { borderColor: C.gold },
          !!error && { borderColor: C.red },
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error}
          aria-invalid={!!error}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#6C786E"
          secureTextEntry={secure && hidden}
          autoCapitalize={kind === "text" ? "words" : "none"}
          autoCorrect={false}
          keyboardType={kind === "email" ? "email-address" : "default"}
          autoComplete={kind === "text" ? "name" : kind}
          textContentType={
            kind === "email"
              ? "emailAddress"
              : kind === "password"
                ? "password"
                : kind === "new-password"
                  ? "newPassword"
                  : "name"
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmit}
          returnKeyType={onSubmit ? "go" : "next"}
          style={a.input}
        />
        {secure && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            onPress={() => setHidden(!hidden)}
            style={a.eye}
          >
            <SymbolView
              name={{
                ios: hidden ? "eye" : "eye.slash",
                android: hidden ? "visibility" : "visibility_off",
                web: hidden ? "visibility" : "visibility_off",
              }}
              tintColor={C.textMuted}
              size={19}
            />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={a.error}>{error}</Text>}
    </View>
  );
}
export function AuthDivider() {
  return (
    <View style={a.divider}>
      <View style={a.line} />
      <Text style={a.muted}>or continue with</Text>
      <View style={a.line} />
    </View>
  );
}
export const a = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F7F2" },
  scroll: { flexGrow: 1, padding: 24 },
  shell: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    flexGrow: 1,
    justifyContent: "center",
  },
  shellWide: {
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "#DFE5DC",
    borderRadius: 32,
    overflow: "hidden",
    flexGrow: 0,
    minHeight: 740,
    marginVertical: "auto",
  },
  visual: { flex: 1, backgroundColor: "#EDF1E9", padding: 32, gap: 40 },
  formColumn: { width: "100%", maxWidth: 460, alignSelf: "center", gap: 22 },
  wordmark: {
    color: C.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  title: {
    color: C.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -1,
  },
  body: { color: C.textMuted, fontSize: 15, lineHeight: 23 },
  muted: { color: C.textMuted, fontSize: 12, lineHeight: 18 },
  label: { color: "#20392F", fontSize: 13, fontWeight: "600" },
  field: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "#BDC9BB",
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 20,
    paddingVertical: 13,
    fontSize: 16,
    color: C.text,
  },
  eye: {
    width: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    minHeight: 54,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 44,
    paddingVertical: 13,
  },
  outline: { backgroundColor: "transparent", borderColor: "#BDC9BB" },
  buttonRaised: { borderColor: "#20392F", borderWidth: 2 },
  buttonShadow: {
    marginTop: 4,
    borderRadius: 28,
    backgroundColor: "#20392F",
  },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  codeInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#BDC9BB",
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    letterSpacing: 2,
    fontSize: 15,
  },
  codeGo: {
    minHeight: 50,
    paddingHorizontal: 22,
    borderRadius: 26,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    color: C.ink,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonFocus: {
    outlineWidth: 2,
    outlineColor: "#D8B477",
    outlineOffset: 3,
    outlineStyle: "solid",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 2,
  },
  line: { flex: 1, height: 1, backgroundColor: "#DFE5DC" },
  error: { color: "#B83E4B", fontSize: 13, lineHeight: 19 },
  success: { color: "#287650", fontSize: 13, lineHeight: 20 },
  link: { color: C.goldSoft, fontSize: 13, fontWeight: "600" },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E6EDE3",
    alignItems: "center",
    justifyContent: "center",
  },
  textButton: { minHeight: 44, justifyContent: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  travelPanel: {
    backgroundColor: "#D4DDC8",
    borderRadius: 14,
    padding: 28,
    gap: 32,
    flexGrow: 1,
    justifyContent: "space-between",
  },
  panelHeading: { gap: 18 },
  panelKicker: {
    fontSize: 10,
    color: "#425747",
    fontWeight: "700",
    letterSpacing: 1.7,
  },
  panelTitle: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "700",
    letterSpacing: -1.5,
    color: "#20372C",
  },
  routeCard: {
    gap: 12,
    backgroundColor: "#E8ECDE",
    padding: 20,
    borderRadius: 12,
  },
  routeLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  originDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#31483C",
  },
  routeRule: { flex: 1, height: 1, backgroundColor: "#9FAE94" },
  waypoint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.gold,
    borderWidth: 2,
    borderColor: "#E8ECDE",
    alignItems: "center",
    justifyContent: "center",
  },
  routeNames: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  routeLabel: { fontSize: 11, color: "#354D3E", flex: 1, fontWeight: "600" },
  detourChip: {
    alignSelf: "center",
    backgroundColor: "#F3E7CC",
    borderWidth: 1,
    borderColor: "#D8B477",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  detourText: { fontSize: 11, fontWeight: "600", color: "#6B4E12" },
  travelers: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
  },
  traveller: { alignItems: "center", gap: 4 },
  roleBadge: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#3B5343",
    textTransform: "uppercase",
  },
  panelNote: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#455E4D",
    textTransform: "uppercase",
  },
  panelFooter: { fontSize: 13, color: "#425747", lineHeight: 20 },
});
