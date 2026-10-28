// What Puff does, as one stream: the onboarding tips and the rewards both listen to it.
export type PlayEvent =
  | { type: 'stood'; ground: string; area: string }
  | { type: 'cleared'; mess: string; area: string; x: number; y: number }
  | { type: 'putaway'; item: string }
  | { type: 'restored'; area: string }
  | { type: 'planted' }
  | { type: 'watered' }
  | { type: 'entered'; area: string }
  | { type: 'timer' }
  | { type: 'met'; id: string }
  /** The day's first chat with a neighbour. */
  | { type: 'talked'; id: string }
  | { type: 'gifted'; id: string; item: string }
  | { type: 'ate'; item: string }
  /** Something picked up off the ground or a counter (a snack, a shell, golden dust). */
  | { type: 'took'; item: string; x: number; y: number }
  | { type: 'found'; item: string }
  | { type: 'accepted'; id: string }
  | { type: 'jobDone'; id: string }
  | { type: 'slept' };
