// Puff's voice: short, warm, never blaming (GAME-DESIGN §6).
export const LINES = {
  sneeze: ['Ah... ah... CHOO!', 'Oh! Someone\'s home!'],
  start: ['Let\'s tidy this spot.', 'Ready when you are.', 'No rush at all.'],
  stage25: ['Ooh, look at that!', 'Sparkly already!'],
  stage50: ['Halfway! So cosy.', 'It\'s glowing!'],
  stage75: ['Nearly there!', 'Smells fresh in here.'],
  taskDone: ['Yay!', 'Squeaky!', 'That\'s the one!', 'Ooh, nice!'],
  pop: ['Pff!', 'Boop!', 'Hehe!'],
  bounce: ['Hmm, not there.', 'Other spot, maybe?'],
  idle: ['Psst, over here!', 'I found a spot!'],
  help: ['I got it!', 'Teamwork!'],
  roomClean: ['We did it!', 'Room restored!'],
  choreYes: ['You\'re amazing!', 'Tiny wins count!'],
  choreNo: ['Totally fine!', 'Maybe later. No rush.'],
  choreCap: ['That\'s loads today. Rest counts too.'],
  welcomeBack: ['You\'re back! Party!', 'Missed you! Yay!'],
  shop: ['Ooh, shiny!', 'So cosy!'],
  nap: ['Zzz... so cosy...', 'Just a tiny nap...'],
  combo: ['Whoa, speedy!', 'You\'re on a roll!', 'Sparkle streak!']
} as const;

export type LineKey = keyof typeof LINES;

export const BANNED_WORDS = ['failed', 'fail', 'lost', 'overdue', 'lazy', 'dirty you', 'gross', 'weight', 'fat'];

export function line(key: LineKey, rand = Math.random) {
  const list = LINES[key];
  return list[Math.floor(rand() * list.length)];
}
