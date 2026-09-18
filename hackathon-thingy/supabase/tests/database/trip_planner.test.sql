begin;
-- Isolated transactional users; no test records survive rollback.
insert into auth.users(id,instance_id,aud,role,email,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('91000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','planner-test-'||i||'@sidequest.invalid','{"provider":"email"}'::jsonb,jsonb_build_object('display_name','Planner test '||i),now(),now() from generate_series(1,4) i;
set local role authenticated;
do $$
declare t jsonb; d jsonb; code text; replacement text; jid uuid; jid2 uuid; res jsonb; invitation uuid;
begin
 perform set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000001',true);
 d := '{"name":"Planner integration test","origin":{"name":"Stellenbosch","latitude":-33.9367,"longitude":18.8614,"span":0.03},"destination":{"name":"Tierfontein Farm","latitude":-34.56736,"longitude":19.60637,"span":0.03},"startDate":"2026-10-01","endDate":"2026-10-03","pace":"balanced","interests":["Food"],"activities":[],"description":"Test"}'::jsonb;
 t:=public.trip_planner('create',jsonb_build_object('details',d)); jid:=(t->>'id')::uuid;
 t:=public.trip_planner('detail',jsonb_build_object('id',jid));
 if t->>'status'<>'planning' then raise exception 'Draft started prematurely';end if;
 perform public.trip_planner('update',jsonb_build_object('id',jid,'revision',1,'details',d||'{"name":"Edited draft"}'::jsonb));
 begin perform public.trip_planner('update',jsonb_build_object('id',jid,'revision',1,'details',d));raise exception 'Stale update was accepted';exception when raise_exception then if SQLERRM='Stale update was accepted' then raise;end if;end;
 code:=public.trip_planner('invite',jsonb_build_object('id',jid))->>'code';
 perform set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000002',true);
 if jsonb_array_length(public.trip_planner('list'))<>0 then raise exception 'Outsider can list trip';end if;
 begin perform public.trip_planner('detail',jsonb_build_object('id',jid));raise exception 'Outsider can read trip';exception when insufficient_privilege then null;end;
 t:=public.trip_planner('join',jsonb_build_object('code',code));if t->>'id'<>jid::text then raise exception 'Join failed: %',t;end if;
 t:=public.trip_planner('join',jsonb_build_object('code',code));if t->>'id'<>jid::text then raise exception 'Idempotent join failed';end if;
 begin perform public.trip_planner('start',jsonb_build_object('id',jid));raise exception 'Member can start trip';exception when insufficient_privilege then null;end;
 begin perform public.trip_planner('update',jsonb_build_object('id',jid,'revision',2,'details',d));raise exception 'Member can edit trip';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000003',true);
 t:=public.trip_planner('join',jsonb_build_object('code',code));if t->>'id'<>jid::text then raise exception 'Third member join failed';end if;
 perform set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000001',true);
 t:=public.trip_planner('detail',jsonb_build_object('id',jid));if jsonb_array_length(t->'members')<>3 then raise exception 'Shared membership failed';end if;
 perform public.trip_planner('save_friend',jsonb_build_object('userId','91000000-0000-4000-8000-000000000002'));
 t:=public.trip_planner('create',jsonb_build_object('details',d));jid2:=(t->>'id')::uuid;
 perform public.trip_planner('invite_friend',jsonb_build_object('id',jid2,'userId','91000000-0000-4000-8000-000000000002'));
 perform set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000002',true);
 t:=public.trip_planner('social');invitation:=(t#>>'{invitations,0,id}')::uuid;
 if invitation is null then raise exception 'Friend invitation not visible';end if;
 t:=public.trip_planner('accept',jsonb_build_object('inviteId',invitation));if t->>'id'<>jid2::text then raise exception 'Friend acceptance failed';end if;
 perform set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000001',true);
 replacement:=public.trip_planner('invite',jsonb_build_object('id',jid))->>'code';
 perform public.trip_planner('start',jsonb_build_object('id',jid));
 t:=public.trip_planner('detail',jsonb_build_object('id',jid));if t->>'status'<>'active' then raise exception 'Start failed';end if;
 begin perform public.trip_planner('update',jsonb_build_object('id',jid,'revision',2,'details',d));raise exception 'Active trip edited';exception when raise_exception then if SQLERRM='Active trip edited' then raise;end if;end;
 perform set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000004',true);
 t:=public.trip_planner('join',jsonb_build_object('code',code));if t->>'error' is null then raise exception 'Revoked code accepted';end if;
 t:=public.trip_planner('join',jsonb_build_object('code',replacement));if t->>'id'<>jid::text then raise exception 'Fourth member join failed';end if;
 raise notice 'PASS: draft/edit/revision, outsider isolation, multi-member/repeat join, owner permissions, saved friends/inbox/acceptance, start locking, invite rotation';
end;
$$;
rollback;
