import { Gauge, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  lineLimit,
  monospacedDigit,
  padding,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

/**
 * The persistent SideQuest widget — the one that stays on the Lock Screen or
 * Home Screen between trips, unlike the Live Activity which only exists while
 * a drive is running.
 *
 * Same `'widget'` constraints apply: no hooks, no state, no imported constants.
 * The palette is redeclared below; keep it in sync with src/constants/theme.ts.
 */
export type JourneyWidgetProps = {
  destination: string;
  progress: number;
  distanceLeft: string;
  questTitle: string | null;
  /** Trips saved but not started, shown when nothing is in progress. */
  plannedCount: number;
  active: boolean;
};

const JourneyWidget = (props: JourneyWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  const GOLD = '#D8B477';
  const GOLD_SOFT = '#F0D7AA';
  const PARCHMENT = '#F5F1E8';
  const MUTED = '#A9B0BE';
  const COBALT = '#7FA8C9';

  const clamped = props.progress < 0 ? 0 : props.progress > 100 ? 100 : props.progress;
  const family = environment.widgetFamily;
  const hasQuest = props.questTitle !== null;
  const accent = hasQuest ? GOLD : COBALT;

  // Lock Screen accessories render monochrome — colour is stripped by the system,
  // so these variants lean on the gauge and short text instead of hue.
  if (family === 'accessoryCircular') {
    return (
      <Gauge
        value={clamped}
        min={0}
        max={100}
        currentValueLabel={<Text modifiers={[monospacedDigit()]}>{clamped}</Text>}
      />
    );
  }

  if (family === 'accessoryInline') {
    return (
      <Text modifiers={[widgetURL('sidequest://journey')]}>
        {props.active ? `${clamped}% · ${props.distanceLeft} to ${props.destination}` : 'SideQuest'}
      </Text>
    );
  }

  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL('sidequest://journey')]}>
        <Text modifiers={[font({ size: 11, weight: 'bold' }), lineLimit(1)]}>
          {props.active ? (hasQuest ? 'SIDE QUEST' : 'MAIN QUEST') : 'SIDEQUEST'}
        </Text>
        <Text modifiers={[font({ size: 14, weight: 'semibold' }), lineLimit(1)]}>
          {props.active ? (hasQuest ? props.questTitle : props.destination) : 'No trip running'}
        </Text>
        <Text modifiers={[font({ size: 11 }), lineLimit(1), monospacedDigit()]}>
          {props.active
            ? `${clamped}% · ${props.distanceLeft} left`
            : props.plannedCount > 0
              ? `${props.plannedCount} trip${props.plannedCount === 1 ? '' : 's'} planned`
              : 'Plan a trip'}
        </Text>
      </VStack>
    );
  }

  /* Home Screen: systemSmall / systemMedium */
  return (
    <VStack
      alignment="leading"
      spacing={6}
      modifiers={[padding({ all: 14 }), widgetURL('sidequest://journey')]}>
      <HStack spacing={6}>
        <Image systemName={props.active ? 'car.fill' : 'map'} size={12} color={accent} />
        <Text modifiers={[font({ size: 10, weight: 'bold' }), foregroundStyle(accent)]}>
          {props.active ? (hasQuest ? 'SIDE QUEST' : 'MAIN QUEST') : 'SIDEQUEST'}
        </Text>
        <Spacer />
      </HStack>

      <Text
        modifiers={[
          font({ size: family === 'systemSmall' ? 15 : 18, weight: 'bold' }),
          foregroundStyle(PARCHMENT),
          lineLimit(2),
        ]}>
        {props.active
          ? hasQuest
            ? props.questTitle
            : props.destination
          : props.plannedCount > 0
            ? 'Ready when you are.'
            : 'Plan a trip.'}
      </Text>

      <Spacer />

      {props.active ? (
        <HStack>
          <Text
            modifiers={[
              font({ size: 12, weight: 'semibold' }),
              foregroundStyle(GOLD_SOFT),
              monospacedDigit(),
            ]}>
            {clamped}%
          </Text>
          <Spacer />
          <Text modifiers={[font({ size: 12 }), foregroundStyle(MUTED), lineLimit(1)]}>
            {props.distanceLeft}
          </Text>
        </HStack>
      ) : (
        <Text modifiers={[font({ size: 12 }), foregroundStyle(MUTED), lineLimit(1)]}>
          {props.plannedCount > 0
            ? `${props.plannedCount} trip${props.plannedCount === 1 ? '' : 's'} saved`
            : 'It’s about the journey.'}
        </Text>
      )}
    </VStack>
  );
};

export default createWidget<JourneyWidgetProps>('JourneyWidget', JourneyWidget);
