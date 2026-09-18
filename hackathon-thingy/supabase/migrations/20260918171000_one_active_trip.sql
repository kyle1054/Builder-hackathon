-- Retire the old hidden demo journey when its pilot has a real planner trip.
-- Preserve its data as a draft; do not fabricate a completed journey.
update public.journeys old set status='planning', started_at=null
from public.parties p
where old.party_id=p.id and p.name like 'SideQuest Demo%'
and old.status='active' and not exists(select 1 from private.trip_plans tp where tp.journey_id=old.id)
and exists(select 1 from public.journeys actual join private.trip_plans tp on tp.journey_id=actual.id where actual.created_by=old.created_by and actual.status='active');

create table private.active_trip_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 journey_id uuid not null references public.journeys(id) on delete cascade
);
create index active_trip_members_journey_idx on private.active_trip_members(journey_id);
alter table private.active_trip_members enable row level security;
revoke all on private.active_trip_members from public, anon, authenticated;
insert into private.active_trip_members(user_id,journey_id)
select m.user_id,j.id from public.journeys j join public.party_members m on m.party_id=j.party_id
where j.status in ('active','paused') and m.left_at is null;

create function private.sync_active_trip_members() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 delete from private.active_trip_members where journey_id=new.id;
 if new.status in ('active','paused') then
  begin
   insert into private.active_trip_members(user_id,journey_id)
   select user_id,new.id from public.party_members where party_id=new.party_id and left_at is null order by user_id;
  exception when unique_violation then
   raise exception 'A traveller is already on another trip. Finish that trip before starting this one.' using errcode='23505';
  end;
 end if;
 return new;
end $$;
revoke all on function private.sync_active_trip_members() from public, anon, authenticated;
create trigger journeys_one_active_trip after insert or update of status,party_id on public.journeys for each row execute function private.sync_active_trip_members();

create function private.sync_active_trip_join() returns trigger
language plpgsql security definer set search_path='' as $$
declare j record;
begin
 if tg_op in ('UPDATE','DELETE') then
  delete from private.active_trip_members a using public.journeys t where a.journey_id=t.id and t.party_id=old.party_id and a.user_id=old.user_id;
 end if;
 if tg_op <> 'DELETE' and new.left_at is null then
  for j in select id,status from public.journeys where party_id=new.party_id order by id for update loop
   if j.status in ('active','paused') then
    begin
     insert into private.active_trip_members(user_id,journey_id) values(new.user_id,j.id);
    exception when unique_violation then
     raise exception 'You are already on another trip. Finish it before joining this active trip.' using errcode='23505';
    end;
   end if;
  end loop;
 end if;
 return null;
end $$;
revoke all on function private.sync_active_trip_join() from public, anon, authenticated;
create trigger members_one_active_trip after insert or update of left_at,party_id,user_id or delete on public.party_members for each row execute function private.sync_active_trip_join();
