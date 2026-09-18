-- SideQuest backend foundation
--
-- Design goals:
--   * auth-backed party membership is the authorization boundary
--   * short room codes are expiring invitations, never credentials
--   * journey_state is the latest snapshot; journey_events is the audit/replay log
--   * quest offers are snapshotted per journey for a stable Chronicle
--   * photos remain private and are shared through RLS/signed URLs

create schema if not exists extensions;
create schema if not exists private;

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- User-facing profile data. Authorization never depends on profile fields.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_seed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null default 'The Wayfarers' check (char_length(name) between 1 and 60),
  status text not null default 'forming' check (status in ('forming', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.party_members (
  party_id uuid not null references public.parties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('pilot', 'navigator')),
  display_name text not null check (char_length(display_name) between 1 and 40),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (party_id, user_id),
  constraint party_members_left_after_joined check (left_at is null or left_at >= joined_at)
);

create unique index party_members_one_active_pilot_idx
  on public.party_members (party_id)
  where role = 'pilot' and left_at is null;

create unique index party_members_one_active_navigator_idx
  on public.party_members (party_id)
  where role = 'navigator' and left_at is null;

create index party_members_user_active_idx
  on public.party_members (user_id, party_id)
  where left_at is null;

-- Invite creation/redemption belongs in a narrow rate-limited RPC.
-- Only the SHA-256 digest is persisted; plaintext is returned once to the pilot.
create table public.party_invites (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  code_digest bytea not null unique check (octet_length(code_digest) = 32),
  intended_role text not null default 'navigator' check (intended_role in ('pilot', 'navigator')),
  expires_at timestamptz not null,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint party_invites_expiry_after_creation check (expires_at > created_at),
  constraint party_invites_redemption_pair check (
    (redeemed_by is null and redeemed_at is null)
    or (redeemed_by is not null and redeemed_at is not null)
  )
);

create index party_invites_party_active_idx
  on public.party_invites (party_id, expires_at)
  where redeemed_at is null and revoked_at is null;

create table public.journeys (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  origin_name text not null check (char_length(origin_name) between 1 and 160),
  destination_name text not null check (char_length(destination_name) between 1 and 160),
  origin_location extensions.geography(point, 4326),
  destination_location extensions.geography(point, 4326),
  route_polyline text,
  route_provider text,
  route_provider_id text,
  baseline_duration_mins integer check (baseline_duration_mins is null or baseline_duration_mins > 0),
  baseline_distance_m integer check (baseline_distance_m is null or baseline_distance_m > 0),
  target_quest_count smallint not null default 3 check (target_quest_count between 1 and 5),
  detour_budget_mins smallint not null default 30 check (detour_budget_mins in (15, 30, 60)),
  vibe_preferences text[] not null default array['scenic', 'food', 'lore', 'curiosity']::text[],
  fuel_mode text not null default 'petrol' check (fuel_mode in ('petrol', 'diesel', 'electric', 'hybrid', 'none')),
  estimated_range_km integer check (estimated_range_km is null or estimated_range_km > 0),
  status text not null default 'planning' check (status in ('planning', 'active', 'paused', 'completed', 'cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journeys_vibes_allowed check (
    vibe_preferences <@ array['scenic', 'food', 'lore', 'curiosity']::text[]
    and cardinality(vibe_preferences) > 0
  ),
  constraint journeys_completion_consistent check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index journeys_party_created_idx on public.journeys (party_id, created_at desc);
create index journeys_active_party_idx on public.journeys (party_id, updated_at desc)
  where status in ('planning', 'active', 'paused');

-- One hot row per journey for frequent realtime updates.
create table public.journey_state (
  journey_id uuid primary key references public.journeys(id) on delete cascade,
  stamina smallint not null default 100 check (stamina between 0 and 100),
  rations smallint not null default 100 check (rations between 0 and 100),
  fuel_level smallint not null default 100 check (fuel_level between 0 and 100),
  total_xp integer not null default 0 check (total_xp >= 0),
  detour_spent_mins integer not null default 0 check (detour_spent_mins >= 0),
  current_position extensions.geography(point, 4326),
  current_speed_kph numeric(5, 1) check (current_speed_kph is null or current_speed_kph between 0 and 350),
  continuous_motion_started_at timestamptz,
  last_rest_at timestamptz,
  last_position_at timestamptz,
  well_rested_until timestamptz,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table public.quest_places (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_place_id text not null,
  name text not null check (char_length(name) between 1 and 160),
  category text not null check (category in ('scenic', 'food', 'lore', 'curiosity', 'fuel', 'charging', 'rest')),
  location extensions.geography(point, 4326) not null,
  address text,
  rating numeric(2, 1) check (rating is null or rating between 0 and 5),
  review_count integer check (review_count is null or review_count >= 0),
  objective_prompt text,
  flavor_dialog text,
  provider_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(provider_payload) = 'object'),
  is_active boolean not null default true,
  refreshed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_place_id)
);

create index quest_places_location_idx on public.quest_places using gist (location);
create index quest_places_active_category_idx on public.quest_places (category, rating desc)
  where is_active;

-- A stable offer snapshot: catalog data may refresh, but completed journeys should not rewrite history.
create table public.journey_quests (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  quest_place_id uuid references public.quest_places(id) on delete set null,
  rank smallint not null check (rank between 1 and 20),
  state text not null default 'offered' check (state in ('offered', 'accepted', 'arrived', 'completed', 'skipped', 'expired')),
  title_snapshot text not null,
  category_snapshot text not null check (category_snapshot in ('scenic', 'food', 'lore', 'curiosity', 'fuel', 'charging', 'rest')),
  location_snapshot extensions.geography(point, 4326) not null,
  objective_snapshot text,
  flavor_snapshot text,
  rating_snapshot numeric(2, 1) check (rating_snapshot is null or rating_snapshot between 0 and 5),
  review_count_snapshot integer check (review_count_snapshot is null or review_count_snapshot >= 0),
  added_detour_mins smallint not null check (added_detour_mins >= 0),
  score numeric(12, 6) not null check (score >= 0),
  scoring_version text not null default 'corridor-v1',
  xp_reward integer not null default 100 check (xp_reward >= 0),
  offered_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  skipped_at timestamptz,
  unique (journey_id, rank),
  unique (id, journey_id)
);

create index journey_quests_journey_state_rank_idx
  on public.journey_quests (journey_id, state, rank);
create index journey_quests_place_idx on public.journey_quests (quest_place_id)
  where quest_place_id is not null;

-- Append-only game log. client_event_id makes mobile retries idempotent.
create table public.journey_events (
  id bigint generated always as identity primary key,
  journey_id uuid not null references public.journeys(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  client_event_id uuid not null,
  event_type text not null check (event_type in (
    'journey_started', 'journey_paused', 'journey_resumed', 'journey_completed',
    'position_sampled', 'vitals_changed', 'quest_offered', 'quest_accepted',
    'quest_skipped', 'quest_arrived', 'quest_completed', 'rest_started',
    'rest_completed', 'memory_captured'
  )),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (journey_id, client_event_id)
);

create index journey_events_journey_cursor_idx
  on public.journey_events (journey_id, id);
create index journey_events_journey_occurred_idx
  on public.journey_events (journey_id, occurred_at desc);

create table public.chronicle_entries (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  journey_quest_id uuid,
  captured_by uuid not null references auth.users(id) on delete restrict,
  entry_type text not null check (entry_type in ('quest', 'spontaneous')),
  storage_path text not null unique,
  location extensions.geography(point, 4326),
  location_name text check (location_name is null or char_length(location_name) <= 160),
  elevation_m integer,
  vitals_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(vitals_snapshot) = 'object'),
  ai_status text not null default 'pending' check (ai_status in ('pending', 'ready', 'failed', 'skipped')),
  ai_caption text,
  xp_awarded integer not null default 0 check (xp_awarded >= 0),
  captured_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chronicle_entries_quest_journey_fkey
    foreign key (journey_quest_id, journey_id)
    references public.journey_quests(id, journey_id)
    on delete set null (journey_quest_id),
  constraint chronicle_quest_shape check (
    (entry_type = 'quest' and journey_quest_id is not null)
    or (entry_type = 'spontaneous' and journey_quest_id is null)
  )
);

create index chronicle_entries_journey_captured_idx
  on public.chronicle_entries (journey_id, captured_at desc);
create index chronicle_entries_quest_idx on public.chronicle_entries (journey_quest_id)
  where journey_quest_id is not null;
create index chronicle_entries_captured_by_idx on public.chronicle_entries (captured_by);

-- Internal authorization helpers. They live outside exposed schemas and always bind auth.uid().
create or replace function private.current_user_party_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select pm.party_id
  from public.party_members pm
  where pm.user_id = (select auth.uid())
    and pm.left_at is null
$$;

create or replace function private.is_party_member(target_party_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.party_members pm
      where pm.party_id = target_party_id
        and pm.user_id = (select auth.uid())
        and pm.left_at is null
    )
$$;

create or replace function private.has_party_role(target_party_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.party_members pm
      where pm.party_id = target_party_id
        and pm.user_id = (select auth.uid())
        and pm.role = any(allowed_roles)
        and pm.left_at is null
    )
$$;

create or replace function private.is_journey_member(target_journey_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.journeys j
      join public.party_members pm on pm.party_id = j.party_id
      where j.id = target_journey_id
        and pm.user_id = (select auth.uid())
        and pm.left_at is null
    )
$$;

create or replace function private.can_access_chronicle_object(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  journey_segment text;
begin
  journey_segment := split_part(object_name, '/', 1);

  if journey_segment !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' then
    return false;
  end if;

  return private.is_journey_member(journey_segment::uuid);
end;
$$;

revoke execute on function private.current_user_party_ids() from public, anon;
revoke execute on function private.is_party_member(uuid) from public, anon;
revoke execute on function private.has_party_role(uuid, text[]) from public, anon;
revoke execute on function private.is_journey_member(uuid) from public, anon;
revoke execute on function private.can_access_chronicle_object(text) from public, anon;

grant execute on function private.current_user_party_ids() to authenticated;
grant execute on function private.is_party_member(uuid) to authenticated;
grant execute on function private.has_party_role(uuid, text[]) to authenticated;
grant execute on function private.is_journey_member(uuid) to authenticated;
grant execute on function private.can_access_chronicle_object(text) to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger parties_set_updated_at before update on public.parties
for each row execute function private.set_updated_at();
create trigger journeys_set_updated_at before update on public.journeys
for each row execute function private.set_updated_at();
create trigger journey_state_set_updated_at before update on public.journey_state
for each row execute function private.set_updated_at();
create trigger quest_places_set_updated_at before update on public.quest_places
for each row execute function private.set_updated_at();
create trigger chronicle_entries_set_updated_at before update on public.chronicle_entries
for each row execute function private.set_updated_at();

-- Keep signup resilient: if profile creation ever fails, fail signup instead of creating a broken user.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_seed)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Traveler'), 40),
    new.id::text
  );
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- RLS and least-privilege grants.
alter table public.profiles enable row level security;
alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.party_invites enable row level security;
alter table public.journeys enable row level security;
alter table public.journey_state enable row level security;
alter table public.quest_places enable row level security;
alter table public.journey_quests enable row level security;
alter table public.journey_events enable row level security;
alter table public.chronicle_entries enable row level security;

revoke all on table
  public.profiles,
  public.parties,
  public.party_members,
  public.party_invites,
  public.journeys,
  public.journey_state,
  public.quest_places,
  public.journey_quests,
  public.journey_events,
  public.chronicle_entries
from anon, authenticated;
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.parties, public.party_members, public.journeys, public.journey_state,
  public.quest_places, public.journey_quests, public.journey_events, public.chronicle_entries
  to authenticated;
grant insert on public.chronicle_entries to authenticated;

create policy profiles_select_own
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy parties_select_members
on public.parties for select to authenticated
using (id in (select private.current_user_party_ids()));

create policy party_members_select_members
on public.party_members for select to authenticated
using (party_id in (select private.current_user_party_ids()));

-- No party_invites policy: only trusted Edge Functions may inspect or mutate invitations.

create policy journeys_select_members
on public.journeys for select to authenticated
using (party_id in (select private.current_user_party_ids()));

create policy journey_state_select_members
on public.journey_state for select to authenticated
using ((select private.is_journey_member(journey_id)));

create policy quest_places_select_active
on public.quest_places for select to authenticated
using (is_active);

create policy journey_quests_select_members
on public.journey_quests for select to authenticated
using ((select private.is_journey_member(journey_id)));

create policy journey_events_select_members
on public.journey_events for select to authenticated
using ((select private.is_journey_member(journey_id)));

create policy chronicle_entries_select_members
on public.chronicle_entries for select to authenticated
using ((select private.is_journey_member(journey_id)));

create policy chronicle_entries_insert_self
on public.chronicle_entries for insert to authenticated
with check (
  captured_by = (select auth.uid())
  and (select private.is_journey_member(journey_id))
  and storage_path like journey_id::text || '/%'
);

-- Private Chronicle storage. Object paths are journey_id/entry_id/file.ext.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chronicle-photos',
  'chronicle-photos',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy chronicle_objects_select_members
on storage.objects for select to authenticated
using (
  bucket_id = 'chronicle-photos'
  and (select private.can_access_chronicle_object(name))
);

create policy chronicle_objects_insert_members
on storage.objects for insert to authenticated
with check (
  bucket_id = 'chronicle-photos'
  and (select private.can_access_chronicle_object(name))
  and owner_id = (select auth.uid())::text
);

create policy chronicle_objects_update_owner
on storage.objects for update to authenticated
using (
  bucket_id = 'chronicle-photos'
  and owner_id = (select auth.uid())::text
  and (select private.can_access_chronicle_object(name))
)
with check (
  bucket_id = 'chronicle-photos'
  and owner_id = (select auth.uid())::text
  and (select private.can_access_chronicle_object(name))
);

create policy chronicle_objects_delete_owner
on storage.objects for delete to authenticated
using (
  bucket_id = 'chronicle-photos'
  and owner_id = (select auth.uid())::text
  and (select private.can_access_chronicle_object(name))
);

-- Realtime is opt-in per table. These are the small, journey-scoped feeds clients subscribe to.
alter table public.journey_state replica identity full;
alter table public.journey_quests replica identity full;
alter table public.chronicle_entries replica identity full;

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array['journey_state', 'journey_quests', 'journey_events', 'chronicle_entries']
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = relation_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', relation_name);
    end if;
  end loop;
end
$$;

comment on table public.journey_state is 'Latest mutable journey snapshot; writes should be serialized by trusted backend code.';
comment on table public.journey_events is 'Append-only idempotent event log for realtime, replay, and audit.';
comment on column public.party_invites.code_digest is 'SHA-256 digest of an expiring invite code; plaintext is never persisted.';
comment on column public.chronicle_entries.storage_path is 'Private Storage object path: journey_id/entry_id/file.ext.';
