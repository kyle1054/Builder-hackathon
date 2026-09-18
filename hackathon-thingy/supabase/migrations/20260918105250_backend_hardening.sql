-- Cover every foreign-key access path used by cascades, membership checks, and audit views.
create index if not exists chronicle_entries_quest_journey_idx
  on public.chronicle_entries (journey_quest_id, journey_id)
  where journey_quest_id is not null;

create index if not exists journey_events_actor_user_idx
  on public.journey_events (actor_user_id)
  where actor_user_id is not null;

create index if not exists journeys_created_by_idx
  on public.journeys (created_by);

create index if not exists parties_created_by_idx
  on public.parties (created_by);

create index if not exists party_invites_created_by_idx
  on public.party_invites (created_by);

create index if not exists party_invites_redeemed_by_idx
  on public.party_invites (redeemed_by)
  where redeemed_by is not null;

-- Invitation digests are deliberately unavailable through PostgREST. Redemption
-- happens only through the rate-limited join_trip RPC.
create policy party_invites_explicit_deny
on public.party_invites for select to authenticated
using (false);

-- Chronicle rows must be reserved through create_photo_upload so their object path,
-- journey membership, uploader and pending state are generated atomically.
revoke insert on public.chronicle_entries from authenticated;
drop policy if exists chronicle_entries_insert_self on public.chronicle_entries;

-- Remove a harmless PL/pgSQL shadowed-variable warning from the already-deployed
-- function. Fresh databases already receive the corrected definition above.
do $migration$
declare
  current_definition text;
  corrected_definition text;
begin
  select pg_get_functiondef(
    'private.create_trip(text,text,text,smallint,smallint,text[],text)'::regprocedure
  ) into current_definition;

  corrected_definition := regexp_replace(
    current_definition,
    E'\\n[[:space:]]*collision_attempt smallint;',
    '',
    'g'
  );

  if corrected_definition <> current_definition then
    execute corrected_definition;
  end if;
end
$migration$;
