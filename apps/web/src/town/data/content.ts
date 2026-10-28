import type { NeighbourDef } from '../neighbours/neighbours';
import { DEFAULT_NAMES, withNames, type Names } from '../play/names';
import type { TownPack } from './area';

/** Lookups into the town pack: text by id, item names, neighbours and requests. */
export class Content {
  readonly neighbours = new Map<string, NeighbourDef>();

  constructor(
    readonly pack: TownPack,
    /** What the player called Puff and the town, live (they can be changed in the pause menu). */
    private names: () => Names = () => DEFAULT_NAMES
  ) {
    for (const d of pack.neighbours ?? []) this.neighbours.set(d.id, d);
  }

  /** A line from the string table (en-AU, the source language), with the player's names in it. */
  line(id: string | undefined) { const t = id ? this.pack.strings?.['en-AU']?.[id] : undefined; return t === undefined ? t : this.named(t); }
  /** Any text with `{puff}` and `{town}` in it (area names, the tracker, Puff's own lines). */
  named(text: string) { return withNames(text, this.names()); }
  itemName(id: string) { return this.pack.items[id]?.name ?? id; }
  neighbour(id: string) { return this.neighbours.get(id); }
  request(id: string) { return this.pack.requests?.find((t) => t.id === id); }
}
