import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AuthButton, AuthFrame, a } from "@/components/auth/auth-ui";
import { finishAuthCode } from "@/services/auth-redirect";
import { SideQuestColors as C } from "@/constants/theme";
export default function AuthCallback() {
  const {
    code,
    error: providerError,
    recovery,
  } = useLocalSearchParams<{
    code?: string;
    error?: string;
    recovery?: string;
  }>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (!code || providerError) return;
    void finishAuthCode(code)
      .then((invite) => {
        if (!active) return;
        if (recovery === "1") router.replace("/reset-password");
        else if (invite)
          router.replace({
            pathname: "/join",
            params: { code: invite === "enter" ? "" : invite },
          });
        else router.replace("/journey");
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "Sign-in failed. Please try again.",
          );
      });
    return () => {
      active = false;
    };
  }, [code, providerError, recovery]);
  const message =
    error ||
    (providerError
      ? "Sign-in was cancelled or declined. Please try again."
      : !code
        ? "This sign-in link is incomplete. Start again."
        : "");
  return (
    <AuthFrame>
      <Text style={a.title}>
        {message ? "Let’s try that again." : "Signing you in…"}
      </Text>
      {message ? (
        <>
          <Text accessibilityRole="alert" style={a.error}>
            {message}
          </Text>
          <AuthButton
            label="Back to sign in"
            onPress={() => router.replace("/")}
          />
        </>
      ) : (
        <View style={{ gap: 20 }}>
          <ActivityIndicator color={C.gold} />
          <Text style={a.body}>Finishing your secure sign-in.</Text>
        </View>
      )}
    </AuthFrame>
  );
}
