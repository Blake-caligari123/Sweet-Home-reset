import type { Scene } from './scene';

// The feature tour (test link only): each card sets up the moment a feature shows itself, then
// says what to try. It changes the save (day, place, items), so it's for testing, not a real game.

export interface TourCard { title: string; steps: string[]; setup(s: Scene): void }

/** Only on the test link; a public build sets VITE_RELEASE=1 (RELEASE-CHECKLIST). */
export const TOUR_ON = import.meta.env.VITE_RELEASE !== '1';

export const TOUR: TourCard[] = [
  { title: '🎬 The opening', steps: ['The story of the town plays out: long ago, Thimble, the colour going grey, and Puff\'s first sparkle.', 'Tap for the next caption, or Skip. A new game plays it once before naming.'],
    setup: (s) => { s.playScene('opening'); } },
  { title: '🎞 Chapter cutscenes', steps: ['It\'s the last night of spring. Go to bed (tap the burrow bed).', 'In the morning, summer opens: a title card, then the fountain\'s sleepy voice leads across the water. Sound on!', 'Pause → 📔 Keeper\'s journal → Memories plays any you\'ve seen again.'],
    setup: (s) => { s.state.story = { step: 14, asked: false, count: 0, day: 14 }; s.day(14).time(21).flag('keeper_named').go('burrow'); } },
  { title: '🏡 A newcomer arrives', steps: ['Wren\'s cottage is finished tonight. Go to bed (tap the burrow bed).', 'In the morning Wren crosses the bridge and Pip runs to meet them. Sorrel, Fig and Juniper each get their own arrival too.', 'Pause → 📔 Keeper\'s journal → Memories plays it again.'],
    setup: (s) => { s.day(31).time(21).flag('keeper_named').flag('letter_wren_1_read').flag('invite_wren').flag('home_wren').flag('welcome_wren').meet('pip');
      s.state.plots.plot_far_bank_cottage = { buildingId: 'cottage_wren', stage: 2, startedDay: 29, readyDay: 31 }; s.go('burrow'); } },
  { title: '🔍 The big reveals', steps: ['Close this: the boathouse is tidy, so its reveal plays straight away (the mended boat, Thimble\'s carving).', 'The humming stone (autumn) and Thimble\'s last carving (deepest cave) play at their moments too; both are in Pause → 📔 Keeper\'s journal → Memories here.'],
    setup: (s) => { s.flag('scene_reveal_stone').flag('scene_reveal_carving').day(17).time(15).flag('restored_boathouse').go('far_bank'); } },
  { title: '🏮 Thimble wakes', steps: ['Winter Lights is done and the neighbours have brought their gifts. Close this.', 'Every lantern glows, the fountain blazes, and Thimble climbs out and turns around: the first time you see their face. Sound on!'],
    setup: (s) => { s.day(56).time(20).flag('keeper_named').flag('year_one_chapter').go('square'); } },
  { title: '🧹 Tidy meter and spotless places', steps: ['Under the Fluff bar: how tidy this place is. Clear spots and watch it fill, with a ping at each quarter.', 'Once a place is restored it counts down the last spots. Clear every one for a ✨ Spotless cheer (once per place a day).', 'The 🗺 map shows each place\'s %, ✓ restored and ✨ spotless today.'],
    setup: (s) => { s.day(3).time(9).go('lane'); } },
  { title: '🐟 Completing a collection', steps: ['Your fish log is one fish short. Cast at the river until a minnow bites.', 'Finish any set (treasures, critters or fish) for a big cheer, Sparkles and a ✓ Complete! stamp in Pause → 📖 Collection.'],
    setup: (s) => { s.state.fishLog = ['trout', 'moonfish', 'perch', 'carp', 'sardine', 'crab', 'mackerel', 'lobster', 'glowfin']; s.day(6).time(10).give('fishing_rod').go('riverside'); } },
  { title: '🎒 Tidy up the bag', steps: ['Your bag is a jumble. Open it (Bag, bottom right) and tap ✨ Tidy up.', 'Stacks merge and like sits with like: decor, seeds, crops, cooking, fish, then bits and bobs. Nothing ever goes missing.'],
    setup: (s) => { for (const [id, n] of [['pebble', 3], ['apple', 1], ['radish_seeds', 2], ['twig', 4], ['pebble', 2], ['minnow', 1], ['apple', 2], ['carrot_seeds', 3], ['twig', 1]] as [string, number][]) { const i = s.state.bag.slots.findIndex((x) => !x); if (i >= 0) s.state.bag.slots[i] = { id, count: n }; } s.day(6).time(10).go('burrow'); } },
  { title: '🧹 Tidying milestones', steps: ['Every spot you\'ve ever tidied counts. You\'re one away from 50.', 'Tidy one more spot: a cheer and Sparkles. Then 100, 250, 500, 1,000…'],
    setup: (s) => { s.state.finds.cleans.lane = 49; s.day(3).time(9).go('lane'); } },
  { title: '🏆 Town completion', steps: ['Pause → 🏆 shows how complete the town is: one number, and a bar for each part (places, story, collections, secrets, best friends, festivals).', 'It only ever goes up. Reach 100% for the biggest cheer in the game.'],
    setup: (s) => { for (const f of ['restored_burrow', 'restored_yard', 'restored_square', 'restored_bakery', 'festival_spring_fair']) s.flag(f); s.state.critters.push('ladybird', 'bumblebee', 'snail'); s.state.fishLog.push('minnow', 'trout'); s.state.story = { step: 14, asked: false, count: 0, day: 14 }; s.day(15).time(10).visited('boathouse').go('square'); } },
  { title: '🌙 The day\'s recap', steps: ['Tidy a few spots here (each one rings a rising note and a little ring), then head to bed.', 'As night falls: your day summed up (spots tidied, places spotless, fish, critters, crops, Sparkles), then the hint at tomorrow.'],
    setup: (s) => { s.day(3).time(18).go('lane'); } },
  { title: '🎧 How each place sounds', steps: ['Sound on! The river laps here. Use 🗺 to hear the waves and gulls at the beach, birds in the square, rustling woods, drips in the caves, and a quiet room indoors.', 'At night the birds hand over to crickets and the music slows; rain patters outside and on the windows indoors.'],
    setup: (s) => { s.day(20).time(10).visited('square', 'riverside', 'beach', 'woodland', 'cave_1', 'bakery', 'far_bank').go('riverside'); } },
  { title: '💬 A living town', steps: ['Watch the neighbours: little bubbles show what they\'re up to (bread, books, a fishing rod, a hum when they\'re happy).', 'Walk up to someone you\'ve met for a 👋, and tidy right beside them for a 😊.'],
    setup: (s) => { s.day(14).time(11).meet('hazel', 'bea', 'pip', 'otto', 'moss').go('square'); } },
  { title: '📖 The Keeper\'s Story', steps: ['The 📖 line at the top is today\'s story step: Otto has something for you. Talk to him and tap "📖 What\'s that you\'ve got?", then catch a fish.', 'Tap the 📖 line (or Pause → 📔 Keeper\'s journal) for the story so far.', 'Go to bed: a hint at tomorrow shows as night falls.'],
    setup: (s) => { s.state.story = { step: 4, asked: false, count: 0, day: 4 }; s.state.fishCaught = 0; s.day(5).time(9).flag('keeper_named').meet('hazel', 'bea', 'pip', 'otto').go('riverside'); } },
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
  { title: '🦊 Juniper the fiddler', steps: ['Juniper has moved into a cottage at the Woodland Edge. Say hello!', 'Juniper heard an old tune in the woods. Talk each day to follow it.', 'In a normal game, Juniper\'s letter arrives in the Lane on day 31.'],
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
    } },
  { title: '🍄 Mushroom logs', steps: ['The mushroom logs are set in the woods. Tap the soil to plant mushroom spores.', 'The damp logs keep them watered. Mushrooms grow in spring and autumn, only here. Cook 2 into mushroom soup.', 'In a normal game the logs join the Keeper\'s plans on day 30, and the General Store sells spores.'],
    setup: (s) => {
      s.day(30).time(10).give('mushroom_spores', 3);
      for (const [plot, b] of [['plot_footbridge', 'footbridge'], ['plot_overgrown_path', 'woodland_path']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 12, readyDay: 14 };
      s.state.plots.plot_mushroom_logs = { buildingId: 'mushroom_logs', stage: 2, startedDay: 29, readyDay: 30 };
      s.go('woodland');
    } },
  { title: '🍂 Leaf Grumbles', steps: ['From autumn, a crunchy orange Grumble sulks in the woods and up on Orchard Hill.', 'Rake it 3 times into a neat pile to befriend it.'],
    setup: (s) => { s.day(30).time(10); for (const [plot, b] of [['plot_footbridge', 'footbridge'], ['plot_overgrown_path', 'woodland_path']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 12, readyDay: 14 }; s.go('woodland'); } },
  { title: '🦉 Woodland critters', steps: ['Night in the woods: a copper moth flutters about, and a little owl is out.', 'By day look for a woodpecker (spring to autumn) and a stag beetle (summer). Pause → 📖 Collection says where.'],
    setup: (s) => { s.day(30).time(21); for (const [plot, b] of [['plot_footbridge', 'footbridge'], ['plot_overgrown_path', 'woodland_path']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 12, readyDay: 14 }; s.go('woodland'); } },
  { title: '🌿 The quiet glade', steps: ['You found a brass acorn in the woods. A gap has opened in the hedge on the right.', 'Step through to a quiet glade, read the mossy stone, and tidy it up.', 'In a normal game the acorn turns up while tidying the Woodland Edge.'],
    setup: (s) => {
      s.day(31).time(10);
      if (!s.state.finds.found.includes('brass_acorn')) s.state.finds.found.push('brass_acorn');
      for (const [plot, b] of [['plot_footbridge', 'footbridge'], ['plot_overgrown_path', 'woodland_path']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 12, readyDay: 14 };
      s.go('woodland');
    } },
  { title: '⚓ The Old Harbour', steps: ['The harbour gate at the east end of the beach is mended: walk right from the beach.', 'Jetties, old boats and three fishing spots: mackerel by day, lobster at night. Puffins in spring and summer, cormorants any day.', 'In a normal game, Mabel asks you to mend the gate in winter (day 49).'],
    setup: (s) => { s.day(47).time(10).give('fishing_rod'); for (const [plot, b] of [['plot_footbridge', 'footbridge'], ['plot_sea_steps', 'sea_steps'], ['plot_harbour_gate', 'harbour_gate']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 44, readyDay: 46 }; s.go('beach'); } },
  { title: '🧂 Salt Grumbles', steps: ['From winter, a crusty white Grumble sulks on the beach and at the harbour.', 'Sponge it 4 times to freshen it up and befriend it.'],
    setup: (s) => { s.day(47).time(10); for (const [plot, b] of [['plot_footbridge', 'footbridge'], ['plot_sea_steps', 'sea_steps'], ['plot_harbour_gate', 'harbour_gate']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 44, readyDay: 46 }; s.go('beach'); } },
  { title: '🏮 The net loft', steps: ['You found a lamp-room key at the harbour. A door has opened at the top of the harbour.', 'Step inside Thimble\'s old net loft, read the carving by the lamps, and tidy it up.', 'In a normal game the key turns up while tidying the Old Harbour.'],
    setup: (s) => {
      s.day(48).time(10);
      if (!s.state.finds.found.includes('lamp_key')) s.state.finds.found.push('lamp_key');
      for (const [plot, b] of [['plot_footbridge', 'footbridge'], ['plot_sea_steps', 'sea_steps'], ['plot_harbour_gate', 'harbour_gate']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 44, readyDay: 46 };
      s.go('harbour');
    } },
  { title: '🦭 Marlo the harbour keeper', steps: ['Marlo the seal has moved into a hut up from the quay. Say hello!', 'Marlo loves mackerel, rain and a good storm (from inside). Talk each day for their story about a lamp that went out.', 'In a normal game, Marlo\'s letter washes up on the beach on day 50.'],
    setup: (s) => { s.day(51).time(9).flag('letter_marlo_1_read').flag('invite_marlo').flag('home_marlo').give('mackerel', 2); for (const [plot, b] of [['plot_footbridge', 'footbridge'], ['plot_sea_steps', 'sea_steps'], ['plot_harbour_gate', 'harbour_gate'], ['plot_harbour_hut', 'cottage_marlo']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 44, readyDay: 46 }; s.go('harbour'); } },
  { title: '💡 Light the lighthouse', steps: ['Marlo is by the hut: tap "📜 Help me light the old lighthouse?".', 'Tidy the beach, ask Mabel about the old lamp, make something at a workbench, then tell Marlo.', 'When it\'s done, the lighthouse shines in a short scene.'],
    setup: (s) => { s.day(52).time(9).flag('letter_marlo_1_read').flag('invite_marlo').flag('home_marlo').meet('marlo', 'mabel').give('twig', 6).give('pebble', 2).sparkles(60); for (const [plot, b] of [['plot_footbridge', 'footbridge'], ['plot_sea_steps', 'sea_steps'], ['plot_harbour_gate', 'harbour_gate'], ['plot_harbour_hut', 'cottage_marlo']]) s.state.plots[plot] = { buildingId: b, stage: 2, startedDay: 44, readyDay: 46 }; s.go('harbour'); } },
  { title: '🐰 Thimble, year two', steps: ['Thimble is awake and living in town: by the fountain in the morning, the library with Moss, the river, home to their nook at night.', 'Talk each day for Thimble\'s story of the long sleep. The old neighbours each have something to say about Thimble being back.'],
    setup: (s) => { s.flag('keeper_named').flag('year_one_chapter').flag('scene_thimble_wakes').day(57).time(9).meet('hazel', 'moss').go('square'); } },
  { title: '🦇 Down in the Deeps', steps: ['In the caves: glow worms in the Glow Garden, and cave bats fluttering about.', 'The Warm Deep has a fishing spot in its pool: cast for a glowfin.', 'Pause → 📖 Collection says where each critter lives.'],
    setup: (s) => { s.day(33).time(10).give('fishing_rod'); for (const f of ['cave_leaf_1', 'cave_leaf_2', 'cave_leaf_3', 'cave_leaf_4']) s.flag(f); s.go('cave_2'); } },
  { title: '💧 Drip Grumbles', steps: ['From summer, a soggy blue-grey Grumble sulks in the caves.', 'Sponge it 3 times to dry it off and befriend it.'],
    setup: (s) => { s.day(24).time(10); for (const f of ['cave_leaf_1', 'cave_leaf_2', 'cave_leaf_3', 'cave_leaf_4']) s.flag(f); s.go('cave_1'); } },
  { title: '♨ Otto\'s cold baths', steps: ['Otto\'s baths have gone cold. Find Otto and tap "📜 Help me find out why my baths are cold?".', 'Spot a critter in the caves, catch a glowfin, ask Moss the next day, then tell Otto.'],
    setup: (s) => { s.day(46).time(10).meet('otto', 'moss').give('fishing_rod'); for (const f of ['cave_leaf_1', 'cave_leaf_2', 'cave_leaf_3', 'cave_leaf_4']) s.flag(f); s.go('riverside'); } },
  { title: '🏡 Thimble\'s nook', steps: ['You found a warm stone in the net loft. In the deepest cave, a crack has opened in the right-hand wall.', 'Step through to Thimble\'s own little home, read the carving by the armchair, and tidy it up.', 'In a normal game the stone turns up while tidying the net loft.'],
    setup: (s) => {
      s.day(47).time(10);
      if (!s.state.finds.found.includes('warm_stone')) s.state.finds.found.push('warm_stone');
      for (const f of ['cave_leaf_1', 'cave_leaf_2', 'cave_leaf_3', 'cave_leaf_4']) s.flag(f);
      s.go('cave_4');
    } },
  { title: '🎯 Today\'s goals', steps: ['Every day from day 2 brings three little goals, all different: tidy somewhere, catch a fish, cook, visit a friend...', 'Each one done is a cheer and +15 ✨, and all three is +40 more.', 'See them in the morning news and in 📔 the journal.'],
    setup: (s) => { s.day(12).time(9).give('fishing_rod').visited('yard', 'square', 'lane', 'riverside').go('square'); } },
  { title: '🔎 A lost treasure', steps: ['On some days a neighbour drops something precious somewhere outdoors.', 'Tidy the place in the news to find it hidden in the clutter, then take it back to them for a big thank-you.'],
    setup: (s) => { s.day(14).time(9).meet('hazel').visited('yard', 'square', 'lane').happening('lost').go('square'); } },
  { title: '🍃 Blustery days and more', steps: ['Two days in three, something is on in town: a blustery night, a fishing contest, a bake sale, a critter outing or a sparkle hour.', 'This one: the wind blew leaves into a few places. Rake up 12 for +40 ✨.'],
    setup: (s) => { s.state.tools.rake = Math.max(1, s.state.tools.rake ?? 0); s.day(16).time(9).visited('yard', 'square', 'lane').happening('breeze').go('yard'); } },
  { title: '📚 Sort the shelf', steps: ['Talk to Moss and tap "📚 Sort a shelf".', 'Tap two books to swap them, until the colours run in order, short to tall. Books glow as they land.', 'The fewest swaps earns 3 stars. The first shelf each day gives Sparkles; play on as long as you like.'],
    setup: (s) => { s.day(10).time(10).meet('moss').go('library'); } }
];
