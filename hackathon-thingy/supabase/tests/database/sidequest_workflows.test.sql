begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'pilot@sidequest.invalid',
    extensions.crypt('not-a-real-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Pilot"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'navigator@sidequest.invalid',
    extensions.crypt('not-a-real-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Navigator"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'outsider@sidequest.invalid',
    extensions.crypt('not-a-real-password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Outsider"}',
    now(),
    now()
  );

insert into public.parties (id, created_by, name)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'Test Party');

insert into public.party_members (party_id, user_id, role, display_name)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  'pilot',
  'Pilot'
);

insert into public.party_invites (
  party_id,
  created_by,
  code_digest,
  intended_role,
  expires_at
)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  extensions.digest('ABCD-1234', 'sha256'),
  'navigator',
  now() + interval '30 minutes'
);

insert into public.journeys (
  id,
  party_id,
  created_by,
  origin_name,
  destination_name,
  status,
  started_at
)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  'Cape Town',
  'Greyton',
  'active',
  now()
);

insert into public.journey_state (journey_id)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

insert into public.journey_quests (
  id,
  journey_id,
  rank,
  title_snapshot,
  category_snapshot,
  location_snapshot,
  added_detour_mins,
  score
)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  1,
  'Test Quest',
  'scenic',
  extensions.st_setsrid(extensions.st_makepoint(19.0, -34.0), 4326)::extensions.geography,
  5,
  1.25
);

select ok(
  (select count(*) = 10 from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity),
  'all ten public tables have RLS enabled'
);

select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*) from public.parties), 1::bigint, 'pilot can read their party');
select is((select count(*) from public.journeys), 1::bigint, 'pilot can read their journey');
select is((select count(*) from public.party_members), 1::bigint, 'pilot can read party membership');

reset role;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*) from public.parties), 0::bigint, 'outsider cannot read the party');
select is((select count(*) from public.journeys), 0::bigint, 'outsider cannot read the journey');
select throws_ok(
  $$select public.record_journey_event(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    gen_random_uuid(),
    'position_sampled',
    '{"longitude":19,"latitude":-34}'::jsonb,
    now()
  )$$,
  '42501',
  'Not a member of this journey',
  'outsider cannot write journey events'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$select public.join_trip('ABCD-1234', 'Navigator')$$,
  'navigator can redeem the invite'
);
select is((select count(*) from public.parties), 1::bigint, 'navigator can read the joined party');
select is((select count(*) from public.party_members), 2::bigint, 'navigator sees both party members');
select lives_ok(
  $$select public.set_quest_state('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'accepted', gen_random_uuid())$$,
  'navigator can accept a quest'
);
select lives_ok(
  $$select public.create_photo_upload(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'spontaneous',
    null,
    'jpg',
    'Test Lookout',
    19.0,
    -34.0,
    300,
    '{"stamina":72}'::jsonb,
    now()
  )$$,
  'navigator can reserve a trip-scoped photo upload'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*) from public.chronicle_entries), 1::bigint, 'pilot can read navigator Chronicle metadata');
select throws_ok(
  $$select public.set_quest_state('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'skipped', gen_random_uuid())$$,
  '42501',
  'Only the navigator can perform this quest action',
  'pilot cannot perform navigator-only quest actions'
);

reset role;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.chronicle_entries), 0::bigint, 'outsider cannot read Chronicle metadata');

reset role;
select * from finish();
rollback;
