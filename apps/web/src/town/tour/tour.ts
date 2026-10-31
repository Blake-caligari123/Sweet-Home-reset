import type { Scene } from './scene';

// The feature tour (test link only): each card sets up the moment a feature shows itself, then
// says what to try. It changes the save (day, place, items), so it's for testing, not a real game.

export interface TourCard { title: string; steps: string[]; setup(s: Scene): void }

/** Only on the test link; a public build sets VITE_RELEASE=1 (RELEASE-CHECKLIST). */
export const TOUR_ON = import.meta.env.VITE_RELEASE !== '1';

export const TOUR: TourCard[] = [
  { title: '🗺 Getting around', steps: ['Tap 🗺 (top left) and pick a place to travel there.', 'Pause → Joystick: drag anywhere to walk.', 'Pinch (or the mouse wheel) to zoom.'],
    setup: (s) => { s.day(3).time(10).visited('yard', 'square', 'lane', 'bakery', 'library').go('square'); } },
  { title: '🌙 Night light and trees', steps: ['It\'s 9:30 pm: see the dark, the lamp glow and Puff\'s soft glow.', 'Walk behind a tree: its leaves go in front of Puff.'],
    setup: (s) => { s.day(3).time(21, 30).go('yard'); } },
  { title: '✨ Tidy chains', steps: ['Tap mess spots one after another, quickly.', 'From the 3rd: "Tidy chain ×3". Every 5th gives Sparkles.'],
    setup: (s) => { s.day(3).time(10).go('lane'); } },
  { title: '🧪 Each place\'s own mess', steps: ['Ink in the library: the sponge, 2 hits.', 'With 🗺: flour in the bakery, sawdust at Pip\'s, soap scum at the bathhouse.'],
    setup: (s) => { s.day(16).time(11).visited('bakery', 'pip_workshop', 'bathhouse').go('library'); } },
  { title: '📜 A recipe card', steps: ['Clear one or two spots here: a recipe card turns up.', 'Cook it at the burrow\'s kitchen.'],
    setup: (s) => { s.state.finds.cleans.lane = 7; s.day(6).time(10).go('lane'); } },
  { title: '🧹 Skills', steps: ['Clear one spot: Tidying reaches level 2 (the Fluff bar grows).', 'Pause → ✨ Skills shows every skill and its perk.'],
    setup: (s) => { s.state.skills.xp.tidying = 38; s.day(3).time(10).go('lane'); } },
  { title: '😊 Puff\'s mood', steps: ['Open the Bag and eat the biscuit (you\'ve chatted with Hazel today).', 'The face by the map turns 😊: tap it. Happy Puff tidies quicker.'],
    setup: (s) => { s.day(5).time(10).give('biscuit').meet('hazel'); s.state.friendOf('hazel').talkedDay = 5; s.go('burrow'); } },
  { title: '🐶 The pet\'s help', steps: ['Your pup sniffs out a present in each new outdoor place (3 a day).', 'Look in the Bag, then try the lane and Riverside.'],
    setup: (s) => { s.state.pet = { kind: 'pup', name: 'Biscuit', day: 4 }; s.day(5).time(10).go('square'); } },
  { title: '☔ Rainy-day plans', steps: ['It\'s raining: Otto is out paddling at Riverside.', 'Talk to Otto.'],
    setup: (s) => { s.day(6).time(11).meet('otto').go('riverside'); } },
  { title: '☀ Happy-day plans', steps: ['Hazel\'s bakery is restored and you\'ve chatted: she\'s happy.', 'So she\'s out strolling in the square. Talk to her.'],
    setup: (s) => { s.day(5).time(17, 30).meet('hazel').restore('bakery'); s.state.friendOf('hazel').talkedDay = 5; s.go('square'); } },
  { title: '🤝 A falling-out', steps: ['Bea and Hazel have fallen out over a honey jar.', 'Talk to Bea, then Hazel (the bakery), then Bea again.'],
    setup: (s) => { s.day(16).time(9).meet('hazel', 'bea').visited('bakery').go('bea_shop'); } },
  { title: '📚 Moss\'s quest', steps: ['Talk to Moss: tap "📜 A favour for Moss?".', 'Follow the tracker. Some steps open the next day: sleep to move on.'],
    setup: (s) => { s.day(6).time(11).meet('moss', 'pip').go('library'); } },
  { title: '🎪 Festival prep', steps: ['Talk to Hazel: "📜 Help get ready for the fair?".', 'Tidy the square, pick crops, ask Bea, tell Hazel.'],
    setup: (s) => { s.day(10).time(9).meet('hazel', 'bea').go('bakery'); } },
  { title: '💌 Thank-you notes', steps: ['You have 3 of Hazel\'s notes: trade them in her chat.', 'Pause → ♥ Friends shows the notes left.'],
    setup: (s) => { s.state.tokens.hazel = 3; s.day(5).time(9).meet('hazel').go('bakery'); } },
  { title: '👾 Grumble jobs', steps: ['Hazel\'s job: befriend a dust Grumble. Tap one a few times.', 'When it turns friendly, the job is done.'],
    setup: (s) => { s.day(5).time(10); s.state.requests.list.push({ id: 'hazel_grumble', until: 12, accepted: true }); s.go('lane'); } },
  { title: '🏘 Town needs and the fund', steps: ['Tap the plans board and build a bench (200 ✨ to spend).', 'Sleep: the town ticks off "Somewhere to sit". Pause → 🏘 Town.'],
    setup: (s) => { s.day(3).time(10).flag('keeper_named').sparkles(200).go('square'); } },
  { title: '🧽 Neighbours join in', steps: ['Hazel\'s home is restored, so she helps tidy.', 'Go to bed in the burrow: in the morning, she\'s tidied the lane.'],
    setup: (s) => { s.day(5).time(20).meet('hazel').restore('bakery').visited('lane').go('burrow'); } },
  { title: '🧺 Your market stall', steps: ['Tap your stall (peach awning, left of the square) and put crops out.', 'Sleep: in the morning, see what sold. More sell as the town blooms.'],
    setup: (s) => { s.day(5).time(10).give('radish', 3).give('carrot', 2).give('veggie_soup').go('square'); } }
];
