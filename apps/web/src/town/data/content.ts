import type { NeighbourDef } from '../neighbours/neighbours';
import type { TownPack } from './area';

/** Lookups into the town pack: text by id, item names, neighbours and requests. */
export class Content {
  readonly neighbours = new Map<string, NeighbourDef>();

  constructor(readonly pack: TownPack) {
    for (const d of pack.neighbours ?? []) this.neighbours.set(d.id, d);
  }

  /** A line from the string table (en-AU, the source language). */
  line(id: string | undefined) { return id ? this.pack.strings?.['en-AU']?.[id] : undefined; }
  itemName(id: string) { return this.pack.items[id]?.name ?? id; }
  neighbour(id: string) { return this.neighbours.get(id); }
  request(id: string) { return this.pack.requests?.find((t) => t.id === id); }
}
