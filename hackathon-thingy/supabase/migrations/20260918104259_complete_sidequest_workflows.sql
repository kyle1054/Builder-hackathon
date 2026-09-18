-- Complete authenticated workflows for the SideQuest demo.
-- Privileged transaction logic stays in the unexposed private schema.
-- Public RPC functions remain SECURITY INVOKER and are explicitly granted.

create table private.invite_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  succeeded boolean not null default false
);

create index invite_attempts_user_recent_idx
  on private.invite_attempts (user_id, attempted_at desc);

-- Demo catalog. These records make the complete flow usable before a places provider is connected.
insert into public.quest_places (
  provider,
  provider_place_id,
  name,
  category,
  location,
  address,
  rating,
  review_count,
  objective_prompt,
  flavor_dialog,
  provider_payload
)
values
  (
    'sidequest-demo',
    'peregrine-pie-stop',
    'Peregrine Pie Stop',
    'food',
    extensions.st_setsrid(extensions.st_makepoint(19.0159, -34.1514), 4326)::extensions.geography,
    'Grabouw, Western Cape',
    4.9,
    1840,
    'Photograph the strangest pie flavour the party can find.',
    'A warm bakery signal flickers just beyond the next pass.',
    '{"demo_detour_mins": 8, "source_note": "hackathon demo record"}'::jsonb
  ),
  (
    'sidequest-demo',
    'houw-hoek-lookout',
    'Houw Hoek Lookout',
    'scenic',
    extensions.st_setsrid(extensions.st_makepoint(19.1628, -34.1988), 4326)::extensions.geography,
    'Houw Hoek Pass, Western Cape',
    4.8,
    612,
    'Frame the mountain road like the cover of a lost cartridge.',
    'The old pass opens a window across the Overberg.',
    '{"demo_detour_mins": 6, "source_note": "hackathon demo record"}'::jsonb
  ),
  (
    'sidequest-demo',
    'orchard-folklore-marker',
    'The Orchard Folklore Marker',
    'lore',
    extensions.st_setsrid(extensions.st_makepoint(19.2954, -34.1486), 4326)::extensions.geography,
    'Bot River, Western Cape',
    4.7,
    284,
    'Find the oldest date on the marker and invent its missing legend.',
    'A weathered marker remembers more travelers than any map.',
    '{"demo_detour_mins": 10, "source_note": "hackathon demo record"}'::jsonb
  ),
  (
    'sidequest-demo',
    'blue-crane-curiosity',
    'Blue Crane Curiosity',
    'curiosity',
    extensions.st_setsrid(extensions.st_makepoint(19.4982, -34.1511), 4326)::extensions.geography,
    'Caledon Road, Western Cape',
    4.6,
    147,
    'Capture a roadside detail that looks like it belongs in another world.',
    'Something improbable waits where the wheat fields meet the sky.',
    '{"demo_detour_mins": 5, "source_note": "hackathon demo record"}'::jsonb
  )
on conflict (provider, provider_place_id) do update set
  name = excluded.name,
  category = excluded.category,
  location = excluded.location,
  address = excluded.address,
  rating = excluded.rating,
  review_count = excluded.review_count,
  objective_prompt = excluded.objective_prompt,
  flavor_dialog = excluded.flavor_dialog,
  provider_payload = excluded.provider_payload,
  is_active = true,
  refreshed_at = now();

create or replace function private.generate_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select upper(
    substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 4)
    || '-'
    || substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 4)
  )
$$;

