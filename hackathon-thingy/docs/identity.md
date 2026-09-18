# SideQuest — Product Identity

> Single source of truth for what SideQuest is, who it's for, what it sounds like,
> and what it looks like. If a design or copy decision contradicts this file,
> this file wins. `design-system/sidequest/MASTER.md` implements this; it does not override it.

---

## The one-liner

**Maps get you there. SideQuest makes it worth the drive.**

## The pitch (30 seconds)

Every navigation app optimises for one thing: arrival time. So we take the fastest
road, and the country we drive through turns into scenery behind glass. The orchard,
the pass, the farmstall with the good pie — all of it just goes past the window.

SideQuest optimises for the opposite. It takes your real route from A to B and finds
the things worth stopping for along it — a viewpoint, a bakery, a bit of local history,
something strange — sized to a detour budget you set. You pick what to do, you do it
together, and you arrive with a scrapbook instead of just an arrival time.

**It's about the journey, not the destination.** That's not a tagline we bolted on;
it's the entire product thesis.

## The name

The *main quest* is getting to your destination. The *side quests* are everything
worth doing on the way. The name already carries the whole idea — lean on it.

---

## Who it's for

Two or more people in a car on a **1–4 hour drive** they've done before or will do
again. Weekend trips, holiday routes, the drive to visit family. Not commuters
(no time, no company) and not epic cross-country expeditions (different problem).

The drive is already happening. SideQuest doesn't create the trip — it rescues the
hours inside it.

**The moment it has to win:** two people in a car with 90 minutes left, one of them
bored, about to open Instagram. SideQuest has to be more interesting than the phone
they're already holding.

---

## The core loop

```
Set the route  →  Get offers  →  Take the detour  →  Capture it  →  Keep it
   A → B          things near      within the         a photo,      the trip
                  the road        detour budget      a moment       journal
```

1. **Set the route.** Origin, destination, how much detour you'll tolerate
   (15 / 30 / 60 min), and what you're into.
2. **Get offers.** Real places near the road, ranked to your interests:
   `scenic` · `food` · `lore` · `curiosity`. Never more than you can act on.
3. **Take the detour.** One person drives, one person decides. The decision is the game.
4. **Capture it.** A photo, a caption, a note. Low effort, in the moment.
5. **Keep it.** It lands in the trip journal — private to the people who were there.

The loop's payoff is **the journal**, not the points. Points are pacing; the journal
is the thing you still have next month.

---

## Roles: why two people

One person is driving and cannot look at a phone. The other can. SideQuest makes that
asymmetry the mechanic instead of a problem:

- **Pilot** — hands on the wheel. Gets glanceable, audio-friendly, low-interaction UI.
  Never asked to read a paragraph or tap a small target.
- **Navigator** — hands free. Gets the real interface: browses offers, makes the call,
  takes the photos, writes the captions.

This is rally-driving language, not fantasy language, and it's load-bearing:
**the Pilot's screen must be safe to glance at at 120km/h.** Treat that as a hard
constraint, not a nice-to-have.

---

## What SideQuest is NOT

- ❌ **Not a navigation app.** We don't do turn-by-turn. We assume Maps is already
  running. Don't build a competing map.
- ❌ **Not a review app.** Not TripAdvisor, not a ratings feed. No stars, no reviews,
  no "top 10 near you".
