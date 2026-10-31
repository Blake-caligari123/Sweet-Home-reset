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
    setup: (s) => { s.day(5).time(10).give('radish', 3).give('carrot', 2).give('veggie_soup').go('square'); } },
  { title: '☕ Café orders', steps: ['Pause → 🏘 Town says what the café wants today.', 'Talk to Hazel: tap "☕ Café order" to hand a dish over.'],
    setup: (s) => { s.day(5).time(9).meet('hazel').give('veggie_soup', 2).give('pea_fritters', 2).give('tart', 2).go('bakery'); } },
  { title: '🎣 Fishing', steps: ['You have a rod. Walk to the ripples on the river and tap them.', 'Wait for the splash, then tap Reel in! quickly. Night brings different fish.'],
    setup: (s) => { s.day(6).time(11).give('fishing_rod').go('riverside'); } },
  { title: '🐞 Critters', steps: ['Look around the yard: tap a little critter to spot it.', 'Pause → 📖 Collection has the Critter journal, with hints for the rest.'],
    setup: (s) => { s.day(3).time(11).go('yard'); } },
  { title: '🍲 Cooking by hand', steps: ['Tap the kitchen in the burrow and Cook the veggie soup.', 'Chop with quick taps, then stir in circles. Pea fritters need kneading: press and hold.'],
    setup: (s) => { s.day(3).time(12).give('radish', 2).give('carrot', 2).give('peas', 2).go('burrow'); } },
  { title: '🪑 Furniture', steps: ['Tap Pip\'s workbench and Make a chair or a picnic table.', 'Open the bag, tap the furniture, and place it outside in the lane. Tap it again to pick it up.'],
    setup: (s) => { s.day(8).time(11).flag('he_pip_02_done').flag('he_pip_04_done').meet('pip').give('twig', 12).give('pebble', 4).sparkles(60).go('pip_workshop'); } },
  { title: '🐔 Farm animals', steps: ['Your hen, goat and cow are in the yard. Tap each to collect an egg, wool or milk.', 'That tap also pats and feeds them: care today, something to collect tomorrow.', 'Cook pancakes from an egg and milk in the burrow kitchen. The General Store sells animals.'],
    setup: (s) => {
      s.day(15).time(10);
      s.state.pet ??= { kind: 'cat', name: 'Pebble', day: 14 }; // so the pet visitors don't call in the yard
      for (const a of ['hen', 'goat', 'cow']) { s.flag(`animal_${a}`); s.state.farm[a] = { tended: 14, ready: true }; }
      s.go('yard');
    } },
  { title: '🛋 Decorate the burrow', steps: ['Open the bag and tap the cosy chair, then tap a spot on the burrow floor.', 'Try the bookcase, fern and floor lamp too. Tap a piece to pick it back up.', 'The General Store sells chairs and ferns; Pip teaches lamps and bookcases.'],
    setup: (s) => { s.day(8).time(18).give('cosy_chair').give('bookcase').give('fern_pot', 2).give('floor_lamp').go('burrow'); } },
  { title: '🚪 New burrow rooms', steps: ['The craft room (round door) and the cellar (hatch) are dug in the yard. Step inside.', 'The craft room has a workbench of your own; the cellar grows mushrooms each day.', 'Both can be decorated. In a normal game, dig them from the Keeper\'s plans.'],
    setup: (s) => {
      s.day(12).time(10).flag('keeper_named').flag('he_pip_02_done').give('twig', 6).sparkles(30);
      for (const [plot, b] of [['plot_yard_craft', 'craft_room'], ['plot_yard_cellar', 'cellar']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 10, readyDay: 12 };
      s.state.pet ??= { kind: 'cat', name: 'Pebble', day: 11 };
      s.go('yard');
    } },
  { title: '🪣 The well', steps: ['A well stands beside the yard garden. Plant some seeds near it.', 'Sleep: next morning the crops near the well are already watered.', 'In a normal game, build it from the Keeper\'s plans (Town Bloom 1).'],
    setup: (s) => {
      s.day(3).time(10).flag('keeper_named').give('radish_seeds', 6); // day 4 is dry, so only the well waters
      s.state.plots.plot_yard_well = { buildingId: 'well', stage: 2, startedDay: 1, readyDay: 2 };
      s.state.pet ??= { kind: 'cat', name: 'Pebble', day: 2 };
      s.go('yard');
    } },
  { title: '🐐 Fig, the new farmer', steps: ['Fig has moved into a cottage up from the river. Go and say hello.', 'Fig loves carrots and pancakes. Talk each day to hear their story.', 'In a normal game, Fig\'s letter arrives by the river on day 18.'],
    setup: (s) => {
      s.day(20).time(8).flag('letter_fig_1_read').flag('invite_fig').flag('home_fig').give('carrot', 2);
      s.state.plots.plot_riverside_cottage = { buildingId: 'cottage_fig', stage: 2, startedDay: 18, readyDay: 20 };
      s.go('riverside');
    } },
  { title: '🌱 Fig\'s riverbank garden', steps: ['Talk to Fig by the cottage and say yes to the riverbank garden.', 'Pick crops, then ask Bea about flowers the next day, then tidy the river bank.', 'The tracker shows each step. The reward is Fig\'s rare seeds.'],
    setup: (s) => {
      s.day(21).time(8).flag('letter_fig_1_read').flag('invite_fig').flag('home_fig').meet('fig');
      s.state.plots.plot_riverside_cottage = { buildingId: 'cottage_fig', stage: 2, startedDay: 18, readyDay: 20 };
      s.go('riverside');
    } },
  { title: '🍂 Leaf Fest prep', steps: ['Sorrel is in the square: tap "📜 Help me get ready for Leaf Fest?".', 'Rake the square, pick crops, ask Pip about lanterns, tell Sorrel.', 'From day 52, Mabel asks for help with Winter Lights the same way.'],
    setup: (s) => {
      s.day(39).time(9, 30).flag('letter_sorrel_1_read').flag('invite_sorrel').flag('home_sorrel').meet('sorrel', 'pip');
      s.state.plots.plot_lane_cottage = { buildingId: 'cottage_sorrel', stage: 2, startedDay: 9, readyDay: 11 };
      s.go('square');
    } },
  { title: '🛶 Fig and Pip fall out', steps: ['Pip\'s toy boat sailed through Fig\'s seedlings.', 'Talk to Fig by the river, then Pip, then Fig again to mend it.'],
    setup: (s) => {
      s.day(25).time(13, 30).flag('letter_fig_1_read').flag('invite_fig').flag('home_fig').meet('fig', 'pip');
      s.state.plots.plot_riverside_cottage = { buildingId: 'cottage_fig', stage: 2, startedDay: 18, readyDay: 20 };
      s.go('riverside');
    } },
  { title: '🐦 Wren comes home', steps: ['Pip\'s best friend Wren is back, the river\'s new fisher.', 'Find Wren by the Far Bank pond in the morning, the river at 10, the lane after lunch.', 'In a normal game, Wren\'s letter arrives by Pip\'s workshop on day 30.'],
    setup: (s) => {
      s.day(31).time(7).flag('letter_wren_1_read').flag('invite_wren').flag('home_wren').give('minnow', 2);
      s.state.plots.plot_footbridge = { buildingId: 'footbridge', stage: 2, startedDay: 12, readyDay: 14 };
      s.state.plots.plot_far_bank_cottage = { buildingId: 'cottage_wren', stage: 2, startedDay: 30, readyDay: 31 };
      s.go('far_bank');
    } },
  { title: '⛵ The first sail', steps: ['Talk to Wren by the pond: "📜 Help Pip and me finish our boat?".', 'Make something at a workbench, ask Pip about the sail the next day, then fish and spot a critter.', 'You have a rod and the furniture recipes. Tell Wren when it\'s all done.'],
    setup: (s) => {
      s.day(33).time(7).flag('letter_wren_1_read').flag('invite_wren').flag('home_wren').flag('he_pip_02_done').meet('wren', 'pip').give('fishing_rod').give('twig', 6).sparkles(30);
      s.state.plots.plot_footbridge = { buildingId: 'footbridge', stage: 2, startedDay: 12, readyDay: 14 };
      s.state.plots.plot_far_bank_cottage = { buildingId: 'cottage_wren', stage: 2, startedDay: 30, readyDay: 31 };
      s.go('far_bank');
    } },
  { title: '🗝 A secret boathouse', steps: ['You found an old key on the Far Bank. A gap has opened in the hedge on the left.', 'Step through to the old boathouse, read the carving, and tidy it up.', 'In a normal game, the key turns up while tidying the Far Bank.'],
    setup: (s) => {
      s.day(16).time(10);
      if (!s.state.finds.found.includes('boathouse_key')) s.state.finds.found.push('boathouse_key');
      s.state.plots.plot_footbridge = { buildingId: 'footbridge', stage: 2, startedDay: 12, readyDay: 14 };
      s.go('far_bank');
    } },
  { title: '🐉 River critters', steps: ['New by the water: a dragonfly, a kingfisher and, in spring, ducklings on the Far Bank.', 'Tap them to spot them. The Critter journal (Pause → 📖 Collection) says where to look.'],
    setup: (s) => {
      s.day(17).time(11); // the dragonfly and the kingfisher are both out at the river today
      s.state.plots.plot_footbridge = { buildingId: 'footbridge', stage: 2, startedDay: 12, readyDay: 14 };
      s.go('riverside');
    } },
  { title: '📖 Summer chapter: the keeper before', steps: ['You restored Thimble\'s boathouse. Moss wants to know more: tap "📜 Help me learn about Thimble?".', 'Ask Otto at the bathhouse, keep tidying for a find, ask Pip to mend the oar, then tell Moss.'],
    setup: (s) => { s.day(16).time(11).flag('restored_boathouse').flag('noise_mended').meet('moss', 'otto', 'pip'); s.state.dramas.noise = 3; s.go('library'); } },
  { title: '🌿 Watercress by the river', steps: ['The riverbank beds are dug. Tap the soil to plant watercress seeds.', 'The river waters them every morning. Watercress only grows here.', 'In a normal game, finishing Fig\'s riverbank garden quest adds the beds to the Keeper\'s plans.'],
    setup: (s) => {
      s.day(16).time(10).flag('seed_swap_done').give('watercress_seeds', 3);
      s.state.plots.plot_riverbank_beds = { buildingId: 'riverbank_beds', stage: 2, startedDay: 14, readyDay: 15 };
      s.go('riverside');
    } },
  { title: '🌾 Reed Grumbles', steps: ['From summer, a new kind of Grumble rustles by the river: green and tangly.', 'Rake it 3 times to comb it out and befriend it.'],
    setup: (s) => { s.day(20).time(10); s.go('riverside'); } },
  { title: '🦊 Juniper the fiddler', steps: ['Juniper has moved into a cottage at the Woodland Edge. Say hello!', 'Juniper heard an old tune in the woods. Talk each day to follow it.', 'In a normal game, Juniper\'s letter arrives in the Lane on day 40.'],
    setup: (s) => {
      s.day(41).time(8).flag('letter_juniper_1_read').flag('invite_juniper').flag('home_juniper').give('apple', 2);
      for (const [plot, b] of [['plot_footbridge', 'footbridge'], ['plot_overgrown_path', 'woodland_path'], ['plot_woodland_cottage', 'cottage_juniper']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 12, readyDay: 14 };
      s.go('woodland');
    } },
  { title: '🍐 Orchard Hill', steps: ['The tumbled steps are mended: walk east along the path at the Woodland Edge.', 'Orchard Hill has pear and plum trees, fruit every morning, and an old humming stone on top.', 'In a normal game, mend the steps from the Keeper\'s plans in autumn.'],
    setup: (s) => {
      s.day(36).time(10);
      for (const [plot, b] of [['plot_footbridge', 'footbridge'], ['plot_overgrown_path', 'woodland_path'], ['plot_hill_steps', 'hill_steps']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 12, readyDay: 14 };
      s.go('woodland');
    } },
  { title: '🎻 Autumn chapter: the old song', steps: ['Juniper is by the cottage: tap "📜 Help me find where the old song comes from?".', 'Ask Moss for the songbook, tidy by the stone on Orchard Hill, ask Mabel, tell Juniper.'],
    setup: (s) => {
      s.day(44).time(8, 30).flag('letter_juniper_1_read').flag('invite_juniper').flag('home_juniper').flag('juniper_concert').meet('juniper', 'moss', 'mabel');
      for (const [plot, b] of [['plot_footbridge', 'footbridge'], ['plot_overgrown_path', 'woodland_path'], ['plot_woodland_cottage', 'cottage_juniper'], ['plot_hill_steps', 'hill_steps']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 12, readyDay: 14 };
      s.go('woodland');
    } }
];
