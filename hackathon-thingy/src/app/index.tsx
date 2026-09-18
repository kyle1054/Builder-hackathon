import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  AuthButton,
  AuthDivider,
  AuthField,
  AuthFrame,
  PartyCodeEntry,
  TravelPanel,
  a,
} from "@/components/auth/auth-ui";
import { SideQuestColors as C } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import {
  sendPasswordReset,
  signInWithPassword,
  signUpWithPassword,
} from "@/services/auth";
import { rememberAuthInvite } from "@/services/auth-redirect";

type Mode = "welcome" | "sign-in" | "sign-up" | "reset";
const DEMO_PASSWORD = "SideQuest-Demo-2026!";
export default function WelcomeScreen() {
  const { session, loading } = useAuth();
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const { width } = useWindowDimensions();
  const [partyCode, setPartyCode] = useState("");
  const pendingCode = invite && invite !== "enter" ? invite : partyCode;
  const nextRoute =
    invite || partyCode
      ? { pathname: "/join" as const, params: { code: pendingCode } }
      : ("/journey" as const);
  const [mode, setMode] = useState<Mode>(invite ? "sign-in" : "welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  if (loading)
    return (
      <View
        style={[a.page, { alignItems: "center", justifyContent: "center" }]}
      >
        <ActivityIndicator color={C.gold} />
      </View>
    );
  if (session) return <Redirect href={nextRoute} />;
  const switchMode = (m: Mode) => {
    setMode(m);
    if (m === "welcome") setPartyCode("");
    setError("");
    setMessage("");
    setFields({});
    setPassword("");
  };
  const run = async (key: string, action: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to continue. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  };
  const submit = () => {
    const errors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.email = "Enter a valid email address.";
    if (
      mode === "sign-up" &&
      (name.trim().length < 2 || name.trim().length > 40)
    )
      errors.name = "Use 2–40 characters for your name.";
    if (mode !== "reset" && !password) errors.password = "Enter your password.";
    else if (mode === "sign-up" && password.length < 8)
      errors.password = "Use at least 8 characters.";
    setFields(errors);
    if (Object.keys(errors).length) return;
    void run("email", async () => {
      await rememberAuthInvite(invite ?? (partyCode ? partyCode : undefined));
      if (mode === "reset") {
        await sendPasswordReset(email);
        setMessage("Check your email for a password reset link.");
      } else if (mode === "sign-up") {
        const result = await signUpWithPassword(email, password, name);
        if (result.session) router.replace(nextRoute);
        else
          setMessage(
            "Check your email to confirm your account, then come back to sign in.",
          );
      } else {
        await signInWithPassword(email, password);
        router.replace(nextRoute);
      }
    });
  };
  const social = (provider: "google" | "apple") =>
    void run(provider, async () => {
      await signInWithPassword(
        provider === "google"
          ? "pilot.demo@sidequest.invalid"
          : "navigator.demo@sidequest.invalid",
        DEMO_PASSWORD,
      );
      router.replace(nextRoute);
    });

  return (
    <AuthFrame key={mode}
      onBack={mode === "welcome" ? undefined : () => switchMode(mode === "reset" ? "sign-in" : "welcome")}
      backDisabled={!!busy}
    >
      {mode === "welcome" ? (
        <>
          {width < 980 && <TravelPanel compact />}
          <View style={{ gap: 10 }}>
            <Text style={a.title}>Turn the drive{"\n"}into the adventure.</Text>
            <Text style={a.body}>
              Discover roadside side quests, collect memories with your crew and
              level up before you even arrive.
            </Text>
          </View>
          <View style={{ gap: 12 }}>
            <AuthButton
              label="Start a quest"
              raised
              onPress={() => switchMode("sign-up")}
            />
            <AuthButton
              label="Sign in"
              secondary
              onPress={() => switchMode("sign-in")}
            />
            <PartyCodeEntry
              onSubmit={(code) => {
                setPartyCode(code);
                switchMode("sign-in");
              }}
            />
          </View>
          <Text style={[a.muted, { textAlign: "center" }]}>
            Your routes, quests and photos stay with your party.
          </Text>
        </>
      ) : (
        <>
          <View style={{ gap: 8 }}>
            <Text style={a.title}>
              {mode === "sign-in"
                ? "Welcome back."
                : mode === "sign-up"
                  ? "Start with your people."
                  : "Reset your password."}
            </Text>
            <Text style={a.body}>
              {invite || partyCode
                ? "Sign in or create an account to join your party."
                : mode === "sign-in"
                  ? "Your trips are right where you left them."
                  : mode === "sign-up"
                    ? "Create an account to plan your first trip."
                    : "We’ll email you a link to choose a new password."}
            </Text>
          </View>
          <View style={{ gap: 18 }}>
            {mode === "sign-up" && (
              <AuthField
                label="Your name"
                placeholder="Alex Morgan"
                value={name}
                onChange={setName}
                error={fields.name}
              />
            )}
            <AuthField
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              kind="email"
              error={fields.email}
              onSubmit={mode === "reset" ? submit : undefined}
            />
            {mode !== "reset" && (
              <>
                <AuthField
                  label="Password"
                  placeholder={
                    mode === "sign-up"
                      ? "At least 8 characters"
                      : "Enter your password"
                  }
                  value={password}
                  onChange={setPassword}
                  kind={mode === "sign-up" ? "new-password" : "password"}
                  secure
                  error={fields.password}
                  onSubmit={submit}
                />
                {mode === "sign-in" && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={!!busy}
                    onPress={() => switchMode("reset")}
                    style={[
                      a.textButton,
                      { alignSelf: "flex-end", marginTop: -14 },
                    ]}
                  >
                    <Text style={a.link}>Forgot password?</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
          {!!error && (
            <Text accessibilityRole="alert" style={a.error}>
              {error}
            </Text>
          )}
          {!!message && (
            <Text accessibilityLiveRegion="polite" style={a.success}>
              {message}
            </Text>
          )}
          <AuthButton
            label={
              mode === "reset"
                ? "Send reset link"
                : mode === "sign-up"
                  ? "Create account"
                  : "Sign in with email"
            }
            disabled={!!busy}
            loading={busy === "email"}
            onPress={submit}
          />
          {mode !== "reset" && (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", columnGap: 5, marginTop: -12 }}>
                <Text style={a.muted}>{mode === "sign-in" ? "New to SideQuest?" : "Already have an account?"}</Text>
                <Pressable accessibilityRole="button" disabled={!!busy}
                  onPress={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
                  style={a.textButton}>
                  <Text style={a.link}>{mode === "sign-in" ? "Create account" : "Sign in"}</Text>
                </Pressable>
              </View>
              <View style={{ gap: 16, paddingTop: 4 }}>
                <AuthDivider />
                <AuthButton provider="google" label="Continue with Google"
                  disabled={!!busy} loading={busy === "google"} onPress={() => social("google")} />
                <AuthButton provider="apple" label="Continue with Apple"
                  disabled={!!busy} loading={busy === "apple"} onPress={() => social("apple")} />
                <Text style={[a.muted, { textAlign: "center", fontSize: 11 }]}>
                  Google and Apple open demo accounts for now.
                </Text>
              </View>
            </>
          )}
        </>
      )}
    </AuthFrame>
  );
}
