import type { ImageSourcePropType } from 'react-native';

/**
 * Traveller sprites are DiceBear "voxel-art" (CC0 1.0) — isometric retro 3D pixel
 * characters, deterministic per seed. `profiles.avatar_seed` is that seed, so a
 * traveller looks the same on every device without us storing an image.
 *
 * Bundled sprites are generated at build time by `scripts/generate-avatars.mjs`.
 * Anything not bundled falls back to the live API — see `avatarSource`.
 */

/** Seeds baked into the bundle. Add one here after generating its PNG. */
const BUNDLED = {
  kyle: require('../../assets/avatars/kyle.png'),
  sam: require('../../assets/avatars/sam.png'),
  thandi: require('../../assets/avatars/thandi.png'),
  tebogo: require('../../assets/avatars/tebogo.png'),
} as const satisfies Record<string, ImageSourcePropType>;

export type BundledAvatarSeed = keyof typeof BUNDLED;

export const DEMO_AVATAR_SEEDS = Object.keys(BUNDLED) as BundledAvatarSeed[];

/** Keep in sync with BRAND_OPTIONS in scripts/generate-avatars.mjs. */
const BRAND_OPTIONS: Record<string, string[]> = {
  backgroundColor: ['00000000'],
  hairColor: ['2c222b', '3b2f2f', '5a3825', '7b4a2d', 'a56b46', 'c98850', 'd9b380', 'e8d4a8', 'b55239'],
  shirtColor: ['d8b477', '7fa8c9', '75c69d', 'dfa45b'],
  pantsColor: ['27405a', '182234'],
  jacketColor: ['f5f1e8', '27405a'],
  hatColor: ['d8b477', '7fa8c9'],
  shoesColor: ['f5f1e8', '343a40'],
};

export function avatarUrl(seed: string, size = 256): string {
  const params = new URLSearchParams({ seed, size: String(size) });
  // Repeated keys, not comma-joined — a percent-encoded comma fails the API's hex check.
  for (const [key, values] of Object.entries(BRAND_OPTIONS)) {
    for (const value of values) params.append(key, value);
  }
  return `https://api.dicebear.com/10.x/voxel-art/png?${params.toString()}`;
}

export function isBundledSeed(seed: string): seed is BundledAvatarSeed {
  return seed in BUNDLED;
}

/**
 * Prefers the bundled sprite so the demo never waits on (or fails at) a network
 * call. Unknown seeds — i.e. real users — resolve to the live API.
 */
export function avatarSource(seed: string | null | undefined, size = 256): ImageSourcePropType {
  if (!seed) return BUNDLED.kyle;
  return isBundledSeed(seed) ? BUNDLED[seed] : { uri: avatarUrl(seed, size) };
}
