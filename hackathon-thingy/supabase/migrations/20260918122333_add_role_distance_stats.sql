-- Per-member travel credit is derived from accepted position samples. The client
-- never writes distance totals directly, so role achievements cannot be forged by
-- updating a profile row.
create table public.journey_member_stats (
  journey_id uuid not null references public.journeys(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pilot_distance_m bigint not null default 0 check (pilot_distance_m >= 0),
  navigator_distance_m bigint not null default 0 check (navigator_distance_m >= 0),
  pilot_seconds bigint not null default 0 check (pilot_seconds >= 0),
  navigator_seconds bigint not null default 0 check (navigator_seconds >= 0),
  position_segments integer not null default 0 check (position_segments >= 0),
  updated_at timestamptz not null default now(),
  primary key (journey_id, user_id)
);

create index journey_member_stats_user_idx
  on public.journey_member_stats (user_id, updated_at desc);

alter table public.journey_member_stats enable row level security;

grant select on public.journey_member_stats to authenticated;

create policy journey_member_stats_select_party
on public.journey_member_stats for select
to authenticated
using (
  (select auth.uid()) = user_id
  or (select private.is_journey_member(journey_id))
);

create or replace function private.credit_role_distance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  previous_position extensions.geography;
  previous_at timestamptz;
  next_position extensions.geography;
  segment_m bigint;
  segment_seconds bigint;
  longitude_value numeric;
  latitude_value numeric;
begin
  if new.event_type <> 'position_sampled' then
    return new;
  end if;

  longitude_value := (new.payload ->> 'longitude')::numeric;
  latitude_value := (new.payload ->> 'latitude')::numeric;
  next_position := extensions.st_setsrid(
    extensions.st_makepoint(longitude_value, latitude_value),
    4326
  )::extensions.geography;

  select js.current_position, js.last_position_at
  into previous_position, previous_at
  from public.journey_state js
  where js.journey_id = new.journey_id
  for update;

  if previous_position is null or previous_at is null or new.occurred_at <= previous_at then
    return new;
  end if;

  segment_m := round(extensions.st_distance(previous_position, next_position))::bigint;
  segment_seconds := least(
    1800,
    greatest(0, floor(extract(epoch from (new.occurred_at - previous_at)))::bigint)
  );

  -- Ignore GPS jumps above 360 km/h, with 500 m of tolerance for sparse/rough fixes.
  if segment_m <= 0 or segment_m > greatest(500, segment_seconds * 100) then
    return new;
  end if;

  insert into public.journey_member_stats (
    journey_id,
    user_id,
    pilot_distance_m,
    navigator_distance_m,
    pilot_seconds,
    navigator_seconds,
    position_segments,
    updated_at
  )
  select
    new.journey_id,
    pm.user_id,
    case when pm.role = 'pilot' then segment_m else 0 end,
    case when pm.role = 'navigator' then segment_m else 0 end,
    case when pm.role = 'pilot' then segment_seconds else 0 end,
    case when pm.role = 'navigator' then segment_seconds else 0 end,
    1,
    new.occurred_at
  from public.journeys j
  join public.party_members pm on pm.party_id = j.party_id
  where j.id = new.journey_id
    and pm.left_at is null
  on conflict (journey_id, user_id) do update
  set pilot_distance_m = public.journey_member_stats.pilot_distance_m + excluded.pilot_distance_m,
      navigator_distance_m = public.journey_member_stats.navigator_distance_m + excluded.navigator_distance_m,
      pilot_seconds = public.journey_member_stats.pilot_seconds + excluded.pilot_seconds,
      navigator_seconds = public.journey_member_stats.navigator_seconds + excluded.navigator_seconds,
      position_segments = public.journey_member_stats.position_segments + 1,
      updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke all on function private.credit_role_distance() from public, anon, authenticated;

create trigger journey_events_credit_role_distance
before insert on public.journey_events
for each row execute function private.credit_role_distance();

create view public.traveler_role_totals
with (security_invoker = true)
as
select
  jms.user_id,
  coalesce(sum(jms.pilot_distance_m), 0)::bigint as pilot_distance_m,
  coalesce(sum(jms.navigator_distance_m), 0)::bigint as navigator_distance_m,
  coalesce(sum(jms.pilot_seconds), 0)::bigint as pilot_seconds,
  coalesce(sum(jms.navigator_seconds), 0)::bigint as navigator_seconds,
  count(distinct jms.journey_id)::integer as journeys_count
from public.journey_member_stats jms
group by jms.user_id;

revoke all on public.traveler_role_totals from public, anon;
grant select on public.traveler_role_totals to authenticated;

comment on table public.journey_member_stats is
  'Server-derived distance and active time credited to each member role per journey.';
comment on view public.traveler_role_totals is
  'RLS-aware lifetime Pilot and Navigator totals for traveler profiles.';
