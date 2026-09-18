# Getting the Lock Screen widget onto a real iPhone

Status on this Mac (checked 18 Sep 2026):

| Requirement | State |
|---|---|
| Expo config + widget extension | ✅ validated — `ios/ExpoWidgetsTarget/JourneyWidget.swift` generates correctly |
| `NSSupportsLiveActivities` | ✅ set in `ios/SideQuest/Info.plist` |
| EAS account | ✅ logged in as `snoopdobby` |
| Apple Developer Program | ❌ none — **this rules out EAS device builds** |
| Xcode | ❌ not installed (Command Line Tools only) |
| CocoaPods | ❌ not installed |
| Homebrew | ❌ not installed |

## Why EAS can't do it

Installing a custom native app on a physical iPhone requires an Apple-issued
provisioning profile. Ad-hoc and TestFlight distribution both require the
**Apple Developer Program ($99/yr)**. This is Apple's restriction, not Expo's —
there is no way around it from the cloud.

Without a paid account the only route is **local signing with a free Apple ID**,
which Xcode can do (7-day certificates) but which requires Xcode on this machine.

## The route that works: Xcode + cable

**Heads up on bandwidth.** Xcode is ~15 GB. This machine is currently on an
iPhone personal hotspot (`172.20.10.x`). Do this on real Wi-Fi.

1. **Xcode** — install from the Mac App Store (~15 GB, 30–60 min+), then:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -runFirstLaunch
   ```

2. **CocoaPods** — the system Ruby here is 2.6, too old for current CocoaPods,
   so install Homebrew first:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   brew install cocoapods
   ```

3. **Signing** — open the project and set a team on **both** targets:
   ```bash
   open ios/SideQuest.xcodeproj
   ```
   In *Signing & Capabilities*, set Team to your personal (free) Apple ID for:
   - the `SideQuest` app target
   - the `ExpoWidgetsTarget` widget extension ← **easy to miss; the build fails without it**

4. **Build to the phone** — plug in via cable, unlock it, tap *Trust*:
   ```bash
   npx expo run:ios --device
   ```

5. **Trust the certificate on the phone** — Settings → General → VPN & Device
   Management → your Apple ID → Trust.

6. **Add the surfaces**
   - *Live Activity*: starts by itself once a trip is running (needs the
     `useJourneySurfaces` hook wired — see `docs/lock-screen-widget.md`).
   - *Widget*: long-press the Lock Screen → Customise → add a SideQuest
     accessory; or long-press the Home Screen → + → SideQuest.

### Free-account caveats
- The app expires after **7 days**, then needs rebuilding.
- Certificates are per-device; each phone must be plugged in.

## Faster alternative: the Simulator

Same Xcode download, but no cable, no Apple ID, no 7-day expiry — and Live
Activities do render on the Lock Screen in the Simulator, which is enough for a
demo screen-recording.

```bash
npx expo run:ios          # boots a simulator
```

## What works **today**, with no Xcode

The **side quest notification** half runs in Expo Go, because local
notifications are supported there. Wire up `useJourneySurfaces` and the banner
fires on your phone through the existing QR-code flow. Only the Lock Screen
widget and Dynamic Island need the native build.
