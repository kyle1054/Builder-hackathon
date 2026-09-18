import { PropsWithChildren, ReactNode } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SideQuestColors } from '@/constants/theme';

export function QuestScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.skyGlow} />
      <ScrollView
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PixelPanel({
  children,
  style,
  accessibilityLabel,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; accessibilityLabel?: string }>) {
  return (
    <View style={[styles.panelOuter, style]} accessibilityLabel={accessibilityLabel}>
      <View style={styles.panelInner}>{children}</View>
    </View>
  );
}

export function Eyebrow({ children, color = SideQuestColors.gold }: PropsWithChildren<{ color?: string }>) {
  return <Text style={[styles.eyebrow, { color }]}>{children}</Text>;
}

export function Title({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function BodyText({
  children,
  muted = false,
  style,
}: PropsWithChildren<{ muted?: boolean; style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.body, muted && styles.bodyMuted, style]}>{children}</Text>;
}

export function PixelButton({
  label,
  onPress,
  variant = 'gold',
  disabled = false,
  loading = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: 'gold' | 'blue' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        pressed && styles.buttonPressed,
        (disabled || loading) && styles.buttonDisabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? SideQuestColors.white : SideQuestColors.ink} />
      ) : (
        <Text style={[styles.buttonLabel, variant === 'ghost' && styles.buttonLabelGhost]}>{label}</Text>
      )}
    </Pressable>
  );
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
    <View style={styles.statBlock} accessibilityLabel={`${label}: ${value} percent${detail ? `, ${detail}` : ''}`}>
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{detail ?? `${value}%`}</Text>
      </View>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { backgroundColor: color, width: `${Math.max(3, value)}%` }]} />
      </View>
    </View>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SideQuestColors.void,
  },
  skyGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: SideQuestColors.cobaltDark,
    opacity: 0.28,
    top: -140,
    right: -100,
  },
  screenContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 20,
  },
  panelOuter: {
    borderWidth: 4,
    borderColor: SideQuestColors.white,
    backgroundColor: SideQuestColors.ink,
    padding: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.38,
    shadowOffset: { width: 6, height: 7 },
    shadowRadius: 0,
    elevation: 8,
  },
  panelInner: {
    backgroundColor: SideQuestColors.navy,
    borderWidth: 2,
    borderColor: SideQuestColors.ink,
    padding: 16,
    gap: 12,
  },
  eyebrow: {
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: SideQuestColors.white,
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 25,
    lineHeight: 33,
    letterSpacing: -0.6,
  },
  body: {
    color: SideQuestColors.white,
    fontFamily: 'monospace',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMuted: {
    color: SideQuestColors.textMuted,
  },
  button: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderWidth: 3,
    borderColor: SideQuestColors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_gold: { backgroundColor: SideQuestColors.gold },
  button_blue: { backgroundColor: SideQuestColors.cobalt },
  button_danger: { backgroundColor: SideQuestColors.red },
  button_ghost: {
    backgroundColor: 'transparent',
    borderColor: SideQuestColors.white,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  buttonDisabled: {
    opacity: 0.42,
  },
  buttonLabel: {
    color: SideQuestColors.ink,
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  buttonLabelGhost: {
    color: SideQuestColors.white,
  },
  statBlock: { gap: 6 },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  statLabel: {
    color: SideQuestColors.textMuted,
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    color: SideQuestColors.white,
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 12,
  },
  statTrack: {
    height: 12,
    padding: 2,
    backgroundColor: SideQuestColors.ink,
    borderWidth: 1,
    borderColor: SideQuestColors.white,
  },
  statFill: { height: '100%' },
  sectionHeading: {
    minHeight: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: SideQuestColors.white,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '900',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
});
