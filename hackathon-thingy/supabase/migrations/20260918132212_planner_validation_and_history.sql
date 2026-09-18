-- Validate saved plan payloads and retain finished trips for travel history.
create or replace function private.trip_planner(p_action text, p_data jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
 uid uuid := auth.uid(); jid uuid; pid uuid; owner_id uuid; jstatus text;
 details jsonb; result jsonb; code text; target uuid; inv private.plan_invites%rowtype; rev integer;
begin
 if uid is null then raise exception 'Sign in to plan or join a trip.' using errcode='28000'; end if;
 if p_action='list' then
  select coalesce(jsonb_agg(jsonb_build_object('id',j.id,'ownerId',j.created_by,'status',j.status,'details',tp.details,'revision',tp.revision) order by j.created_at desc),'[]'::jsonb) into result
  from public.journeys j join private.trip_plans tp on tp.journey_id=j.id
  where exists(select 1 from public.party_members m where m.party_id=j.party_id and m.user_id=uid and m.left_at is null);
  return result;
 end if;
 if p_action='social' then
  return jsonb_build_object(
   'friends',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'seed',p.avatar_seed)) from private.saved_friends f join public.profiles p on p.id=f.friend_id where f.user_id=uid),'[]'::jsonb),
   'travelers',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'seed',p.avatar_seed)) from public.profiles p where p.id<>uid and exists(select 1 from public.party_members a join public.party_members b on a.party_id=b.party_id where a.user_id=uid and b.user_id=p.id and a.left_at is null and b.left_at is null)),'[]'::jsonb),
   'invitations',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'title',tp.details->>'name','from',p.display_name)) from private.plan_invites i join private.trip_plans tp on tp.journey_id=i.journey_id join public.journeys j on j.id=i.journey_id join public.profiles p on p.id=j.created_by where i.recipient_id=uid and i.revoked_at is null and i.accepted_at is null and i.expires_at>now() and j.status in ('planning','active')),'[]'::jsonb)
  );
 end if;
 if p_action='save_friend' then
  target := (p_data->>'userId')::uuid;
  if target=uid or not exists(select 1 from public.party_members a join public.party_members b on a.party_id=b.party_id where a.user_id=uid and b.user_id=target and a.left_at is null and b.left_at is null) then raise exception 'You can save people you have travelled with.'; end if;
  insert into private.saved_friends values(uid,target) on conflict do nothing;
  return jsonb_build_object('ok',true);
 end if;
 if p_action in ('join','accept') then
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  if (select count(*) from private.invite_attempts where user_id=uid and attempted_at>now()-interval '10 minutes')>=8 then
   return jsonb_build_object('error','Too many attempts. Try again in ten minutes.');
  end if;
  if p_action='join' then
   code := upper(regexp_replace(coalesce(p_data->>'code',''),'[^a-zA-Z0-9]','','g'));
   select * into inv from private.plan_invites where code_digest=extensions.digest(code,'sha256') and recipient_id is null and revoked_at is null and expires_at>now() for update;
  else
   select * into inv from private.plan_invites where id=(p_data->>'inviteId')::uuid and recipient_id=uid and revoked_at is null and expires_at>now() for update;
  end if;
  if inv.id is null then
   insert into private.invite_attempts(user_id,succeeded) values(uid,false);
   return jsonb_build_object('error','This invitation is invalid or expired. Ask the organiser for a new one.');
  end if;
  select id,party_id,status into jid,pid,jstatus from public.journeys where id=inv.journey_id for update;
  if jstatus not in ('planning','active') then return jsonb_build_object('error','This trip is no longer accepting members.'); end if;
  if not exists(select 1 from public.party_members where party_id=pid and user_id=uid and left_at is null) then
   if (select count(*) from public.party_members where party_id=pid and left_at is null)>=12 then return jsonb_build_object('error','This trip already has 12 members.'); end if;
   insert into public.party_members(party_id,user_id,role,display_name) select pid,uid,'passenger',display_name from public.profiles where id=uid
   on conflict(party_id,user_id) do update set left_at=null,joined_at=now(),role='passenger';
  end if;
  if inv.recipient_id is not null then update private.plan_invites set accepted_at=now() where id=inv.id; end if;
  insert into private.invite_attempts(user_id,succeeded) values(uid,true);
  return jsonb_build_object('id',jid);
 end if;
 if p_action in ('create','update') then
  details := p_data->'details';
  if details is null or jsonb_typeof(details)<>'object' or octet_length(details::text)>50000 then raise exception 'Invalid trip plan.'; end if;
  if jsonb_typeof(details->'interests') is distinct from 'array' or jsonb_typeof(details->'activities') is distinct from 'array' then raise exception 'Invalid interests or activities.'; end if;
  if exists(select 1 from jsonb_array_elements_text(details->'interests') interest where interest not in ('Scenic','Food','Local lore','Curiosity')) then raise exception 'Choose a valid interest.'; end if;
  if exists(select 1 from jsonb_array_elements(jsonb_build_array(details->'origin',details->'destination')) place where
    coalesce((place->>'latitude')::numeric,999) not between -90 and 90 or coalesce((place->>'longitude')::numeric,999) not between -180 and 180 or coalesce((place->>'span')::numeric,0)<=0) then raise exception 'Choose valid map locations.'; end if;
  if exists(select 1 from jsonb_array_elements(details->'activities') activity where
    coalesce(length(trim(activity->>'title')),0) not between 1 and 160 or
    coalesce(length(activity->>'description'),0)>4000 or
    jsonb_typeof(activity->'included') is distinct from 'boolean' or
    coalesce((activity->>'duration')::numeric,0) not between 1 and 1440 or
    coalesce((activity#>>'{place,latitude}')::numeric,999) not between -90 and 90 or
    coalesce((activity#>>'{place,longitude}')::numeric,999) not between -180 and 180) then raise exception 'Check your activity names, durations and locations.'; end if;
  if coalesce(length(trim(details->>'name')),0) not between 1 and 60
   or coalesce(length(details#>>'{origin,name}'),0) not between 1 and 160
   or coalesce(length(details#>>'{destination,name}'),0) not between 1 and 160
   or coalesce(details->>'pace','') not in ('relaxed','balanced','packed')
   or coalesce(jsonb_array_length(details->'interests'),0) not between 1 and 4
   or coalesce(jsonb_array_length(details->'activities'),0)>20 then raise exception 'Please complete the trip details.'; end if;
  if coalesce(details->>'startDate','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(details->>'endDate','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Choose valid travel dates.'; end if;
  if (details->>'endDate')::date < (details->>'startDate')::date then raise exception 'Return date must be after departure.'; end if;
  if p_action='create' then
   insert into public.parties(created_by,name) values(uid,trim(details->>'name')) returning id into pid;
   insert into public.party_members(party_id,user_id,role,display_name) select pid,uid,'pilot',display_name from public.profiles where id=uid;
   insert into public.journeys(party_id,created_by,origin_name,destination_name,status) values(pid,uid,details#>>'{origin,name}',details#>>'{destination,name}','planning') returning id into jid;
   insert into public.journey_state(journey_id) values(jid);
   insert into private.trip_plans(journey_id,details) values(jid,details);
   return jsonb_build_object('id',jid);
  end if;
 end if;
 jid := (p_data->>'id')::uuid;
 select j.party_id,j.created_by,j.status,tp.revision into pid,owner_id,jstatus,rev from public.journeys j join private.trip_plans tp on tp.journey_id=j.id where j.id=jid for update of j;
 if pid is null or not exists(select 1 from public.party_members where party_id=pid and user_id=uid and left_at is null) then raise exception 'Trip not found or you are not a member.' using errcode='42501'; end if;
 if p_action='detail' then
  select jsonb_build_object('id',j.id,'ownerId',j.created_by,'status',j.status,'details',tp.details,'revision',tp.revision,
   'members',(select coalesce(jsonb_agg(jsonb_build_object('id',m.user_id,'name',m.display_name,'seed',p.avatar_seed,'role',m.role) order by m.joined_at),'[]'::jsonb) from public.party_members m join public.profiles p on p.id=m.user_id where m.party_id=pid and m.left_at is null),
   'pending',(select coalesce(jsonb_agg(i.recipient_id),'[]'::jsonb) from private.plan_invites i where i.journey_id=jid and i.recipient_id is not null and i.accepted_at is null and i.revoked_at is null and i.expires_at>now())) into result
  from public.journeys j join private.trip_plans tp on tp.journey_id=j.id where j.id=jid;
  return result;
 end if;
 if owner_id<>uid then raise exception 'Only the organiser can change or invite people to this trip.' using errcode='42501'; end if;
 if p_action='update' then
  if jstatus<>'planning' then raise exception 'Only drafts can be edited.'; end if;
  if (p_data->>'revision')::integer is distinct from rev then raise exception 'This plan changed on another device. Reopen it before editing.'; end if;
  update private.trip_plans set details=p_data->'details',revision=revision+1 where journey_id=jid;
  update public.journeys set origin_name=details#>>'{origin,name}',destination_name=details#>>'{destination,name}' where id=jid;
  update public.parties set name=details->>'name' where id=pid;
  return jsonb_build_object('id',jid);
 elsif p_action='start' then
  if jstatus='active' then return jsonb_build_object('id',jid); end if;
  if jstatus<>'planning' then raise exception 'This trip cannot be started.'; end if;
  update public.journeys set status='active',started_at=now() where id=jid;
  update public.parties set status='active' where id=pid;
  return jsonb_build_object('id',jid);
 elsif p_action='complete' then
  if jstatus='completed' then return jsonb_build_object('id',jid); end if;
  if jstatus not in ('active','paused') then raise exception 'Start the trip before finishing it.'; end if;
  update public.journeys set status='completed',completed_at=now() where id=jid;
  update public.parties set status='archived' where id=pid;
  update private.plan_invites set revoked_at=now() where journey_id=jid and revoked_at is null;
  return jsonb_build_object('id',jid);
 elsif p_action='invite' then
  if jstatus not in ('planning','active') then raise exception 'This trip is closed.'; end if;
  update private.plan_invites set revoked_at=now() where journey_id=jid and recipient_id is null and revoked_at is null;
  code := upper(encode(extensions.gen_random_bytes(6),'hex'));
  insert into private.plan_invites(journey_id,code_digest) values(jid,extensions.digest(code,'sha256')) returning * into inv;
  return jsonb_build_object('code',code,'expiresAt',inv.expires_at);
 elsif p_action='invite_friend' then
  target := (p_data->>'userId')::uuid;
  if jstatus not in ('planning','active') then raise exception 'This trip is closed.'; end if;
  if not exists(select 1 from private.saved_friends where user_id=uid and friend_id=target) then raise exception 'Save this friend before inviting them.'; end if;
  if exists(select 1 from public.party_members where party_id=pid and user_id=target and left_at is null) then return jsonb_build_object('ok',true); end if;
  if not exists(select 1 from private.plan_invites where journey_id=jid and recipient_id=target and revoked_at is null and accepted_at is null and expires_at>now()) then
   insert into private.plan_invites(journey_id,recipient_id) values(jid,target);
  end if;
  return jsonb_build_object('ok',true);
 end if;
 raise exception 'Unknown planning action.';
end;
$$;
