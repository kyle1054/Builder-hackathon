# Trip planning and shared albums

The Journey tab opens saved drafts and active trips. Add trip starts with Stellenbosch and Tierfontein Farm (Erf 52, Baardskeerdersbos, 7220). Dates and interests produce an editable draft. Driving distance, duration, mapped place availability and stop duration determine suggestions and pace. Saved locations or a named latitude/longitude can be selected. Manual stops can be added and edited. This is not a general geocoding or booking engine.

Drafts, membership and invitations are persisted in Supabase through `trip_planner`. Authenticated clients can list/read only their own trips. Only the organiser may edit, start, finish or invite. Revision checks reject stale edits. Starting locks the plan. Finishing archives the group and revokes invitations; its album remains accessible to its members.

Invitation codes are 48-bit random values stored as digests, rate-limited on redemption, reusable by up to 12 members, and valid for seven days. Generating another code invalidates the previous code. QR codes are rendered locally and encode the same join link. A logged-out recipient returns to joining after authentication. Existing travel companions can be saved as friends and receive an in-app invitation, without being silently joined.

Set `EXPO_PUBLIC_APP_URL` to the deployed web origin for externally shareable web links. During local development, web links use Expo's LAN host when available. Devices must be able to reach that host; invite codes also work directly from any running instance of the app. Native builds use Expo Linking when no web origin is configured.

The shared album uses private `chronicle-photos` Storage objects and expiring signed URLs. History thumbnails come from actual party uploads, never generated scenery. Missing photos use an explicit empty/unavailable state. Uploads use Expo ImagePicker and the existing reserve/upload/finalize RPC workflow; JPEG, PNG, WebP and HEIC up to 15 MB are accepted. Existing seed data includes a one-pixel test photo, intentionally shown as unavailable rather than a landscape.

Party is now a simple friends/invitations/groups screen. Chronicle is a navigable trip history with status tabs, albums, photo viewer, itinerary and members. The generic privacy pills, fictional stamina/gold panels and bonus banners were removed. Shared buttons have consistent outlined/primary variants, compact actions, loading/disabled states and keyboard focus indication. Mapbox Outdoors is restyled at runtime with sage terrain, cream roads, blue water and gold pins; attribution remains visible.

## Validation

- `npx tsc --noEmit`, `npm run lint`, web and iOS bundle exports.
- `supabase/tests/database/trip_planner.test.sql`: transactional authenticated checks for draft/edit/revision conflicts, outsider isolation, repeat/multi-member join, organiser-only writes, saved friends/inbox/acceptance, start locking and invitation rotation.
- Two separate Supabase Auth clients verified create/join, private photo upload/read and shared start/completion state. Temporary records and Storage object were removed afterwards.
- Browser checks cover route generation, saved draft, map style, invitation QR, trip history and compact phone layouts. Native packages were bundled; physical-device camera roll/deep-link handling is not claimed as tested.

The progress display starts at zero when a real trip starts. Live GPS progress is a separate integration. The four-person animated example remains clearly labelled as a demo on Journey.

## Route planner and light theme

Light is the default across auth, tabs and shared screens: off-white canvas, white cards, forest text, sage selection and gold actions. No background gradients. Web dates use React DayPicker, the calendar primitive used by shadcn; native dates retain the platform picker. Location selection opens a searchable dialog. Review shows compact expandable stop rows.

Mapbox Directions supplies driving geometry, kilometres and minutes. OpenStreetMap Overpass supplies actual mapped POIs, filtered within 2 km of route segments and sorted by progress. The planner budgets 35% of driving duration for interest stops (up to 120 minutes), spaces them by at least 20 km and looks for breaks around two-hour driving intervals. These are product heuristics, not guaranteed opening/access data. Fuel stations are optional suggestions only; no fuel-level assumption is made. Candidates use geographic proximity, not verified road detour limits. Selected stops are routed through Mapbox for an updated driving estimate, with dwell time shown separately.

The map shows A/B endpoints, numbered stops and the road route; expanded pins show place names. Mapbox/OSM attribution is retained. Stop lookup has a timeout, session caching and an explicit retry action. Public Overpass succeeded during testing but also timed out; production reliability will need a managed POI provider or a hosted search service. Failures show unavailable search, never invented places.

`node --experimental-strip-types tests/route-planning.test.mjs` checks route projection, deterministic selection, optional fuel, short routes and missing break locations.

## Ready-filled trip flow and sample history

The homepage no longer mounts the standalone live example. Add trip starts with a ready-filled Stellenbosch–Tierfontein draft, three editable illustrative activities, today's dates and default interests. Review continues immediately without calling place search; fresh suggestions remain an explicit action. Changing either endpoint switches back to route generation. Saving still creates a real persisted draft, followed by invitations and a separate Start trip action.

Two local fictional completed trips populate the homepage and Chronicle. Their sample artwork, members, memories and itinerary are browsable via `/history?id=sample-overberg` and `/history?id=sample-elgin`. They are labelled demo history and never written into real group albums or presented as actual member uploads. Real completed trips continue using uploaded member photos.
