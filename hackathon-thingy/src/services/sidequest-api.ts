import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/database';

type RpcSuccess<T extends object> = { ok: true } & T;
type RpcFailure = { ok: false; code: string; message: string };

export type CreateTripResult = RpcSuccess<{
  party_id: string;
  journey_id: string;
  invite_code: string;
  invite_expires_at: string;
  role: 'pilot';
}>;

export type JoinTripResult =
  | RpcSuccess<{
      party_id: string;
      journey_id: string;
      role: 'pilot' | 'navigator';
      already_joined: boolean;
    }>
  | RpcFailure;

export type PhotoReservation = RpcSuccess<{
  entry_id: string;
  bucket: 'chronicle-photos';
  storage_path: string;
}>;

export async function createTrip(input: {
  partyName: string;
  originName: string;
  destinationName: string;
  targetQuestCount?: number;
  detourBudgetMins?: 15 | 30 | 60;
  vibePreferences?: ('scenic' | 'food' | 'lore' | 'curiosity')[];
  fuelMode?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'none';
}) {
  const { data, error } = await supabase.rpc('create_trip', {
    p_party_name: input.partyName,
    p_origin_name: input.originName,
    p_destination_name: input.destinationName,
    p_target_quest_count: input.targetQuestCount ?? 3,
    p_detour_budget_mins: input.detourBudgetMins ?? 30,
    p_vibe_preferences: input.vibePreferences ?? ['scenic', 'food', 'lore', 'curiosity'],
    p_fuel_mode: input.fuelMode ?? 'petrol',
  });

  if (error) throw error;
  return data as CreateTripResult;
}

export async function joinTrip(inviteCode: string, displayName: string) {
  const { data, error } = await supabase.rpc('join_trip', {
    p_invite_code: inviteCode,
    p_display_name: displayName,
  });

  if (error) throw error;
  return data as JoinTripResult;
}

export async function setQuestState(
  journeyQuestId: string,
  nextState: 'accepted' | 'arrived' | 'completed' | 'skipped',
  clientEventId?: string,
) {
  const { data, error } = await supabase.rpc('set_quest_state', {
    p_journey_quest_id: journeyQuestId,
    p_next_state: nextState,
    p_client_event_id: clientEventId,
  });

  if (error) throw error;
  return data as RpcSuccess<{ duplicate: boolean; state: string }>;
}

export async function recordJourneyEvent(input: {
  journeyId: string;
  clientEventId: string;
  eventType:
    | 'journey_started'
    | 'journey_paused'
    | 'journey_resumed'
    | 'journey_completed'
    | 'position_sampled'
    | 'vitals_changed'
    | 'rest_started'
    | 'rest_completed';
  payload?: Json;
  occurredAt?: string;
}) {
  const { data, error } = await supabase.rpc('record_journey_event', {
    p_journey_id: input.journeyId,
    p_client_event_id: input.clientEventId,
    p_event_type: input.eventType,
    p_payload: input.payload ?? {},
    p_occurred_at: input.occurredAt ?? new Date().toISOString(),
  });

  if (error) throw error;
  return data as RpcSuccess<{ duplicate: boolean; event_id?: number; version: number }>;
}

export async function uploadChroniclePhoto(input: {
  journeyId: string;
  bytes: ArrayBuffer;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic';
  fileExtension: 'jpg' | 'jpeg' | 'png' | 'webp' | 'heic';
  entryType: 'quest' | 'spontaneous';
  journeyQuestId?: string;
  locationName?: string;
  longitude?: number;
  latitude?: number;
  elevationM?: number;
  vitalsSnapshot?: Json;
  capturedAt?: string;
}) {
  const { data: reservationData, error: reservationError } = await supabase.rpc(
    'create_photo_upload',
    {
      p_journey_id: input.journeyId,
      p_entry_type: input.entryType,
      p_journey_quest_id: input.journeyQuestId,
      p_file_extension: input.fileExtension,
      p_location_name: input.locationName,
      p_longitude: input.longitude,
      p_latitude: input.latitude,
      p_elevation_m: input.elevationM,
      p_vitals_snapshot: input.vitalsSnapshot ?? {},
      p_captured_at: input.capturedAt ?? new Date().toISOString(),
    },
  );

  if (reservationError) throw reservationError;
  const reservation = reservationData as PhotoReservation;

  const { error: uploadError } = await supabase.storage
    .from(reservation.bucket)
    .upload(reservation.storage_path, input.bytes, {
      contentType: input.contentType,
      upsert: false,
    });

  if (uploadError) {
    await supabase.from('chronicle_entries').delete().eq('id', reservation.entry_id);
    throw uploadError;
  }

  const { data: finalized, error: finalizeError } = await supabase.rpc('finalize_photo_upload', {
    p_entry_id: reservation.entry_id,
  });

  if (finalizeError) throw finalizeError;
  return { reservation, finalized };
}

export async function createChroniclePhotoUrl(storagePath: string, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from('chronicle-photos')
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}

export function subscribeToJourney(
  journeyId: string,
  onChange: (table: string, payload: unknown) => void,
): RealtimeChannel {
  return supabase
    .channel(`journey:${journeyId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'journey_state', filter: `journey_id=eq.${journeyId}` },
      (payload) => onChange('journey_state', payload),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'journey_quests', filter: `journey_id=eq.${journeyId}` },
      (payload) => onChange('journey_quests', payload),
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'journey_events', filter: `journey_id=eq.${journeyId}` },
      (payload) => onChange('journey_events', payload),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chronicle_entries', filter: `journey_id=eq.${journeyId}` },
      (payload) => onChange('chronicle_entries', payload),
    )
    .subscribe();
}
