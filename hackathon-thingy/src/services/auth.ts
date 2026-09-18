import { supabase } from '@/lib/supabase';

export async function signUpWithPassword(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { display_name: displayName.trim() },
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

export async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getClaims();
  if (error) throw error;
  return data?.claims?.sub ?? null;
}
