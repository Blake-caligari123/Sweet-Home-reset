// Light across the day (NEXT-PHASE §5.12: day-night lighting, lamps, depth). The world is shaded
// by one colour multiplied over it: white at noon, warm at dawn and dusk, deep blue at night. It
// eases from one hour to the next instead of stepping. Lamps and Puff's own glow add light back on
// top (ambience.ts). Indoors is kept a little lighter (lamps are on), and caves are always dim.

/** [hour, colour]: the sky's shade through the day, eased between. */
const SKY: [number, number][] = [
  [0, 0x4a5890], [5, 0x4a5890], [6, 0xa898c0], [7, 0xffe0c4], [8.5, 0xffffff], [16, 0xffffff],
  [17.5, 0xffe8cc], [19, 0xf0b898], [20.5, 0x8a80b4], [21.5, 0x4a5890], [24, 0x4a5890]
];
/** Each season's daytime light outdoors (spring is plain). */
const SEASON: Record<string, number> = { Summer: 0xfff4d8, Autumn: 0xffe6d0, Winter: 0xe2eaff };
const RAIN = 0xc6d0e4;
const CAVE = 0x9098b8;
/** How much lighter indoors is than outside, 0 to 1. */
const INDOOR_LIFT = 0.4;

const ch = (c: number, s: number) => (c >> s) & 0xff;
/** Mix two colours channel by channel: t = 0 is `a`, 1 is `b`. */
export function mix(a: number, b: number, t: number) {
  const m = (s: number) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t) << s;
  return m(16) | m(8) | m(0);
}
/** Multiply two colours, as the shade does to the world under it. */
const times = (a: number, b: number) => [16, 8, 0].reduce((out, s) => out | (Math.round((ch(a, s) * ch(b, s)) / 255) << s), 0);

export interface SkyOptions { kind: 'outdoor' | 'home' | 'cave' | string; rainy: boolean; season: string }

/** The colour multiplied over the world at this time (white: untouched). */
export function skyAt(minutes: number, o: SkyOptions) {
  if (o.kind === 'cave') return CAVE;
  const h = ((minutes / 60) % 24 + 24) % 24;
  const i = SKY.findIndex(([at]) => at > h);
  const [h0, c0] = SKY[i - 1]; const [h1, c1] = SKY[i];
  let c = mix(c0, c1, (h - h0) / (h1 - h0));
  if (o.kind !== 'outdoor') return mix(c, 0xffffff, INDOOR_LIFT);
  if (SEASON[o.season]) c = times(c, mix(0xffffff, SEASON[o.season], brightness(c)));
  if (o.rainy) c = times(c, RAIN);
  return c;
}

/** How light a shade is, 0 (black) to 1 (white): lamps and Puff's glow show more the darker it is. */
export function brightness(c: number) { return (0.3 * ch(c, 16) + 0.59 * ch(c, 8) + 0.11 * ch(c, 0)) / 255; }