- ❌ **Not a social network.** The journal is private to the party. No public feed,
  no followers, no share-to-the-world. (The schema enforces this — photos are in a
  private bucket behind RLS. Don't undo that.)
- ❌ **Not a fantasy RPG.** See "Tone" below. This was an earlier costume; it's coming off.
- ❌ **Not for solo drivers.** Two-person co-op is the design centre.

---

## Tone & voice

**Warm, curious, slightly wry. A friend who knows the area and thinks you should pull over.**

Playful but grounded. The game layer is light — it exists to create momentum, not to
build a fictional world. Real place names do the heavy lifting; we don't invent lore.

| Do | Don't |
|---|---|
| "There's an orchard 6 minutes off the road." | "A hidden orchard appears on the quest radar." |
| "Worth the stop. Trust us." | "Mountain mist reveals an old traveler's riddle." |
| "You stopped for the pie. Correct decision." | "Tavern rest complete. Well Rested buff gained." |
| "Small moments, kept." | "The Traveler's Chronicle awaits, adventurer." |

Rules:
- Short sentences. One idea per line.
- Second person. Talk to the people in the car.
- Never narrate as a dungeon master. No "adventurer", "traveler", "thou", "behold".
- Humour is dry and occasional, never zany. No exclamation marks in default copy.
- Real geography over invented flavour, always.

### Vocabulary

**Keep** — reads as travel or plain game language:

| Term | Means |
|---|---|
| Party | The people in the car. (Normal travel English — "a party of four".) |
| Pilot / Navigator | Driver and co-driver. Rally terms. |
| Quest | A suggested stop. The app's namesake. |
| XP | Progress. Universal, not fantasy-specific. |
| Route / Detour / Stop | Plain and correct. Use these constantly. |

**Cut** — inherited fantasy costume, remove on sight:

`tavern` · `riddle` · `buff` · `gold` · `moogle scout` · `adventurer` ·
`realm` · `scroll` · `forge` · `guild` · `dungeon` · anything Tolkien

**Open decisions** (flagged, not yet resolved — see bottom of file):
- **"Chronicle"** → possibly **"Logbook"** or **"The Trip"**. Chronicle is a touch grand
  but it does literally mean travel journal. Leaning keep.
- **"Stamina" / "Rations"** → these are invented RPG stats that map to nothing real.
  Either cut them or re-ground them as **fuel/battery**, **snacks**, and **driver
  alertness** — things actually true about a car trip. Leaning re-ground.

---

## Visual identity

### Principle

**Night drive, warm dashboard light.** Dark, calm, legible in a car at any hour —
with warm gold and parchment so it feels like a trip, not like a developer tool.
Dark mode is the *only* mode; the app ships `userInterfaceStyle: "dark"`.

### Palette

Authoritative source: `src/constants/theme.ts` (`SideQuestColors`).

| Role | Hex | Use |
|---|---|---|
| Void | `#080B12` | App background |
| Ink | `#0C1018` | Tab bar, sunken surfaces |
| Navy | `#111827` | Cards, panels |
| Navy Bright | `#182234` | Raised / selected surfaces |
| Cobalt Dark | `#27405A` | Borders, dividers |
| Cobalt | `#7FA8C9` | Secondary accent, info |
| Emerald | `#75C69D` | Positive, progress, "good to go" |
| Amber | `#DFA45B` | Attention, food & warmth |
| Gold | `#D8B477` | **Primary accent / CTA** |
| Gold Soft | `#F0D7AA` | Active nav, highlights |
| Red | `#D86E78` | Errors, destructive |
| White | `#F5F1E8` | Body text (warm parchment, not pure white) |
| Text Muted | `#A9B0BE` | Secondary text |

Note the white is **parchment `#F5F1E8`**, never `#FFFFFF`. That one choice does a
lot of the warmth — don't "fix" it.

### Retro pixel art — the 20% rule

Pixel art is a **texture, not a theme**. It should feel like a fond reference, not a
commitment to a bit. Hard ceiling: **roughly 20% of any screen's visual weight.**

**Pixel art is allowed for:**
- Quest / place icons (the viewpoint, the bakery, the ruin)
- Badges, XP rewards, achievement moments
- The vehicle marker travelling the route
- Journal stamps and decorative frames
- Empty states and celebration moments
- Loading and transition flourishes

**Pixel art is banned from:**
- Body text and any typography (legibility first, always)
- Form fields, inputs, buttons, navigation chrome
- The map itself
- Anything on the **Pilot's** screen that must be read at a glance while driving
- Anything smaller than 24px where the pixels become mush

Everything the pixel art sits on stays clean, modern, and highly legible. The contrast
between crisp UI and chunky pixel accents *is* the look — if the whole screen is pixel
art, the effect is gone and so is the readability.

### Motion

Purposeful and quick (150–300ms). One thing moves at a time. Celebrate arrivals and
completed quests — those are the emotional beats — and stay still everywhere else.
Respect `prefers-reduced-motion`.

---

## Design constraints that come from the product

1. **Pilot safety.** Anything the driver sees: large type, high contrast, no more than
   one decision, no small tap targets, no reading required.
2. **Offers are scarce.** A journey targets 1–5 quests, default 3. Never show a scrolling
   feed of options — that's a review app, and we're not one. Few, good, decided quickly.
3. **The detour budget is a promise.** If the user says 15 minutes, never offer a
   40-minute detour. The budget is what makes spontaneity feel safe.
4. **Privacy is structural.** The journal is party-only and enforced in the database.
   Never design a public share surface without changing the backend first.
5. **Capture must be one tap.** Every extra step in capturing a moment is a moment lost.

---

## Open decisions

| # | Question | Leaning |
|---|---|---|
| 1 | Is "Chronicle" the right name for the journal, or "Logbook" / "The Trip"? | Keep Chronicle |
| 2 | Cut `stamina`/`rations`, or re-ground them as fuel / snacks / alertness? | Re-ground |
| 3 | Does the party cap stay at 2 (one Pilot, one Navigator, enforced in schema) or open up to back-seat passengers? | Stay at 2 for now |
| 4 | Is there a wordmark / logo, and is it pixel art? (`assets/images/logo-glow.png` exists, unreviewed) | TBD |

---

*Last updated: 2026-09-18*
