import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

const RETURN_KEY = "sidequest.auth.return-invite";
export function authRedirectUrl(recovery = false) {
  const base =
    Platform.OS === "web" && typeof window !== "undefined"
      ? `${window.location.origin}/auth-callback`
      : Linking.createURL("auth-callback", { scheme: "sidequest" });
  return recovery ? `${base}?recovery=1` : base;
}
export async function rememberAuthInvite(invite?: string) {
  if (invite && /^[a-zA-Z0-9-]{1,40}$/.test(invite))
    await AsyncStorage.setItem(RETURN_KEY, invite);
  else await AsyncStorage.removeItem(RETURN_KEY);
}
let lastCode: string | undefined;
let lastExchange: Promise<string | null> | undefined;
export function finishAuthCode(code: string) {
  if (code === lastCode && lastExchange) return lastExchange;
  lastCode = code;
  lastExchange = (async () => {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error)
      throw new Error(
        "This sign-in link expired or was opened in another browser. Start again on this device.",
      );
    const invite = await AsyncStorage.getItem(RETURN_KEY);
    await AsyncStorage.removeItem(RETURN_KEY);
    return invite;
  })();
  return lastExchange;
}
