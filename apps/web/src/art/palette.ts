// The 24 colours from tools/palette24.json, the only palette the game draws with.
export const P = {
  butter: '#F6E3A1',
  butterShade: '#E7CB69',
  butterLight: '#F9EDC2',
  sage: '#A9CDA0',
  sageShade: '#79B176',
  sageLight: '#CADDC4',
  peach: '#F4C2A8',
  peachShade: '#DCA88D',
  peachLight: '#F7D2BF',
  blue: '#A9BFD6',
  blueShade: '#7296BC',
  blueLight: '#C1D1E2',
  cream: '#FFF8EC',
  creamShade: '#FAEBD2',
  white: '#FFFFFF',
  grey: '#CFC6BD',
  greyShade: '#A6A29F',
  greyLight: '#DAD5D1',
  brown: '#B9937A',
  brownShade: '#946F57',
  brownLight: '#C5A691',
  outline: '#8A6E5E',
  ink: '#534239',
  outlineLight: '#9F8272'
} as const;

export type PaletteKey = keyof typeof P;
export type Colour = (typeof P)[PaletteKey];

const cache = new Map<string, [number, number, number]>();

export function rgb(hex: string): [number, number, number] {
  let value = cache.get(hex);
  if (!value) {
    const n = Number.parseInt(hex.slice(1), 16);
    value = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    cache.set(hex, value);
  }
  return value;
}

export function isPaletteColour(hex: string): boolean {
  return (Object.values(P) as string[]).includes(hex.toUpperCase());
}