create or replace function private.create_trip(
  p_party_name text,
  p_origin_name text,
  p_destination_name text,
  p_target_quest_count smallint,
  p_detour_budget_mins smallint,
  p_vibe_preferences text[],
  p_fuel_mode text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_name text;
  new_party_id uuid;
  new_journey_id uuid;
  new_invite_id uuid;
  new_invite_code text;
  new_expires_at timestamptz := now() + interval '30 minutes';
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if char_length(trim(p_party_name)) not between 1 and 60 then
    raise exception 'Party name must contain 1 to 60 characters' using errcode = '22023';
  end if;

  if char_length(trim(p_origin_name)) not between 1 and 160
     or char_length(trim(p_destination_name)) not between 1 and 160 then
    raise exception 'Origin and destination are required' using errcode = '22023';
  end if;

  select p.display_name into caller_name
  from public.profiles p
  where p.id = caller_id;

  if caller_name is null then
    raise exception 'Profile is missing for authenticated user' using errcode = '23503';
  end if;

  insert into public.parties (created_by, name, status)
  values (caller_id, trim(p_party_name), 'forming')
  returning id into new_party_id;

  insert into public.party_members (party_id, user_id, role, display_name)
  values (new_party_id, caller_id, 'pilot', caller_name);

  for collision_attempt in 1..5 loop
    begin
      new_invite_code := private.generate_invite_code();

      insert into public.party_invites (
        party_id,
        created_by,
        code_digest,
        intended_role,
        expires_at
      )
      values (
        new_party_id,
        caller_id,
        extensions.digest(new_invite_code, 'sha256'),
        'navigator',
        new_expires_at
      )
      returning id into new_invite_id;

      exit;
    exception when unique_violation then
      new_invite_id := null;
    end;
  end loop;

  if new_invite_id is null then
    raise exception 'Could not generate a unique invitation' using errcode = '40001';
  end if;

  insert into public.journeys (
    party_id,
    created_by,
    origin_name,
    destination_name,
    target_quest_count,
    detour_budget_mins,
    vibe_preferences,
    fuel_mode,
    status,
    started_at
  )
  values (
    new_party_id,
    caller_id,
    trim(p_origin_name),
    trim(p_destination_name),
    p_target_quest_count,
    p_detour_budget_mins,
    p_vibe_preferences,
    p_fuel_mode,
    'active',
    now()
  )
  returning id into new_journey_id;

  insert into public.journey_state (journey_id)
  values (new_journey_id);

  insert into public.journey_quests (
    journey_id,
    quest_place_id,
    rank,
    title_snapshot,
    category_snapshot,
    location_snapshot,
    objective_snapshot,
    flavor_snapshot,
    rating_snapshot,
    review_count_snapshot,
    added_detour_mins,
    score,
    xp_reward
  )
  select
    new_journey_id,
    ranked.id,
    ranked.rank_number::smallint,
    ranked.name,
    ranked.category,
    ranked.location,
    ranked.objective_prompt,
    ranked.flavor_dialog,
    ranked.rating,
    ranked.review_count,
    ranked.detour_mins,
    ranked.quest_score,
    case ranked.category
      when 'scenic' then 140
      when 'lore' then 150
      when 'curiosity' then 125
      else 120
    end
  from (
    select
      qp.*,
      row_number() over (
        order by
          (
            coalesce(qp.rating, 0)
            * (ln(greatest(coalesce(qp.review_count, 1), 1)::numeric) / ln(10::numeric))
          ) / (coalesce((qp.provider_payload ->> 'demo_detour_mins')::numeric, 5) + 5) desc,
          qp.name
      ) as rank_number,
      coalesce((qp.provider_payload ->> 'demo_detour_mins')::smallint, 5) as detour_mins,
      round(
        (
          coalesce(qp.rating, 0)
          * (ln(greatest(coalesce(qp.review_count, 1), 1)::numeric) / ln(10::numeric))
        ) / (coalesce((qp.provider_payload ->> 'demo_detour_mins')::numeric, 5) + 5),
        6
      ) as quest_score
    from public.quest_places qp
    where qp.provider = 'sidequest-demo'
      and qp.is_active
      and qp.category = any(p_vibe_preferences)
  ) ranked
  where ranked.rank_number <= p_target_quest_count;

  insert into public.journey_events (
    journey_id,
    actor_user_id,
    client_event_id,
    event_type,
    payload,
    occurred_at
  )
  values (
    new_journey_id,
    caller_id,
    gen_random_uuid(),
    'journey_started',
    jsonb_build_object('source', 'create_trip'),
    now()
  );

  return jsonb_build_object(
    'ok', true,
    'party_id', new_party_id,
    'journey_id', new_journey_id,
    'invite_code', new_invite_code,
    'invite_expires_at', new_expires_at,
    'role', 'pilot'
  );
end;
$$;

create or replace function private.join_trip(
  p_invite_code text,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_code text := upper(trim(p_invite_code));
  recent_attempts integer;
  invite_row public.party_invites%rowtype;
  active_journey_id uuid;
  safe_display_name text;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  delete from private.invite_attempts
  where attempted_at < now() - interval '24 hours';

  select count(*) into recent_attempts
  from private.invite_attempts ia
  where ia.user_id = caller_id
    and ia.attempted_at >= now() - interval '10 minutes';

  if recent_attempts >= 8 then
    return jsonb_build_object(
      'ok', false,
      'code', 'RATE_LIMITED',
      'message', 'Too many attempts. Try again in ten minutes.'
    );
  end if;

  if normalized_code !~ '^[0-9A-F]{4}-[0-9A-F]{4}$' then
    insert into private.invite_attempts (user_id, succeeded) values (caller_id, false);
    return jsonb_build_object('ok', false, 'code', 'INVALID_CODE', 'message', 'Invite code is invalid.');
  end if;

  select pi.* into invite_row
  from public.party_invites pi
  where pi.code_digest = extensions.digest(normalized_code, 'sha256')
    and pi.redeemed_at is null
    and pi.revoked_at is null
    and pi.expires_at > now()
  for update;

  if invite_row.id is null then
    insert into private.invite_attempts (user_id, succeeded) values (caller_id, false);
    return jsonb_build_object('ok', false, 'code', 'INVALID_CODE', 'message', 'Invite code is invalid or expired.');
  end if;

  if exists (
    select 1 from public.party_members pm
    where pm.party_id = invite_row.party_id
      and pm.user_id = caller_id
      and pm.left_at is null
  ) then
    select j.id into active_journey_id
    from public.journeys j
    where j.party_id = invite_row.party_id
      and j.status in ('planning', 'active', 'paused')
    order by j.created_at desc
    limit 1;

    return jsonb_build_object(
      'ok', true,
      'party_id', invite_row.party_id,
      'journey_id', active_journey_id,
      'role', invite_row.intended_role,
      'already_joined', true
    );
  end if;

  if exists (
    select 1 from public.party_members pm
    where pm.party_id = invite_row.party_id
      and pm.role = invite_row.intended_role
      and pm.left_at is null
  ) then
    insert into private.invite_attempts (user_id, succeeded) values (caller_id, false);
    return jsonb_build_object('ok', false, 'code', 'ROLE_TAKEN', 'message', 'That party role is already filled.');
  end if;

  safe_display_name := left(coalesce(nullif(trim(p_display_name), ''), 'Traveler'), 40);

  update public.profiles
  set display_name = safe_display_name
  where id = caller_id;

  insert into public.party_members (party_id, user_id, role, display_name)
  values (invite_row.party_id, caller_id, invite_row.intended_role, safe_display_name);

  update public.party_invites
  set redeemed_by = caller_id,
      redeemed_at = now()
  where id = invite_row.id;

  update public.parties
  set status = 'active'
  where id = invite_row.party_id;

  insert into private.invite_attempts (user_id, succeeded) values (caller_id, true);

  select j.id into active_journey_id
  from public.journeys j
  where j.party_id = invite_row.party_id
    and j.status in ('planning', 'active', 'paused')
  order by j.created_at desc
  limit 1;

  return jsonb_build_object(
    'ok', true,
    'party_id', invite_row.party_id,
    'journey_id', active_journey_id,
    'role', invite_row.intended_role,
    'already_joined', false
  );
end;
$$;

create or replace function private.set_quest_state(
  p_journey_quest_id uuid,
  p_next_state text,
  p_client_event_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  quest_row public.journey_quests%rowtype;
  caller_role text;
  event_name text;
  effective_event_id uuid := coalesce(p_client_event_id, gen_random_uuid());
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select jq.* into quest_row
  from public.journey_quests jq
  where jq.id = p_journey_quest_id
  for update;

  if quest_row.id is null then
    raise exception 'Quest not found' using errcode = 'P0002';
  end if;

  select pm.role into caller_role
  from public.journeys j
  join public.party_members pm on pm.party_id = j.party_id
  where j.id = quest_row.journey_id
    and pm.user_id = caller_id
    and pm.left_at is null;

  if caller_role is null then
    raise exception 'Not a member of this journey' using errcode = '42501';
  end if;

  if caller_role <> 'navigator' and p_next_state in ('accepted', 'skipped', 'completed') then
    raise exception 'Only the navigator can perform this quest action' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.journey_events je
    where je.journey_id = quest_row.journey_id
      and je.client_event_id = effective_event_id
  ) then
    return jsonb_build_object('ok', true, 'duplicate', true, 'state', quest_row.state);
  end if;

  if not (
    (quest_row.state = 'offered' and p_next_state in ('accepted', 'skipped'))
    or (quest_row.state = 'accepted' and p_next_state in ('arrived', 'skipped'))
    or (quest_row.state = 'arrived' and p_next_state = 'completed')
  ) then
    raise exception 'Invalid quest transition from % to %', quest_row.state, p_next_state using errcode = '22023';
  end if;

  event_name := case p_next_state
    when 'accepted' then 'quest_accepted'
    when 'skipped' then 'quest_skipped'
    when 'arrived' then 'quest_arrived'
    when 'completed' then 'quest_completed'
  end;

  update public.journey_quests
  set state = p_next_state,
      accepted_at = case when p_next_state = 'accepted' then now() else accepted_at end,
      skipped_at = case when p_next_state = 'skipped' then now() else skipped_at end,
      completed_at = case when p_next_state = 'completed' then now() else completed_at end
  where id = quest_row.id;

  if p_next_state = 'completed' then
    update public.journey_state
    set total_xp = total_xp + quest_row.xp_reward,
        version = version + 1
    where journey_id = quest_row.journey_id;
  end if;

  insert into public.journey_events (
    journey_id,
    actor_user_id,
    client_event_id,
    event_type,
    payload,
    occurred_at
  )
  values (
    quest_row.journey_id,
    caller_id,
    effective_event_id,
    event_name,
    jsonb_build_object('journey_quest_id', quest_row.id, 'state', p_next_state),
    now()
  );

  return jsonb_build_object('ok', true, 'duplicate', false, 'state', p_next_state);
end;
$$;

create or replace function private.record_journey_event(
  p_journey_id uuid,
  p_client_event_id uuid,
  p_event_type text,
  p_payload jsonb,
  p_occurred_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_role text;
  inserted_event_id bigint;
  current_version bigint;
  longitude_value numeric;
  latitude_value numeric;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object' then
    raise exception 'Payload must be a JSON object' using errcode = '22023';
  end if;

  if p_event_type not in (
    'journey_started', 'journey_paused', 'journey_resumed', 'journey_completed',
    'position_sampled', 'vitals_changed', 'rest_started', 'rest_completed'
  ) then
    raise exception 'Unsupported event type' using errcode = '22023';
  end if;

  select pm.role into caller_role
  from public.journeys j
  join public.party_members pm on pm.party_id = j.party_id
  where j.id = p_journey_id
    and pm.user_id = caller_id
    and pm.left_at is null;

  if caller_role is null then
    raise exception 'Not a member of this journey' using errcode = '42501';
  end if;

  if p_event_type in ('journey_started', 'journey_paused', 'journey_resumed', 'journey_completed', 'position_sampled')
     and caller_role <> 'pilot' then
    raise exception 'Only the pilot can record this event' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.journey_events je
    where je.journey_id = p_journey_id
      and je.client_event_id = p_client_event_id
  ) then
    select js.version into current_version
    from public.journey_state js
    where js.journey_id = p_journey_id;

    return jsonb_build_object('ok', true, 'duplicate', true, 'version', current_version);
  end if;

  if p_event_type = 'vitals_changed' then
    if (p_payload ? 'stamina' and (p_payload ->> 'stamina')::integer not between 0 and 100)
       or (p_payload ? 'rations' and (p_payload ->> 'rations')::integer not between 0 and 100)
       or (p_payload ? 'fuel_level' and (p_payload ->> 'fuel_level')::integer not between 0 and 100) then
      raise exception 'Vitals must be between 0 and 100' using errcode = '22023';
    end if;
  end if;

  if p_event_type = 'position_sampled' then
    longitude_value := (p_payload ->> 'longitude')::numeric;
    latitude_value := (p_payload ->> 'latitude')::numeric;

    if longitude_value not between -180 and 180 or latitude_value not between -90 and 90 then
      raise exception 'Invalid coordinates' using errcode = '22023';
    end if;
  end if;

  insert into public.journey_events (
    journey_id,
    actor_user_id,
    client_event_id,
    event_type,
    payload,
    occurred_at
  )
  values (
    p_journey_id,
    caller_id,
    p_client_event_id,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_occurred_at, now())
  )
  returning id into inserted_event_id;

  if p_event_type = 'position_sampled' then
    update public.journey_state
    set current_position = extensions.st_setsrid(extensions.st_makepoint(longitude_value, latitude_value), 4326)::extensions.geography,
        current_speed_kph = case when p_payload ? 'speed_kph' then (p_payload ->> 'speed_kph')::numeric else current_speed_kph end,
        last_position_at = coalesce(p_occurred_at, now()),
        continuous_motion_started_at = coalesce(continuous_motion_started_at, coalesce(p_occurred_at, now())),
        version = version + 1
    where journey_id = p_journey_id
    returning version into current_version;
  elsif p_event_type = 'vitals_changed' then
    update public.journey_state
    set stamina = case when p_payload ? 'stamina' then (p_payload ->> 'stamina')::smallint else stamina end,
        rations = case when p_payload ? 'rations' then (p_payload ->> 'rations')::smallint else rations end,
        fuel_level = case when p_payload ? 'fuel_level' then (p_payload ->> 'fuel_level')::smallint else fuel_level end,
        version = version + 1
    where journey_id = p_journey_id
    returning version into current_version;
  elsif p_event_type = 'rest_completed' then
    update public.journey_state
    set stamina = 100,
        last_rest_at = coalesce(p_occurred_at, now()),
        well_rested_until = coalesce(p_occurred_at, now()) + interval '90 minutes',
        continuous_motion_started_at = null,
        version = version + 1
    where journey_id = p_journey_id
    returning version into current_version;
  else
    update public.journey_state
    set version = version + 1
    where journey_id = p_journey_id
    returning version into current_version;
  end if;

  if p_event_type = 'journey_started' then
    update public.journeys set status = 'active', started_at = coalesce(started_at, now()) where id = p_journey_id;
  elsif p_event_type = 'journey_paused' then
    update public.journeys set status = 'paused' where id = p_journey_id;
  elsif p_event_type = 'journey_resumed' then
    update public.journeys set status = 'active' where id = p_journey_id;
  elsif p_event_type = 'journey_completed' then
    update public.journeys set status = 'completed', completed_at = now() where id = p_journey_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'event_id', inserted_event_id,
    'version', current_version
  );
