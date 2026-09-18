import { createClient } from '@supabase/supabase-js';

const url = process.env.SIDEQUEST_SUPABASE_URL;
const publishableKey = process.env.SIDEQUEST_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SIDEQUEST_SUPABASE_SECRET_KEY;
const demoPassword = process.env.SIDEQUEST_DEMO_PASSWORD;

if (!url || !publishableKey || !secretKey || !demoPassword) {
  throw new Error(
    'Set SIDEQUEST_SUPABASE_URL, SIDEQUEST_SUPABASE_PUBLISHABLE_KEY, ' +
      'SIDEQUEST_SUPABASE_SECRET_KEY, and SIDEQUEST_DEMO_PASSWORD.',
  );
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const makeClient = () =>
  createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

async function ensureDemoUser(email, displayName) {
  let page = 1;
  let existing;

  while (!existing) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    existing = data.users.find((user) => user.email === email);
    if (existing || data.users.length < 100) break;
    page += 1;
  }

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: demoPassword,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error) throw error;
  return data.user;
}

async function signIn(email) {
  const client = makeClient();
  const { error } = await client.auth.signInWithPassword({ email, password: demoPassword });
  if (error) throw error;
  return client;
}

const pilotEmail = 'pilot.demo@sidequest.invalid';
const navigatorEmail = 'navigator.demo@sidequest.invalid';

const pilotUser = await ensureDemoUser(pilotEmail, 'Demo Pilot');
const navigatorUser = await ensureDemoUser(navigatorEmail, 'Demo Navigator');
const pilot = await signIn(pilotEmail);
const navigator = await signIn(navigatorEmail);

const { data: existingParties, error: existingPartyError } = await pilot
  .from('parties')
  .select('id, name')
  .like('name', 'SideQuest Demo%')
  .order('created_at', { ascending: false })
  .limit(1);
if (existingPartyError) throw existingPartyError;

if (existingParties.length === 1) {
  const party = existingParties[0];
  const { data: journeys, error: journeyError } = await pilot
    .from('journeys')
    .select('id')
    .eq('party_id', party.id)
    .order('created_at', { ascending: false })
    .limit(1);
  if (journeyError) throw journeyError;

  const { data: entries, error: entryError } = await pilot
    .from('chronicle_entries')
    .select('id, storage_path')
    .eq('journey_id', journeys[0].id)
    .order('created_at', { ascending: false })
    .limit(1);
  if (entryError) throw entryError;

  const { data: members, error: membershipError } = await navigator
    .from('party_members')
    .select('user_id, role')
    .eq('party_id', party.id);
  if (membershipError) throw membershipError;
  if (!members.some((member) => member.user_id === navigatorUser.id && member.role === 'navigator')) {
    throw new Error('The demo navigator is not linked to the existing demo party.');
  }

  const { data: signedPhoto, error: signedUrlError } = await pilot.storage
    .from('chronicle-photos')
    .createSignedUrl(entries[0].storage_path, 60);
  if (signedUrlError) throw signedUrlError;

  console.log(
    JSON.stringify(
      {
        already_seeded: true,
        pilot_user_id: pilotUser.id,
        navigator_user_id: navigatorUser.id,
        party_id: party.id,
        journey_id: journeys[0].id,
        chronicle_entry_id: entries[0].id,
        storage_path: entries[0].storage_path,
        pilot_can_sign_photo_url: Boolean(signedPhoto.signedUrl),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const { data: trip, error: createError } = await pilot.rpc('create_trip', {
  p_party_name: `SideQuest Demo ${new Date().toISOString().slice(0, 16)}`,
  p_origin_name: 'Stellenbosch',
  p_destination_name: 'Tierfontein Farm',
  p_target_quest_count: 3,
  p_detour_budget_mins: 30,
  p_vibe_preferences: ['scenic', 'food', 'lore', 'curiosity'],
  p_fuel_mode: 'petrol',
});
if (createError) throw createError;

const { data: joined, error: joinError } = await navigator.rpc('join_trip', {
  p_invite_code: trip.invite_code,
  p_display_name: 'Demo Navigator',
});
if (joinError) throw joinError;

const { data: reservation, error: reserveError } = await navigator.rpc('create_photo_upload', {
  p_journey_id: trip.journey_id,
  p_entry_type: 'spontaneous',
  p_file_extension: 'png',
  p_location_name: 'Demo Roadside Lookout',
  p_longitude: 18.9708,
  p_latitude: -34.1372,
  p_elevation_m: 214,
  p_vitals_snapshot: { stamina: 82, rations: 68, fuel_level: 74 },
  p_captured_at: new Date().toISOString(),
});
if (reserveError) throw reserveError;

const onePixelPng = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  ),
);
const { error: uploadError } = await navigator.storage
  .from(reservation.bucket)
  .upload(reservation.storage_path, onePixelPng, { contentType: 'image/png', upsert: false });
if (uploadError) throw uploadError;

const { data: finalized, error: finalizeError } = await navigator.rpc('finalize_photo_upload', {
  p_entry_id: reservation.entry_id,
});
if (finalizeError) throw finalizeError;

const { data: pilotEntries, error: readError } = await pilot
  .from('chronicle_entries')
  .select('id, journey_id, captured_by, storage_path, ai_status, xp_awarded')
  .eq('id', reservation.entry_id);
if (readError) throw readError;
if (pilotEntries.length !== 1) throw new Error('Pilot could not read the navigator photo metadata.');

const { data: signedPhoto, error: signedUrlError } = await pilot.storage
  .from('chronicle-photos')
  .createSignedUrl(reservation.storage_path, 60);
if (signedUrlError) throw signedUrlError;

console.log(
  JSON.stringify(
    {
      pilot_user_id: pilotUser.id,
      navigator_user_id: navigatorUser.id,
      party_id: trip.party_id,
      journey_id: trip.journey_id,
      joined_party_id: joined.party_id,
      chronicle_entry_id: reservation.entry_id,
      storage_path: reservation.storage_path,
      photo_finalized: finalized.ok === true,
      pilot_can_sign_photo_url: Boolean(signedPhoto.signedUrl),
    },
    null,
    2,
  ),
);
