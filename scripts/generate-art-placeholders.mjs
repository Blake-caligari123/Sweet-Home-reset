/**
 * Writes 8×8 stand-in PNGs and public/art/manifest.json.
 * Real art replaces a file in place. The manifest status stays "missing"
 * until that file is the real asset from docs/ASSET-PROMPTS.md.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const artRoot = join(dirname(fileURLToPath(import.meta.url)), '../apps/web/public/art');
const COMMENT = 'PLACEHOLDER not final art. Replace this file in place. See docs/ASSET-PROMPTS.md.';

const assets = [];

function add(path, size, transparency) {
  assets.push({ path, size, transparency, status: 'missing', placeholder: true });
}

add('puff/puff_model_sheet.png', '2048x1024', false);
for (const name of [
  'idle', 'sleepy', 'nap', 'peek', 'bounce', 'wiggle', 'dance', 'proud_spin',
  'hop_in_pile', 'sneeze', 'tidy_helper', 'party', 'cosy'
]) add(`puff/puff_${name}.png`, '1024x1024', true);

for (const name of ['kitchen_nook', 'living_room', 'bedroom']) {
  add(`rooms/${name}_clean.png`, '2048x2048', false);
  add(`rooms/${name}_dirty.png`, '2048x2048', false);
}

for (const name of ['dust', 'grime', 'clutter', 'cobwebs', 'fog', 'crumbs']) {
  add(`overlays/dirt_${name}.png`, '2048x2048', true);
}

for (const name of [
  'sponge', 'foam_bubbles', 'squeegee', 'broom', 'dust_pile_marker', 'dust_bunny_cousin',
  'polish_cloth', 'laundry_basket', 'sort_bin', 'folded_shirt', 'watering_can',
  'plant_droopy', 'plant_perky', 'vacuum_nozzle', 'spray_bottle', 'tangled_cord',
  'sticker', 'friendly_bug', 'tool_tray'
]) add(`props/${name}.png`, '512x512', true);

for (const name of [
  'decor_lamp_pastel', 'decor_plant', 'decor_rug', 'decor_cushion', 'decor_wall_art',
  'decor_fairy_lights', 'decor_bookshelf_mini', 'decor_mug_steam'
]) add(`decor/${name}.png`, '512x512', true);

for (const name of ['apron', 'scarf', 'bandana', 'beanie', 'party_hat']) {
  add(`outfits/outfit_${name}_worn.png`, '1024x1024', true);
  add(`outfits/outfit_${name}_icon.png`, '256x256', true);
}

for (const name of ['tool_spray_gun_pastel', 'tool_big_sponge', 'tool_sparkle_duster']) {
  add(`tools/${name}.png`, '512x512', true);
}

for (const name of [
  'icon_sparkles', 'icon_energy', 'icon_home', 'icon_shop', 'icon_wardrobe', 'icon_decor',
  'icon_share', 'icon_settings', 'icon_help_puff', 'icon_chore_tick', 'icon_plus_badge',
  'icon_mess_of_day', 'icon_restore', 'icon_rest_day', 'icon_meter'
]) add(`ui/${name}.png`, '256x256', true);

add('ui/particle_sparkle.png', '64x64', true);
add('brand/app_icon_1024.png', '1024x1024', false);
add('brand/app_icon_fg_432.png', '432x432', true);
add('brand/app_icon_bg_432.png', '432x432', false);
add('brand/splash_2732.png', '2732x2732', false);

for (let index = 1; index <= 7; index += 1) {
  add(`store/screenshot_bg_${index}.png`, '1320x2868', false);
}

for (const name of ['before_after', 'mess_of_day', 'photo_mode']) {
  add(`share/share_bg_${name}.png`, '1080x1920', false);
}

if (assets.length !== 96) {
  console.error(`Expected 96 assets, got ${assets.length}`);
  process.exit(1);
}

const paths = new Set(assets.map((asset) => asset.path));
if (paths.size !== assets.length) {
  console.error('Duplicate asset path');
  process.exit(1);
}

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([name, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function placeholderPng(transparency) {
  const width = 8;
  const height = 8;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = row + 1 + x * 4;
      const stripe = (x + y) % 2 === 0;
      if (transparency && stripe) {
        raw[offset] = 0;
        raw[offset + 1] = 0;
        raw[offset + 2] = 0;
        raw[offset + 3] = 0;
      } else {
        raw[offset] = stripe ? 0xa8 : 0xfb;
        raw[offset + 1] = stripe ? 0xc5 : 0xf4;
        raw[offset + 2] = stripe ? 0xa4 : 0xe6;
        raw[offset + 3] = transparency ? 180 : 255;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const text = Buffer.concat([Buffer.from('Comment'), Buffer.from([0]), Buffer.from(COMMENT, 'latin1')]);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('tEXt', text),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const opaque = placeholderPng(false);
const clear = placeholderPng(true);

for (const asset of assets) {
  const file = join(artRoot, asset.path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, asset.transparency ? clear : opaque);
}

const manifest = {
  note: 'Target sizes come from docs/ASSET-PROMPTS.md. Every PNG on disk is an 8x8 stand-in with a PLACEHOLDER text chunk. status "missing" means the real art is not here yet. Replace the file by path, then set status to "ready" and placeholder to false.',
  assets
};

writeFileSync(join(artRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${assets.length} placeholders and manifest.json`);
