import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { AuthButton, AuthField, AuthFrame, a } from "@/components/auth/auth-ui";
import { useAuth } from "@/context/auth";
import { supabase } from "@/lib/supabase";
export default function ResetPassword() {
  const { session, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const save = async () => {
    setError("");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Your passwords don’t match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSaved(true);
      setPassword("");
      setConfirm("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update your password.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthFrame>
      <Text style={a.title}>
        {saved ? "Password updated." : "Choose a new password."}
      </Text>
      {!loading && !session ? (
        <>
          <Text style={a.body}>
            Open the reset link from your email to continue.
          </Text>
          <AuthButton
            label="Back to sign in"
            onPress={() => router.replace("/")}
          />
        </>
      ) : saved ? (
        <>
          <Text style={a.body}>
            You can use your new password next time you sign in.
          </Text>
          <AuthButton
            label="Continue to your trips"
            onPress={() => router.replace("/journey")}
          />
        </>
      ) : (
        <>
          <AuthField
            label="New password"
            value={password}
            onChange={setPassword}
            kind="new-password"
            secure
            placeholder="At least 8 characters"
          />
          <AuthField
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            kind="new-password"
            secure
            onSubmit={() => void save()}
          />
          {!!error && (
            <Text accessibilityRole="alert" style={a.error}>
              {error}
            </Text>
          )}
          <AuthButton
            label="Save password"
            onPress={() => void save()}
            loading={busy || loading}
            disabled={!session}
          />
        </>
      )}
    </AuthFrame>
  );
}
