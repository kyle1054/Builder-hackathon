import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ornament } from '@/components/sidequest-ui';
import { SideQuestColors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { sendPasswordReset, signInWithPassword, signUpWithPassword } from '@/services/auth';

type Mode = 'welcome' | 'sign-in' | 'sign-up' | 'reset';

const DEMO_PASSWORD = 'SideQuest-Demo-2026!';

function CompassMark() {
  return (
    <View style={styles.compass} accessibilityLabel="SideQuest compass mark">
      <View style={styles.compassDiamond} />
      <View style={styles.compassCenter} />
    </View>
  );
}

function ScenicBackdrop() {
  return (
    <View style={styles.scenic} accessibilityElementsHidden>
      <LinearGradient colors={['#24394A', '#17212D', '#0B0F16']} style={StyleSheet.absoluteFill} />
      <View style={styles.sun} />
      <View style={styles.mistOne} />
      <View style={styles.mistTwo} />
      <View style={styles.mountainFar} />
      <View style={styles.mountainNear} />
      <View style={styles.road} />
      <LinearGradient colors={['transparent', 'rgba(8,11,18,0.95)']} style={StyleSheet.absoluteFill} />
    </View>
  );
}

function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoComplete,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoComplete?: 'email' | 'password' | 'name' | 'new-password';
}) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={SideQuestColors.textDim}
          secureTextEntry={secureTextEntry && hidden}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          autoCorrect={false}
          autoComplete={autoComplete}
          accessibilityLabel={label}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((current) => !current)}
            hitSlop={8}
            style={({ pressed }) => [styles.visibilityButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: hidden ? 'eye' : 'eye.slash', android: hidden ? 'visibility' : 'visibility_off', web: hidden ? 'visibility' : 'visibility_off' }}
              tintColor={SideQuestColors.textMuted}
              size={20}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function PrimaryButton({ label, onPress, loading = false }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]}>
      <LinearGradient colors={['#E7C58C', '#C89B5D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryGradient}>
        {loading ? <ActivityIndicator color={SideQuestColors.ink} /> : <Text style={styles.primaryLabel}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

export default function WelcomeScreen() {
  const { session, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<Mode>('welcome');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={SideQuestColors.gold} />
      </View>
    );
  }

  if (session) return <Redirect href="/journey" />;

  const run = async (action: () => Promise<void>) => {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const signIn = (nextEmail = email, nextPassword = password) =>
    run(async () => {
      await signInWithPassword(nextEmail, nextPassword);
      router.replace('/journey');
    });

  const signUp = () =>
    run(async () => {
      if (displayName.trim().length < 2) throw new Error('Choose a traveler name with at least 2 characters.');
      if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
      const result = await signUpWithPassword(email, password, displayName);
      if (result.session) router.replace('/journey');
      else setMessage('Check your email to confirm your account, then return to sign in.');
    });

  const resetPassword = () =>
    run(async () => {
      if (!email.includes('@')) throw new Error('Enter the email attached to your account.');
      await sendPasswordReset(email);
      setMessage('Password reset instructions are on their way.');
    });

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScenicBackdrop />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <CompassMark />
            <Text style={styles.brandName}>SideQuest</Text>
          </View>

          {mode === 'welcome' ? (
            <View style={styles.welcomeLayout}>
              <View style={styles.heroCopy}>
                <Ornament />
                <Text style={styles.heroTitle}>Make the road part of the story.</Text>
                <Text style={styles.heroBody}>
                  A journey-first companion for shared quests, quiet discoveries, and the memories between destinations.
                </Text>
                <View style={styles.featureRow}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>Private trips</Text>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>Live party play</Text>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>Shared Chronicle</Text>
                </View>
              </View>
              <View style={styles.welcomeActions}>
                <PrimaryButton label="Begin your journey" onPress={() => setMode('sign-up')} />
                <Pressable accessibilityRole="button" onPress={() => setMode('sign-in')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                  <Text style={styles.secondaryLabel}>I already have an account</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.authCard}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back to welcome" onPress={() => { setMode('welcome'); setError(null); setMessage(null); }} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={SideQuestColors.white} size={20} />
                <Text style={styles.backLabel}>Back</Text>
              </Pressable>

              <View style={styles.authHeading}>
                <Text style={styles.authEyebrow}>{mode === 'sign-up' ? 'Create your traveler' : mode === 'reset' ? 'Recover your account' : 'Welcome back'}</Text>
                <Text style={styles.authTitle}>{mode === 'sign-up' ? 'Your next chapter starts here.' : mode === 'reset' ? 'Find your way back.' : 'Continue the journey.'}</Text>
              </View>

              {mode === 'sign-up' && (
                <AuthField label="Traveler name" value={displayName} onChangeText={setDisplayName} placeholder="How your party sees you" autoComplete="name" />
              )}
              <AuthField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoComplete="email" />
              {mode !== 'reset' && (
                <AuthField label="Password" value={password} onChangeText={setPassword} placeholder={mode === 'sign-up' ? 'At least 8 characters' : 'Your password'} secureTextEntry autoComplete={mode === 'sign-up' ? 'new-password' : 'password'} />
              )}

              {error && <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text>}
              {message && <Text style={styles.successText} accessibilityLiveRegion="polite">{message}</Text>}

              <PrimaryButton
                label={mode === 'sign-up' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
                loading={submitting}
                onPress={mode === 'sign-up' ? signUp : mode === 'reset' ? resetPassword : () => signIn()}
              />

              {mode === 'sign-in' && (
                <Pressable accessibilityRole="button" onPress={() => setMode('reset')} style={styles.textButton}>
                  <Text style={styles.textButtonLabel}>Forgot password?</Text>
                </Pressable>
              )}

              {mode !== 'reset' && (
                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>{mode === 'sign-up' ? 'Already registered?' : 'New to SideQuest?'}</Text>
                  <Pressable accessibilityRole="button" onPress={() => setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')} hitSlop={8}>
                    <Text style={styles.switchAction}>{mode === 'sign-up' ? 'Sign in' : 'Create account'}</Text>
                  </Pressable>
                </View>
              )}

              {mode === 'sign-in' && (
                <View style={styles.demoArea}>
                  <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>Hackathon demo</Text><View style={styles.divider} /></View>
                  <View style={styles.demoButtons}>
                    <Pressable accessibilityRole="button" onPress={() => signIn('pilot.demo@sidequest.invalid', DEMO_PASSWORD)} style={({ pressed }) => [styles.demoButton, pressed && styles.pressed]}>
                      <Text style={styles.demoButtonTitle}>Enter as Pilot</Text>
                      <Text style={styles.demoButtonSub}>Existing demo trip</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => signIn('navigator.demo@sidequest.invalid', DEMO_PASSWORD)} style={({ pressed }) => [styles.demoButton, pressed && styles.pressed]}>
                      <Text style={styles.demoButtonTitle}>Enter as Navigator</Text>
                      <Text style={styles.demoButtonSub}>Existing demo trip</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: SideQuestColors.void },
  loadingScreen: { flex: 1, backgroundColor: SideQuestColors.void, alignItems: 'center', justifyContent: 'center' },
  scenic: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  sun: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#D8B477', opacity: 0.26, top: 70, right: -22 },
  mistOne: { position: 'absolute', height: 32, width: 260, borderRadius: 16, backgroundColor: '#B7C6CC', opacity: 0.08, top: 150, right: 10 },
  mistTwo: { position: 'absolute', height: 24, width: 220, borderRadius: 12, backgroundColor: '#D9E2DE', opacity: 0.06, top: 208, left: -40 },
  mountainFar: { position: 'absolute', width: 330, height: 260, backgroundColor: '#1D2B36', transform: [{ rotate: '42deg' }], top: 170, right: -150 },
  mountainNear: { position: 'absolute', width: 430, height: 320, backgroundColor: '#101922', transform: [{ rotate: '34deg' }], top: 260, left: -230 },
  road: { position: 'absolute', width: 85, height: 440, backgroundColor: '#161C23', transform: [{ rotate: '18deg' }], top: 280, left: '49%' },
  safeArea: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  compass: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  compassDiamond: { width: 26, height: 26, transform: [{ rotate: '45deg' }], borderWidth: 1, borderColor: SideQuestColors.gold },
  compassCenter: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: SideQuestColors.goldSoft },
  brandName: { color: SideQuestColors.white, fontFamily: 'Georgia', fontSize: 21, fontWeight: '600', letterSpacing: 0.2 },
  welcomeLayout: { flex: 1, justifyContent: 'flex-end', paddingTop: 110, paddingBottom: 22, gap: 42 },
  heroCopy: { gap: 16, maxWidth: 590 },
  heroTitle: { color: SideQuestColors.white, fontFamily: 'Georgia', fontSize: 45, lineHeight: 52, fontWeight: '600', letterSpacing: -1.2 },
  heroBody: { color: '#C7CDD5', fontFamily: 'system-ui', fontSize: 17, lineHeight: 27, maxWidth: 560 },
  featureRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9 },
  featureDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: SideQuestColors.gold },
  featureText: { color: SideQuestColors.textMuted, fontFamily: 'system-ui', fontSize: 12, fontWeight: '600' },
  welcomeActions: { gap: 12 },
  primaryButton: { minHeight: 54, borderRadius: 16, overflow: 'hidden' },
  primaryGradient: { minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryLabel: { color: SideQuestColors.ink, fontFamily: 'system-ui', fontSize: 15, fontWeight: '700' },
  secondaryButton: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: SideQuestColors.borderStrong, backgroundColor: 'rgba(12,16,24,0.62)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  secondaryLabel: { color: SideQuestColors.white, fontFamily: 'system-ui', fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
  authCard: { marginTop: 48, marginBottom: 30, backgroundColor: 'rgba(13,18,27,0.94)', borderWidth: 1, borderColor: SideQuestColors.border, borderRadius: 24, padding: 22, gap: 18, shadowColor: '#000', shadowOpacity: 0.28, shadowOffset: { width: 0, height: 18 }, shadowRadius: 35 },
  backButton: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 12 },
  backLabel: { color: SideQuestColors.textMuted, fontFamily: 'system-ui', fontSize: 13, fontWeight: '600' },
  authHeading: { gap: 8, marginBottom: 4 },
  authEyebrow: { color: SideQuestColors.gold, fontFamily: 'system-ui', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  authTitle: { color: SideQuestColors.white, fontFamily: 'Georgia', fontSize: 29, lineHeight: 36, fontWeight: '600' },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: SideQuestColors.textMuted, fontFamily: 'system-ui', fontSize: 13, fontWeight: '600' },
  inputShell: { minHeight: 54, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: SideQuestColors.borderStrong, backgroundColor: '#0C111A' },
  input: { flex: 1, minHeight: 52, paddingHorizontal: 15, color: SideQuestColors.white, fontFamily: 'system-ui', fontSize: 16 },
  visibilityButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#F0A1A8', backgroundColor: 'rgba(216,110,120,0.12)', borderRadius: 10, padding: 11, fontFamily: 'system-ui', fontSize: 13, lineHeight: 19 },
  successText: { color: '#A9DFBF', backgroundColor: 'rgba(117,198,157,0.12)', borderRadius: 10, padding: 11, fontFamily: 'system-ui', fontSize: 13, lineHeight: 19 },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textButtonLabel: { color: SideQuestColors.goldSoft, fontFamily: 'system-ui', fontSize: 13, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  switchText: { color: SideQuestColors.textMuted, fontFamily: 'system-ui', fontSize: 13 },
  switchAction: { color: SideQuestColors.goldSoft, fontFamily: 'system-ui', fontSize: 13, fontWeight: '700' },
  demoArea: { gap: 12, marginTop: 3 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { flex: 1, height: 1, backgroundColor: SideQuestColors.border },
  dividerText: { color: SideQuestColors.textDim, fontFamily: 'system-ui', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  demoButtons: { flexDirection: 'row', gap: 10 },
  demoButton: { flex: 1, minHeight: 68, borderRadius: 13, borderWidth: 1, borderColor: SideQuestColors.border, backgroundColor: SideQuestColors.surface, padding: 12, justifyContent: 'center' },
  demoButtonTitle: { color: SideQuestColors.white, fontFamily: 'system-ui', fontSize: 12, fontWeight: '700' },
  demoButtonSub: { color: SideQuestColors.textDim, fontFamily: 'system-ui', fontSize: 10, marginTop: 3 },
});
