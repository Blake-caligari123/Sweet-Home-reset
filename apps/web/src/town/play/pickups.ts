// Things lying about that Puff can take (GDD v3: snacks refill Fluff), like the biscuit on the
// burrow's kitchen counter. Each one is back every morning.
export interface PickupDef {
  id: string;
  /** The tile Puff reaches for (a counter's footprint). */
  x: number; y: number;
  item: string;
  /** Drawn this many tiles higher, to sit on top of the furniture. */
  drawDy?: number;
  /** A bottle letter: opening it, rather than into the bag. */
  letter?: string;
}

/** Which pickups were taken, on which day. */
export interface Taken { day: number; ids: string[] }

export function available(list: PickupDef[], taken: Taken, day: number) {
  return taken.day === day ? list.filter((p) => !taken.ids.includes(p.id)) : list;
}

export function take(taken: Taken, id: string, day: number): Taken {
  return { day, ids: [...(taken.day === day ? taken.ids : []), id] };
}
