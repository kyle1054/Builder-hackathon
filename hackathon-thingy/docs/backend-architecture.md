# SideQuest backend architecture

This backend treats the supplied product scope as domain guidance, not as a schema to copy.

## Boundaries

- **Supabase Auth** identifies every traveler. Profile metadata is display-only and is never used for authorization.
- **Party membership** is the tenant boundary. A user can only read journeys, state, events, quests, and memories belonging to a party they currently belong to.
- **Invite codes** are short-lived join mechanisms. Only a digest is stored, and code redemption runs through a rate-limited transactional RPC. Knowing a room code never grants data access on its own.
- **Journey state** holds the current, frequently updated snapshot used by the HUD.
- **Journey events** are append-only and idempotent. They preserve what happened for replay, recovery, analytics, and Chronicle generation.
- **Quest places** are refreshable provider records. **Journey quests** snapshot every offered stop so an old trip does not change when provider ratings or descriptions refresh.
- **Chronicle photos** use a private Storage bucket. Party members can read them through an authenticated download or short-lived signed URL.

## Authenticated write paths

The mobile client reads party-scoped records directly through RLS. Atomic multi-row operations use narrow Postgres RPC functions. Public wrappers are `security invoker`; privileged implementations remain in the unexposed `private` schema and bind every action to `auth.uid()`.

1. `create_trip` — creates the party, pilot membership, 30-minute hashed invitation, journey, state, event, and ranked quest snapshots transactionally.
2. `join_trip` — rate-limits attempts, locks and redeems the invite atomically, and creates navigator membership.
3. `set_quest_state` — enforces navigator-only transitions and awards XP on completion.
4. `record_journey_event` — deduplicates mobile retries by `client_event_id` and updates `journey_state` transactionally.
5. `create_photo_upload` — reserves an exact private object path tied to the journey, entry, and signed-in uploader.
6. `finalize_photo_upload` — verifies the Storage object exists, awards memory XP once, and appends the Chronicle event.

The client can upload only to the exact path reserved for its pending Chronicle entry. Other party members can read the object, while outsiders cannot read its metadata or bytes. It cannot mutate shared party state directly.

## Authentication

- Email/password sign-up and sign-in use Supabase Auth.
- Anonymous sign-in is intentionally disabled. Demo travelers use confirmed, password-based Auth users so every RLS path matches the production login flow.
- The `auth.users` insert trigger creates a public profile, but editable user metadata is never used for authorization.
- The Expo app uses only the public project URL and publishable key. The secret/service-role key never ships to the client.

## Demo seed

`npm run seed:demo` is idempotent. With the project URL, publishable key, secret key, and a demo password supplied through `SIDEQUEST_*` environment variables, it:

1. creates or refreshes confirmed pilot and navigator Auth users;
2. creates a demo expedition and redeems the navigator invite;
3. reserves, uploads, and finalizes a private journey-scoped photo;
4. verifies that the pilot can read the shared Chronicle entry and create a signed photo URL.

The secret key is needed only by this local seed command and is never saved in the Expo environment.

## Realtime feeds

Clients subscribe only to:

- `journey_state` for vitals and current progress;
- `journey_quests` for offer/accept/complete state;
- `journey_events` for transient co-op activity;
- `chronicle_entries` for newly captured or captioned memories.

Realtime still evaluates RLS. A subscription is not proof that a user may see a row.

## Deliberate security choices

- No public database tables and no anonymous grants.
- No public photo bucket.
- No service-role key in Expo.
- No authorization based on editable user metadata.
- No direct client writes to party membership, invite, vitals, XP, or quest completion.
- Every exposed table has RLS plus explicit grants.
