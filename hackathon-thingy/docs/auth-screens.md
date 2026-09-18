# Welcome and authentication screens

The welcome, sign-in, create-account and reset-password screens use reusable React Native primitives with a flat off-white/forest/gold palette. They adapt the compact forms, outlined provider buttons and split-panel composition from shadcn login blocks without importing DOM-only components into Expo. There are no gradients in the authentication components.

Google and Apple are explicitly **demo buttons**, per the product request. Google signs into the existing Pilot sample account; Apple signs into the Navigator sample account. A visible note explains this. They do not contact Google or Apple, request provider permissions or connect a real social identity. Existing email/password authentication remains connected to Supabase.

Inputs include autofill semantics, visible focus, show/hide password, submit-from-keyboard support and inline validation. All auth actions expose loading/disabled states. Email comes first, followed by a compact account-switch link and Google/Apple demo buttons at the bottom. Buttons and fields use rounded pill shapes; a circular back control sits in the header. Switching screens resets scroll position. Wide screens show the sage travel panel next to the form; phones show it only on welcome.

Email confirmation and recovery use PKCE with an explicit `/auth-callback` handler. Recovery continues to `/reset-password`; confirmation restores a pending trip invitation when it was started on the same device. Callback errors offer a way back to sign-in. Callback redirect URLs for localhost, the current LAN development host and the `sidequest` scheme were added to the hosted allowlist; other hosted auth settings were preserved. Expired or cross-browser PKCE links require restarting on the original device. Native email callback handling needs an app build registered for the SideQuest URL scheme.

## Asset sources

- Google mark: https://developers.google.com/identity/images/g-logo.png
- Apple mark: https://cdn.simpleicons.org/apple/FFFFFF (Simple Icons' Apple brand silhouette)
- Existing bundled DiceBear voxel travellers remain the welcome illustration.
- Layout reference: https://ui.shadcn.com/blocks/login

Live Google/Apple OAuth is deliberately not enabled. Production social login will require provider credentials and a real OAuth/native identity flow; the demo buttons must be replaced at that point.
