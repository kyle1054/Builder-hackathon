import { PropsWithChildren, ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SideQuestColors } from "@/constants/theme";

export function QuestScreen({ children }: PropsWithChildren) {
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.screenContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function Surface({
  children,
  style,
  accessibilityLabel,
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}>) {
  return (
    <View
      style={[styles.surface, style]}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
}

export const PixelPanel = Surface;

export function Eyebrow({
  children,
  color = SideQuestColors.goldSoft,
}: PropsWithChildren<{ color?: string }>) {
  return <Text style={[styles.eyebrow, { color }]}>{children}</Text>;
}

export function Title({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function BodyText({
  children,
  muted = false,
  style,
}: PropsWithChildren<{ muted?: boolean; style?: StyleProp<TextStyle> }>) {
  return (
    <Text style={[styles.body, muted && styles.bodyMuted, style]}>
      {children}
    </Text>
  );
}

export function PixelButton({
  label,
  onPress,
  variant = "gold",
  disabled = false,
  loading = false,
  accessibilityHint,
  size = "default",
  raised = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "gold" | "blue" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  size?: "default" | "compact";
  /** Reserve the tactile treatment for a screen’s main action. */
  raised?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const content = loading ? (
    <ActivityIndicator
      color={variant === "ghost" ? SideQuestColors.text : SideQuestColors.ink}
    />
  ) : (
    <Text
      style={[
        styles.buttonLabel,
        variant !== "gold" && styles.buttonLabelGhost,
      ]}
    >
      {label}
    </Text>
  );

  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        size === "compact" && styles.buttonCompact,
        raised && styles.buttonRaised,
        focused && styles.buttonFocus,
        pressed && !raised && styles.buttonPressed,
        raised && { transform: [{ translateY: pressed || disabled || loading ? 0 : -4 }] },
        !raised && (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      {content}
    </Pressable>
  );
  return raised ? (
    <View style={[styles.buttonBase, (disabled || loading) && styles.buttonDisabled]}>
      {button}
    </View>
  ) : button;
}

export function StatBar({
  label,
  value,
  color,
  detail,
}: {
  label: string;
  value: number;
  color: string;
  detail?: string;
}) {
  return (
    <View
      style={styles.statBlock}
      accessibilityLabel={`${label}: ${value} percent${detail ? `, ${detail}` : ""}`}
    >
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{detail ?? `${value}%`}</Text>
      </View>
      <View style={styles.statTrack}>
        <View
          style={[
            styles.statFill,
            { backgroundColor: color, width: `${Math.max(3, value)}%` },
          ]}
        />
      </View>
    </View>
  );
}

export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function Ornament() {
  return (
    <View style={styles.ornament} accessibilityElementsHidden>
      <View style={styles.ornamentLine} />
      <View style={styles.ornamentDiamond} />
      <View style={styles.ornamentLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SideQuestColors.void,
    overflow: "hidden",
  },
  safeArea: { flex: 1 },
  ambientGold: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "#6A4E28",
    opacity: 0.12,
    top: -220,
    right: -120,
  },
  ambientBlue: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#294B67",
    opacity: 0.1,
    bottom: 40,
    left: -200,
  },
  screenContent: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 28,
  },
  surface: {
    backgroundColor: SideQuestColors.surface,
    borderWidth: 1,
    borderColor: SideQuestColors.border,
    borderRadius: 18,
    padding: 22,
    gap: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 1,
  },
  eyebrow: {
    fontFamily: "system-ui",
    fontWeight: "700",
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    color: SideQuestColors.text,
    fontFamily: "system-ui",
    fontWeight: "700",
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1.2,
  },
  body: {
    color: SideQuestColors.text,
    fontFamily: "system-ui",
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMuted: { color: SideQuestColors.textMuted },
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonGradient: {
    width: "100%",
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonBase: {
    backgroundColor: SideQuestColors.ink,
    borderRadius: 999,
    marginTop: 4,
  },
  buttonRaised: {
    borderWidth: 2,
    borderColor: SideQuestColors.ink,
    borderRadius: 999,
  },
  button_gold: { backgroundColor: SideQuestColors.gold },
  button_blue: {
    backgroundColor: "#E3EDF2",
    borderWidth: 1,
    borderColor: "#547A96",
  },
  button_danger: {
    backgroundColor: "#FBE6E7",
    borderWidth: 1,
    borderColor: SideQuestColors.red,
  },
  button_ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: SideQuestColors.border,
  },
  buttonCompact: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
  },
  buttonFocus: {
    outlineColor: SideQuestColors.goldSoft,
    outlineWidth: 2,
    outlineOffset: 3,
    outlineStyle: "solid",
  },
  buttonPressed: { opacity: 0.78 },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: {
    color: SideQuestColors.ink,
    fontFamily: "system-ui",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0,
    textAlign: "center",
  },
  buttonLabelGhost: { color: SideQuestColors.text },
  statBlock: { gap: 8 },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
  },
  statLabel: {
    color: SideQuestColors.textMuted,
    fontFamily: "system-ui",
    fontWeight: "600",
    fontSize: 12,
  },
  statValue: {
    color: SideQuestColors.text,
    fontFamily: "system-ui",
    fontWeight: "700",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  statTrack: {
    height: 6,
    overflow: "hidden",
    backgroundColor: SideQuestColors.surfaceSoft,
    borderRadius: 3,
  },
  statFill: { height: "100%", borderRadius: 3 },
  sectionHeading: {
    minHeight: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    color: SideQuestColors.text,
    fontFamily: "system-ui",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  ornament: { flexDirection: "row", alignItems: "center", gap: 8, width: 88 },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: SideQuestColors.gold,
    opacity: 0.55,
  },
  ornamentDiamond: {
    width: 6,
    height: 6,
    transform: [{ rotate: "45deg" }],
    borderWidth: 1,
    borderColor: SideQuestColors.gold,
  },
});
