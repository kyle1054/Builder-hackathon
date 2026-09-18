import { HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

/**
 * The SideQuest Lock Screen / Dynamic Island Live Activity.
 *
 * This is the "front of screen" surface: it shows how far along the drive is and
 * surfaces a side quest the moment one is offered, without the Navigator having
 * to unlock the phone or open the app.
 *
 * Constraints of the `'widget'` directive — these are not style choices:
 *   - only `@expo/ui/swift-ui` components render here, no React Native views
 *   - no hooks, no state, no async, no external module references
 *   - every constant and helper must be declared INSIDE the component body
 * That is why the palette is redeclared below instead of imported from
 * `@/constants/theme`. Keep the two in sync by hand.
 */
export type JourneyActivityProps = {
  /** Where the drive ends, e.g. "Tierfontein Farm". */
  destination: string;
  /** 0-100, the shared party progress along the route. */
  progress: number;
  /** Human-readable distance remaining, e.g. "39 km". */
  distanceLeft: string;
  /** Epoch ms of estimated arrival. Rendered as a live timer that ticks without app updates. */
  arrivalAt: number;
  /** The side quest currently on offer, or null while simply driving. */
  questTitle: string | null;
  questPlace: string | null;
  /** Minutes of detour the quest costs. */
  questDetour: number | null;
  /** Drives which treatment the activity uses. */
  state: 'driving' | 'quest' | 'arrived';
};

const JourneyActivity = (props: JourneyActivityProps, environment: LiveActivityEnvironment) => {
  'widget';

  // SideQuest palette — mirrors SideQuestColors in src/constants/theme.ts.
  const VOID = '#080B12';
  const GOLD = '#D8B477';
  const GOLD_SOFT = '#F0D7AA';
  const PARCHMENT = '#F5F1E8';
  const MUTED = '#A9B0BE';
  const EMERALD = '#75C69D';
  const COBALT = '#7FA8C9';

  const hasQuest = props.state === 'quest' && props.questTitle !== null;
  const arrived = props.state === 'arrived';

  // On the Always-On display iOS dims the activity; drop the decorative colour
  // so the essentials stay legible rather than glowing.
  const dimmed = environment.isLuminanceReduced === true;
  const accent = dimmed ? PARCHMENT : hasQuest ? GOLD : COBALT;
  const eyebrowText = arrived ? 'ARRIVED' : hasQuest ? 'SIDE QUEST' : 'MAIN QUEST';
  const symbol = arrived ? 'flag.checkered' : hasQuest ? 'sparkles' : 'car.fill';

  const clamped = props.progress < 0 ? 0 : props.progress > 100 ? 100 : props.progress;
  const arrivalDate = new Date(props.arrivalAt);

  return {
    /* ── Lock Screen / Notification Centre banner ── */
    banner: (
      <VStack
        alignment="leading"
        spacing={7}
        modifiers={[padding({ all: 16 }), activityBackgroundTint(VOID)]}>
        <HStack spacing={7}>
          <Image systemName={symbol} size={13} color={accent} />
          <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle(accent)]}>
            {eyebrowText}
          </Text>
          <Spacer />
          <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(MUTED)]}>
            {arrived ? props.destination : props.distanceLeft}
          </Text>
        </HStack>

        {hasQuest ? (
          <VStack alignment="leading" spacing={2}>
            <Text
              modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(PARCHMENT), lineLimit(1)]}>
              {props.questTitle}
            </Text>
            <Text modifiers={[font({ size: 12 }), foregroundStyle(MUTED), lineLimit(1)]}>
              {props.questPlace} · {props.questDetour} min off route
            </Text>
          </VStack>
        ) : (
          <Text
            modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(PARCHMENT), lineLimit(1)]}>
            {arrived ? 'You made it.' : props.destination}
          </Text>
        )}

        <ProgressView value={clamped / 100} modifiers={[frame({ height: 6 })]} />

        <HStack>
          <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(GOLD_SOFT)]}>
            {clamped}% there
          </Text>
          <Spacer />
          {arrived ? (
            <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(EMERALD)]}>
              Chronicle ready
            </Text>
          ) : (
            // A SwiftUI timer: counts itself down on-device, so the ETA stays
            // honest even while the app is suspended and nothing is pushed.
            <Text
              date={arrivalDate}
              dateStyle="timer"
              modifiers={[
                font({ size: 11, weight: 'semibold' }),
                foregroundStyle(MUTED),
                monospacedDigit(),
              ]}
            />
          )}
        </HStack>
      </VStack>
    ),

    /* ── Dynamic Island, collapsed ── */
    compactLeading: <Image systemName={symbol} size={14} color={accent} />,
    compactTrailing: (
      <Text
        modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(accent), monospacedDigit()]}>
        {clamped}%
      </Text>
    ),
    minimal: <Image systemName={symbol} size={14} color={accent} />,

    /* ── Dynamic Island, expanded ── */
    expandedLeading: (
      <VStack alignment="leading" spacing={1} modifiers={[padding({ leading: 4 })]}>
        <Text modifiers={[font({ size: 10, weight: 'bold' }), foregroundStyle(accent)]}>
          {eyebrowText}
        </Text>
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(PARCHMENT), lineLimit(1)]}>
          {hasQuest ? props.questPlace : props.destination}
        </Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack alignment="trailing" spacing={1} modifiers={[padding({ trailing: 4 })]}>
        <Text
          modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(GOLD_SOFT), monospacedDigit()]}>
          {clamped}%
        </Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle(MUTED)]}>{props.distanceLeft}</Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack alignment="leading" spacing={6} modifiers={[padding({ horizontal: 4, top: 2 })]}>
        <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(PARCHMENT), lineLimit(1)]}>
          {hasQuest ? props.questTitle : arrived ? 'You made it.' : 'Keep driving.'}
        </Text>
        <ProgressView value={clamped / 100} modifiers={[frame({ height: 6 })]} />
      </VStack>
    ),
  };
};

export default createLiveActivity<JourneyActivityProps>('JourneyActivity', JourneyActivity);