end;
$$;

create or replace function private.create_photo_upload(
  p_journey_id uuid,
  p_entry_type text,
  p_journey_quest_id uuid,
  p_file_extension text,
  p_location_name text,
  p_longitude numeric,
  p_latitude numeric,
  p_elevation_m integer,
  p_vitals_snapshot jsonb,
  p_captured_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  new_entry_id uuid := gen_random_uuid();
  normalized_extension text := lower(trim(leading '.' from p_file_extension));
  object_path text;
  photo_location extensions.geography(point, 4326);
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not private.is_journey_member(p_journey_id) then
    raise exception 'Not a member of this journey' using errcode = '42501';
  end if;

  if p_entry_type not in ('quest', 'spontaneous') then
    raise exception 'Invalid Chronicle entry type' using errcode = '22023';
  end if;

  if normalized_extension not in ('jpg', 'jpeg', 'png', 'webp', 'heic') then
    raise exception 'Unsupported image extension' using errcode = '22023';
  end if;

  if (p_entry_type = 'quest') <> (p_journey_quest_id is not null) then
    raise exception 'Quest memories require a journey quest; spontaneous memories cannot include one' using errcode = '22023';
  end if;

  if p_journey_quest_id is not null and not exists (
    select 1 from public.journey_quests jq
    where jq.id = p_journey_quest_id
      and jq.journey_id = p_journey_id
  ) then
    raise exception 'Quest does not belong to this journey' using errcode = '23503';
  end if;

  if (p_longitude is null) <> (p_latitude is null) then
    raise exception 'Longitude and latitude must be provided together' using errcode = '22023';
  end if;

  if p_longitude is not null then
    if p_longitude not between -180 and 180 or p_latitude not between -90 and 90 then
      raise exception 'Invalid coordinates' using errcode = '22023';
    end if;

    photo_location := extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography;
  end if;

  object_path := p_journey_id::text || '/' || new_entry_id::text || '/photo.' || normalized_extension;

  insert into public.chronicle_entries (
    id,
    journey_id,
    journey_quest_id,
    captured_by,
    entry_type,
    storage_path,
    location,
    location_name,
    elevation_m,
    vitals_snapshot,
    ai_status,
    captured_at
  )
  values (
    new_entry_id,
    p_journey_id,
    p_journey_quest_id,
    caller_id,
    p_entry_type,
    object_path,
    photo_location,
    nullif(trim(p_location_name), ''),
    p_elevation_m,
    coalesce(p_vitals_snapshot, '{}'::jsonb),
    'pending',
    coalesce(p_captured_at, now())
  );

  return jsonb_build_object(
    'ok', true,
    'entry_id', new_entry_id,
    'bucket', 'chronicle-photos',
    'storage_path', object_path
  );
end;
$$;

create or replace function private.can_write_chronicle_object(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  journey_segment text := split_part(object_name, '/', 1);
  entry_segment text := split_part(object_name, '/', 2);
begin
  if journey_segment !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
     or entry_segment !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' then
    return false;
  end if;

  return exists (
    select 1
    from public.chronicle_entries ce
    where ce.id = entry_segment::uuid
      and ce.journey_id = journey_segment::uuid
      and ce.captured_by = (select auth.uid())
      and ce.storage_path = object_name
  );
end;
$$;

create or replace function private.finalize_photo_upload(p_entry_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  entry_row public.chronicle_entries%rowtype;
  awarded_xp integer;
  effective_status text;
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select ce.* into entry_row
  from public.chronicle_entries ce
  where ce.id = p_entry_id
  for update;

  if entry_row.id is null
     or entry_row.captured_by <> caller_id
     or not private.is_journey_member(entry_row.journey_id) then
    raise exception 'Chronicle entry not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from storage.objects so
    where so.bucket_id = 'chronicle-photos'
      and so.name = entry_row.storage_path
  ) then
    return jsonb_build_object('ok', false, 'code', 'MISSING_OBJECT', 'message', 'Upload the photo before finalizing.');
  end if;

  if entry_row.ai_status in ('ready', 'skipped') then
    return jsonb_build_object('ok', true, 'duplicate', true, 'xp_awarded', entry_row.xp_awarded);
  end if;

  select case
    when entry_row.entry_type = 'spontaneous' then 25
    else greatest(coalesce(jq.xp_reward, 50), 50)
  end
  into awarded_xp
  from (select 1) seed
  left join public.journey_quests jq on jq.id = entry_row.journey_quest_id;

  -- AI captioning is optional for the demo. Mark as skipped until an AI worker is connected.
  effective_status := 'skipped';

  update public.chronicle_entries
  set ai_status = effective_status,
      xp_awarded = awarded_xp
  where id = entry_row.id;

  update public.journey_state
  set total_xp = total_xp + awarded_xp,
      version = version + 1
  where journey_id = entry_row.journey_id;

  insert into public.journey_events (
    journey_id,
    actor_user_id,
    client_event_id,
    event_type,
    payload,
    occurred_at
  )
  values (
    entry_row.journey_id,
    caller_id,
    gen_random_uuid(),
    'memory_captured',
    jsonb_build_object('chronicle_entry_id', entry_row.id, 'entry_type', entry_row.entry_type, 'xp_awarded', awarded_xp),
    entry_row.captured_at
  );

  return jsonb_build_object('ok', true, 'duplicate', false, 'xp_awarded', awarded_xp);
end;
$$;

-- Public API wrappers. They are invoker functions; the private functions perform explicit auth checks.
create or replace function public.create_trip(
  p_party_name text,
  p_origin_name text,
  p_destination_name text,
  p_target_quest_count smallint default 3,
  p_detour_budget_mins smallint default 30,
  p_vibe_preferences text[] default array['scenic', 'food', 'lore', 'curiosity']::text[],
  p_fuel_mode text default 'petrol'
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.create_trip(
    p_party_name,
    p_origin_name,
    p_destination_name,
    p_target_quest_count,
    p_detour_budget_mins,
    p_vibe_preferences,
    p_fuel_mode
  )
$$;

create or replace function public.join_trip(p_invite_code text, p_display_name text default 'Traveler')
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.join_trip(p_invite_code, p_display_name)
$$;

create or replace function public.set_quest_state(
  p_journey_quest_id uuid,
  p_next_state text,
  p_client_event_id uuid default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.set_quest_state(p_journey_quest_id, p_next_state, p_client_event_id)
$$;

create or replace function public.record_journey_event(
  p_journey_id uuid,
  p_client_event_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb,
  p_occurred_at timestamptz default now()
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.record_journey_event(
    p_journey_id,
    p_client_event_id,
    p_event_type,
    p_payload,
    p_occurred_at
  )
$$;

create or replace function public.create_photo_upload(
  p_journey_id uuid,
  p_entry_type text,
  p_journey_quest_id uuid default null,
  p_file_extension text default 'jpg',
  p_location_name text default null,
  p_longitude numeric default null,
  p_latitude numeric default null,
  p_elevation_m integer default null,
  p_vitals_snapshot jsonb default '{}'::jsonb,
  p_captured_at timestamptz default now()
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.create_photo_upload(
    p_journey_id,
    p_entry_type,
    p_journey_quest_id,
    p_file_extension,
    p_location_name,
    p_longitude,
    p_latitude,
    p_elevation_m,
    p_vitals_snapshot,
    p_captured_at
  )
$$;

create or replace function public.finalize_photo_upload(p_entry_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.finalize_photo_upload(p_entry_id)
$$;

revoke execute on function private.generate_invite_code() from public, anon, authenticated;
revoke execute on function private.create_trip(text, text, text, smallint, smallint, text[], text) from public, anon;
revoke execute on function private.join_trip(text, text) from public, anon;
revoke execute on function private.set_quest_state(uuid, text, uuid) from public, anon;
revoke execute on function private.record_journey_event(uuid, uuid, text, jsonb, timestamptz) from public, anon;
revoke execute on function private.create_photo_upload(uuid, text, uuid, text, text, numeric, numeric, integer, jsonb, timestamptz) from public, anon;
revoke execute on function private.can_write_chronicle_object(text) from public, anon;
revoke execute on function private.finalize_photo_upload(uuid) from public, anon;

grant execute on function private.create_trip(text, text, text, smallint, smallint, text[], text) to authenticated;
grant execute on function private.join_trip(text, text) to authenticated;
grant execute on function private.set_quest_state(uuid, text, uuid) to authenticated;
grant execute on function private.record_journey_event(uuid, uuid, text, jsonb, timestamptz) to authenticated;
grant execute on function private.create_photo_upload(uuid, text, uuid, text, text, numeric, numeric, integer, jsonb, timestamptz) to authenticated;
grant execute on function private.can_write_chronicle_object(text) to authenticated;
grant execute on function private.finalize_photo_upload(uuid) to authenticated;

revoke execute on function public.create_trip(text, text, text, smallint, smallint, text[], text) from public, anon;
revoke execute on function public.join_trip(text, text) from public, anon;
revoke execute on function public.set_quest_state(uuid, text, uuid) from public, anon;
revoke execute on function public.record_journey_event(uuid, uuid, text, jsonb, timestamptz) from public, anon;
revoke execute on function public.create_photo_upload(uuid, text, uuid, text, text, numeric, numeric, integer, jsonb, timestamptz) from public, anon;
revoke execute on function public.finalize_photo_upload(uuid) from public, anon;

grant execute on function public.create_trip(text, text, text, smallint, smallint, text[], text) to authenticated;
grant execute on function public.join_trip(text, text) to authenticated;
grant execute on function public.set_quest_state(uuid, text, uuid) to authenticated;
grant execute on function public.record_journey_event(uuid, uuid, text, jsonb, timestamptz) to authenticated;
grant execute on function public.create_photo_upload(uuid, text, uuid, text, text, numeric, numeric, integer, jsonb, timestamptz) to authenticated;
grant execute on function public.finalize_photo_upload(uuid) to authenticated;

-- Chronicle metadata may be removed only by the member who captured it.
grant delete on public.chronicle_entries to authenticated;

create policy chronicle_entries_delete_own
on public.chronicle_entries for delete to authenticated
using (
  captured_by = (select auth.uid())
  and (select private.is_journey_member(journey_id))
);

-- Tighten Storage writes: an object must match a pending Chronicle entry created by that user.
drop policy chronicle_objects_insert_members on storage.objects;
drop policy chronicle_objects_update_owner on storage.objects;

create policy chronicle_objects_insert_own_entry
on storage.objects for insert to authenticated
with check (
  bucket_id = 'chronicle-photos'
  and owner_id = (select auth.uid())::text
  and (select private.can_write_chronicle_object(name))
);

create policy chronicle_objects_update_own_entry
on storage.objects for update to authenticated
using (
  bucket_id = 'chronicle-photos'
  and owner_id = (select auth.uid())::text
  and (select private.can_write_chronicle_object(name))
)
with check (
  bucket_id = 'chronicle-photos'
  and owner_id = (select auth.uid())::text
  and (select private.can_write_chronicle_object(name))
);

comment on function public.create_trip(text, text, text, smallint, smallint, text[], text)
  is 'Creates an authenticated pilot party, active journey, quest snapshots, and a 30-minute navigator invite.';
comment on function public.join_trip(text, text)
  is 'Rate-limited atomic invite redemption for the signed-in navigator.';
comment on function public.create_photo_upload(uuid, text, uuid, text, text, numeric, numeric, integer, jsonb, timestamptz)
  is 'Reserves a trip-scoped private Storage path and pending Chronicle record.';
