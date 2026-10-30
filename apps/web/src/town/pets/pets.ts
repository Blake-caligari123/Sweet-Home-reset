import type { Pt } from '../world/nav';

// A pet (VISION §4): one little critter, chosen on day 4 and named by the player. It trails a
// little way behind Puff along the way Puff walked, so it always walks where Puff could.

/** A kind of pet the player can choose (pack data; the art is code-drawn until sprite sheets land). `finds`: what it sniffs out. */
export interface PetDef { id: string; name: string; defaultName: string; line: string; finds?: string[] }

/** Puff's pet: which kind, what it's called, the day it moved in, and today's sniffing (places, so each counts once). */
export interface Pet { kind: string; name: string; day: number; sniffed?: { day: number; areas: string[] } }

/**
 * The pet's help (NEXT-PHASE §10: the pet's help): the first time Puff goes somewhere outdoors
 * each day, the pet may sniff out one of its kind's finds, up to a few a day. Returns the item, or
 * null, and notes the place either way. Fixed by day and place, never random from moment to moment.
 */
export function sniff(pet: Pet, def: PetDef | undefined, area: string, day: number, perDay: number): string | null {
  const today = pet.sniffed?.day === day ? pet.sniffed : { day, areas: [] };
  if (today.areas.includes(area) || !def?.finds?.length) return null;
  pet.sniffed = { day, areas: [...today.areas, area] };
  if (today.areas.length >= perDay) return null;
  return def.finds[(day * 7 + area.length * 3 + today.areas.length) % def.finds.length];
}

/** The path Puff walked, kept just long enough for the pet to follow `gap` world px behind. */
export class Trail {
  private points: Pt[] = [];

  constructor(private gap: number) {}

  /** A new area (or a fresh start): the pet starts at Puff's feet. */
  reset(at: Pt) { this.points = [{ ...at }]; }

  /** Puff's feet this frame; only real moves are kept. */
  push(at: Pt) {
    const last = this.points[this.points.length - 1];
    if (last && last.x === at.x && last.y === at.y) return;
    this.points.push({ ...at });
    // Drop what's far enough back that the pet will never need it.
    while (this.points.length > 2 && this.length(1) > this.gap + 8) this.points.shift();
  }

  /** Where the pet stands: `gap` px back along the trail from Puff (or the trail's start). */
  get spot(): Pt {
    let left = this.gap;
    for (let i = this.points.length - 1; i > 0; i -= 1) {
      const a = this.points[i]; const b = this.points[i - 1];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d >= left) { const k = left / d; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; }
      left -= d;
    }
    return { ...this.points[0] };
  }

  /** The trail's length from point `from` to the end. */
  private length(from: number) {
    let n = 0;
    for (let i = from + 1; i < this.points.length; i += 1) n += Math.hypot(this.points[i].x - this.points[i - 1].x, this.points[i].y - this.points[i - 1].y);
    return n;
  }
}
