#!/usr/bin/env node
/**
 * Generates SideQuest traveller sprites from DiceBear, brand-constrained to the
 * SideQuest palette, and writes transparent PNGs into assets/avatars/.
 *
 *   node scripts/generate-avatars.mjs                 # the four demo travellers
 *   node scripts/generate-avatars.mjs kyle sam nomsa  # any seeds you like
 *   AVATAR_STYLE=pixel-art node scripts/generate-avatars.mjs
 *
 * Style: DiceBear "voxel-art" — isometric retro 3D pixel characters, CC0 1.0,
 * so no attribution is required. Same seed always produces the same sprite,
 * which is what makes `profiles.avatar_seed` work as a stable identity.
 *
 * These are baked at build time on purpose: the demo must not depend on a
 * network call to api.dicebear.com while someone is watching.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'assets', 'avatars');

const STYLE = process.env.AVATAR_STYLE ?? 'voxel-art';
const SIZE = Number(process.env.AVATAR_SIZE ?? 256);
const DEFAULT_SEEDS = ['kyle', 'sam', 'thandi', 'tebogo'];

/**
 * Constrains DiceBear's default palettes to the SideQuest system so sprites sit
 * on a navy card without fighting it. Hair is limited to naturals — the stock
 * set includes a mint green and a violet that read as costume, not character.
 */
const BRAND_OPTIONS = {
  backgroundColor: '00000000', // 8-digit hex = transparent; "transparent" is rejected
  hairColor: ['2c222b', '3b2f2f', '5a3825', '7b4a2d', 'a56b46', 'c98850', 'd9b380', 'e8d4a8', 'b55239'],
  shirtColor: ['d8b477', '7fa8c9', '75c69d', 'dfa45b'],
  pantsColor: ['27405a', '182234'],
  jacketColor: ['f5f1e8', '27405a'],
  hatColor: ['d8b477', '7fa8c9'],
  shoesColor: ['f5f1e8', '343a40'],
};

function buildUrl(seed) {
  const params = new URLSearchParams({ seed, size: String(SIZE) });
  // Array options must be repeated keys, not a comma-joined value: URLSearchParams
  // percent-encodes the comma and the API's hex pattern then rejects it.
  for (const [key, value] of Object.entries(BRAND_OPTIONS)) {
    for (const entry of [value].flat()) params.append(key, entry);
  }
  return `https://api.dicebear.com/10.x/${STYLE}/png?${params}`;
}

async function fetchSprite(seed) {
  const url = buildUrl(seed);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${seed}: ${res.status} ${res.statusText}\n  ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

const seeds = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SEEDS;

await mkdir(OUT_DIR, { recursive: true });

const results = await Promise.allSettled(
  seeds.map(async (seed) => {
    const png = await fetchSprite(seed);
    const file = join(OUT_DIR, `${seed}.png`);
    await writeFile(file, png);
    return { seed, bytes: png.length };
  })
);

let failed = 0;
for (const [i, result] of results.entries()) {
  if (result.status === 'fulfilled') {
    console.log(`  ✓ ${result.value.seed}.png  (${(result.value.bytes / 1024).toFixed(1)} kB)`);
  } else {
    failed += 1;
    console.error(`  ✗ ${seeds[i]} — ${result.reason.message}`);
  }
}

console.log(`\n${results.length - failed}/${results.length} sprites written to assets/avatars (style: ${STYLE})`);
if (failed) process.exitCode = 1;
