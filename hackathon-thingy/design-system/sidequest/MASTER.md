# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.
>
> **IDENTITY:** `docs/identity.md` defines what SideQuest is, who it's for, how it sounds
> and how it should feel. That file **overrides this one** on any conflict. Read it first.

---

**Project:** SideQuest
**Generated:** 2026-09-18 14:08:15
**Revised:** 2026-09-18 — globals realigned to the real product identity
**Category:** Travel / Co-op road trip companion (React Native + Expo, mobile-first)

---

## Global Rules

### Platform note

This is an **Expo / React Native** app, not a website. CSS below is specification,
not shippable code — translate to `StyleSheet` / RN props. There is no hover state on
touch; use pressed states. There is no `cursor: pointer`.

**Dark mode is the only mode.** The app ships `userInterfaceStyle: "dark"`. Do not
build a light theme.

### Color Palette

Authoritative source in code: `src/constants/theme.ts` → `SideQuestColors`.

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary / Accent (CTA) | `#D8B477` | `--color-primary` |
| On Primary | `#080B12` | `--color-on-primary` |
| Primary Soft (active nav, highlight) | `#F0D7AA` | `--color-primary-soft` |
| Background (void) | `#080B12` | `--color-background` |
| Surface Sunken (ink) | `#0C1018` | `--color-surface-sunken` |
| Surface (navy) | `#111827` | `--color-surface` |
| Surface Raised (navy bright) | `#182234` | `--color-surface-raised` |
| Foreground (parchment) | `#F5F1E8` | `--color-foreground` |
| Muted Foreground | `#A9B0BE` | `--color-muted-foreground` |
| Border | `#27405A` | `--color-border` |
| Secondary / Info (cobalt) | `#7FA8C9` | `--color-secondary` |
| Success (emerald) | `#75C69D` | `--color-success` |
| Warning / Warmth (amber) | `#DFA45B` | `--color-warning` |
| Destructive | `#D86E78` | `--color-destructive` |
| Ring (focus) | `#D8B477` | `--color-ring` |

**Color Notes:** Night drive, warm dashboard light. Deep navy void with gold and
parchment. Foreground white is **parchment `#F5F1E8`, never `#FFFFFF`** — that warmth
is deliberate, do not "correct" it.

### Typography

- **Heading Font:** system sans (SF Pro on iOS, Roboto on Android) — weight 650–700
- **Body Font:** system sans — weight 400–500
- **Mood:** warm, cinematic, unhurried, nostalgic, legible-in-a-car, quietly playful
- **Accent:** a pixel/bitmap face is permitted **for numerals, badges and short labels
  only** (see the 20% rule). Never for body copy.

System fonts are intentional: they render instantly, respect the user's accessibility
text size, and keep the pixel accents feeling like a deliberate contrast rather than
one more novelty typeface.

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps, inline spacing |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Section padding |
| `--space-xl` | `32px` | Large gaps |
| `--space-2xl` | `48px` | Section margins |
| `--space-3xl` | `64px` | Hero padding |

### Elevation

On a near-black background, drop shadows barely read. **Elevate with surface colour
and border first, shadow second.**

| Level | Technique | Usage |
|-------|-----------|-------|
| `flat` | `#111827` surface, no border | Background panels |
| `raised` | `#111827` + `1px #27405A` border | Cards, list items |
| `active` | `#182234` + `1px` gold-tinted border | Selected / focused card |
| `overlay` | `#182234` + border + `0 10px 30px rgba(0,0,0,0.5)` | Modals, sheets |

Glow is the preferred emphasis on dark: a soft gold outer glow on a CTA reads far
better than a black shadow.

### Pixel Art — the 20% rule

Pixel art is a **texture, not a theme**. Hard ceiling: ~20% of any screen's visual weight.

**Allowed:** quest/place icons, badges, XP rewards, the vehicle marker on the route,
journal stamps and frames, empty states, celebration and transition moments.

**Banned:** body text, form fields, buttons, navigation chrome, the map itself,
anything on the Pilot's screen, anything under 24px.

Render pixel assets at integer scales with nearest-neighbour filtering
(`resizeMode` + no smoothing). Blurry pixel art is worse than none.

