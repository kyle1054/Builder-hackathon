import { authRedirectUrl } from "./auth-redirect";
import { supabase } from "@/lib/supabase";

export async function signUpWithPassword(
  email: string,
  password: string,
  displayName: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { display_name: displayName.trim() },
      emailRedirectTo: authRedirectUrl(),
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    {
      redirectTo: authRedirectUrl(true),
    },
  );
  if (error) throw error;
}

export async function updateDisplayName(userId: string, displayName: string) {
  const nextName = displayName.trim();
  if (nextName.length < 1 || nextName.length > 40) {
    throw new Error("Display name must be between 1 and 40 characters.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: nextName, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getClaims();
  if (error) throw error;
  return data?.claims?.sub ?? null;
}
