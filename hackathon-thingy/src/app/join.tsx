import { useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "@/context/auth";
import { BodyText, PixelButton, QuestScreen } from "@/components/sidequest-ui";
import { Field, ps } from "@/components/planner-ui";
import { planner } from "@/services/trip-planner";
export default function JoinScreen() {
  const { code: incoming } = useLocalSearchParams<{ code?: string }>();
  const { session, loading } = useAuth();
  const [code, setCode] = useState(incoming ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!loading && !session)
    return (
      <Redirect href={{ pathname: "/", params: { invite: code || "enter" } }} />
    );
  const join = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await planner<{ id: string }>("join", { code });
      router.replace({ pathname: "/plan", params: { id: result.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to join. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <QuestScreen>
      <PixelButton
        label="← Your trips"
        variant="ghost"
        onPress={() => router.replace("/journey")}
      />
      <Text style={ps.title}>Join a trip</Text>
      <BodyText muted>
        Enter the invitation code from your trip organiser. You’ll join their
        trip and see the shared plan.
      </BodyText>
      <Field
        label="Invite code"
        value={code}
        onChangeText={setCode}
        placeholder="XXXX-XXXX-XXXX"
        maxLength={40}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={ps.error}>
          {error}
        </Text>
      )}
      <PixelButton
        label="Join trip →"
        loading={busy || loading}
        disabled={!code.trim()}
        onPress={join}
      />
    </QuestScreen>
  );
}