---

## Component Specs

> Structure and properties below are unchanged from the original generated system.
> Only the colour values have been corrected to the real palette.

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #D8B477;
  color: #080B12;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
}

.btn-primary:active {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #F0D7AA;
  border: 1px solid #27405A;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
}
```

Minimum touch target **44×44pt**. On any Pilot-facing surface, minimum **56pt** height
and 18px+ label.

### Cards

```css
.card {
  background: #111827;
  border: 1px solid #27405A;
  border-radius: 12px;
  padding: 24px;
  transition: all 200ms ease;
}

.card:active {
  background: #182234;
  border-color: #D8B477;
}
```

### Inputs

```css
.input {
  background: #0C1018;
  color: #F5F1E8;
  padding: 12px 16px;
  border: 1px solid #27405A;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #D8B477;
  outline: none;
  box-shadow: 0 0 0 3px rgba(216, 180, 119, 0.25);
}
```

### Modals / Sheets

Prefer a **bottom sheet** over a centred modal — one-handed reach matters in a car.

```css
.modal-overlay {
  background: rgba(8, 11, 18, 0.72);
  backdrop-filter: blur(4px);
}

.modal {
  background: #182234;
  border: 1px solid #27405A;
  border-radius: 16px 16px 0 0;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  width: 100%;
}
```

---

## Style Guidelines

**Style:** Warm dark UI with retro pixel accents

**Keywords:** Night drive, dashboard glow, parchment and gold, calm, legible, tactile,
chunky pixel highlights against crisp modern chrome

**Best For:** Mobile travel companions, co-op experiences, journaling, glanceable in-car UI

**Key Effects:** Surface-and-border elevation, soft gold glow on emphasis, nearest-neighbour
pixel icons, restrained purposeful motion

### Screen Pattern

**Pattern Name:** Glanceable HUD + decisive offer

- **Strategy:** The current state of the trip is always readable in under a second.
  Decisions arrive as few, clear offers — never as a scrolling feed.
- **CTA Placement:** One primary action, bottom, thumb-reachable. Never two competing golds.
- **Section Order:** 1. Where you are / progress, 2. The live decision (if any),
  3. Party state, 4. What you've collected so far.

---

## Anti-Patterns (Do NOT Use)

- ❌ **Light mode** — the app is dark-only by design
- ❌ **Pink, pure white `#FFFFFF`, or generic SaaS grey** — off-identity
- ❌ **Pixel art above ~20%** of a screen, or in text, inputs, or Pilot-facing UI
- ❌ **Fantasy-RPG copy** — no tavern, riddle, buff, gold, adventurer (see `docs/identity.md`)
- ❌ **Scrolling feeds of places** — we are not a review app
- ❌ **Turn-by-turn navigation UI** — we are not a map
- ❌ **Public share surfaces** — the journal is party-private and enforced in the DB
- ❌ **Emojis as icons** — use SF Symbols / a consistent set, or pixel icons
- ❌ **Small tap targets** (< 44pt, < 56pt for Pilot)
- ❌ **Layout-shifting animations**
- ❌ **Low contrast text** — 4.5:1 minimum on dark
- ❌ **Instant state changes** — always transition (150–300ms)
- ❌ **Invisible focus/pressed states**

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] Colours come from `SideQuestColors` in `src/constants/theme.ts` — no hardcoded hex
- [ ] No pure `#FFFFFF`; parchment `#F5F1E8` for foreground
- [ ] Pixel art ≤ ~20% of the screen, integer-scaled, none in text or inputs
- [ ] Copy passes the `docs/identity.md` voice table — no fantasy-RPG language
- [ ] Pilot-facing surfaces: 56pt+ targets, 18px+ text, one decision max
- [ ] Text contrast ≥ 4.5:1 against the dark surface it sits on
- [ ] Pressed states on every touchable, with a 150–300ms transition
- [ ] `prefers-reduced-motion` / `AccessibilityInfo.isReduceMotionEnabled` respected
- [ ] Accessibility labels on icon-only controls
- [ ] Layout holds at 375px width and at largest Dynamic Type setting
- [ ] Safe-area insets respected; nothing hidden behind the tab bar
