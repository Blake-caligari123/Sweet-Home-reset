**Sweet Home Reset: Story Bible (first draft)**
*PixelVortex Games · SHR Story Lead · 27 Oct 2026 · Draft for team review. Sources: GDD-v2.pdf, GAME-DESIGN.md (v3 draft, Part A and Part B), gdd-v3/, v3-sections/. Anything marked **Proposed** is new and not yet in the GDD. Everything else restates an established fact. Never name another game in any player-facing text taken from this file. Headings start at level 4 so that tools/merge_gdd_v3.py can nest them under A11.7.*

#### 1. World premise and town history

##### 1.1 Established
- Pitch: "Help a sleepy little town get its sparkle back, one messy home at a time, and do one tiny real thing at home along the way."
- You play Puff the dust bunny in a small pixel town of seven areas. The Town Square is the hub. The other areas are Puff's burrow and yard, Neighbour Lane, Riverside (opens day 3), the Woodland edge (opens day 5), and the Beach and lighthouse.
- Colour floods back wherever Puff cleans. Puff starts Day 1 in a dim, grey burrow bedroom.
- The year has 4 seasons of 14 days each (56 days). Each season has one festival: Spring Clean Fair, Summer Picnic, Autumn Leaf Fest and Winter Lights.
- The long goal is to restore all six neighbour homes and relight the Town Square fountain by Day 56. At 8 hearts, Mabel's old maps reveal the fountain's history. At 10 hearts, the lighthouse and the fountain relight together.
- Heart events reveal why a home got messy ("a new baby, a busy season, feeling low"). The game never shames anyone for mess.

##### 1.2 Town history (Proposed)
- **The town is Hollowfern (Decided).** Its old saying is "Many paws, light work." The Town Square fountain, the **Glimmerwell (Decided)**, was built by the first settlers. Each spring, everyone brought one small clean thing to it, such as a polished spoon or a washed ribbon, and dropped it in with a wish. The water caught the light from the lighthouse across the bay and threw sparkles all over town. That shared glow is where the town's colour came from.
- **Why the fountain went dark (Proposed).** Nobody did anything wrong. A few years ago, a long wet winter was followed by a very busy spring. Hazel's rush doubled, Otto's uncle passed away, Pip's friend moved away and Mabel's eyes grew tired. Everyone got a little too busy or a little too low, so the spring gathering was skipped "just this once", and then again the next year. Mabel stopped climbing to light the lamp. Without its light and without the yearly gathering, the Glimmerwell went still and the colour faded slowly, like a photo left in the sun.
- **Why homes fell into mess (Proposed).** Mess in Hollowfern is a sign that life got heavy, never a judgement. Each neighbour's home holds the weight of their own story (section 3). As homes get messier, people visit each other less, and each neighbour thinks they're the only one struggling. Hollowfern's real problem is that everyone is quietly lonely. The dirt is just how that shows.
- **The moral, which the game never says out loud:** you don't have to fix everything. One small thing, done kindly, done together, is enough to start.
- **The colour rule (Proposed lore for the art direction):** colour comes back where care happens. That's why cleaning, gifts and friendships all brighten the town, and why the fountain needs everyone's colour, not just Puff's.

#### 2. Puff

##### 2.1 Established
Puff is a dust bunny who lives in a burrow. The burrow's rooms are the Kitchen Nook, Living Room and Bedroom, and it grows in 3 upgrade steps. Fluff is Puff's stamina: Puff yawns below 20 Fluff, and if Puff stays up past 2:00 they doze off and wake at home, free, with half Fluff. Each morning Puff sends a letter suggesting one tiny real chore, and skipping it is always fine. Puff never speaks down to anyone and is never sad, sick or angry about the player. Puff is 24×24 px in the world and 48 px in menus and dialogue. Pronouns: v2 uses "they".

##### 2.2 Backstory (Proposed)
*Origin Decided by Story Lead (2026-10-27).* Puff gathered together out of the soft fluff and forgotten bits under the Glimmerwell's stone rim: lint from scarves, a thread from a festival ribbon, a little of the last sparkle the fountain ever threw. Puff wakes in an empty, grey burrow that nobody has lived in for years, knowing only one thing: *where I tidy, colour comes back.* Puff has no memories, just a warm feeling that the town used to sparkle and could again. Puff doesn't know they came from the fountain. Mabel's maps (8 hearts) show a drawing of "the Well's little keeper, born of what the town lets fall", and the player works it out before Puff does.
- Dust bunnies are normally the thing you sweep away. Puff is the reverse: proof that even forgotten fluff can hold some warmth. This is Puff's quiet tie to the "never shame mess" rule.

##### 2.3 Motivation, quirks and voice (Proposed)
- **Want:** see Hollowfern sparkle. **Need:** to belong. Puff is the newcomer who makes a home by helping others make theirs.
- **Quirks:** sneezes when happy ("pff!"). Hops into dust piles. Names their tools ("Spongey", "Sir Duster"). Can't resist putting a sock in a basket. Hums while scrubbing. Gets sleepier and rounder as Fluff drops. Keeps one thing from every restored home in a "memory jar".
- **Voice:** short, bright, curious. Mostly present tense. Lots of small wonder ("Ooh."). Never sarcastic and never sighs at mess. When Puff praises someone, it's for what they did or felt, never how they look. Puff asks before helping. Every line is 60 characters or fewer for localisation.
- **Sample lines:**
  - Waking on Day 1: "Ooh. Grey. Let's fix that."
  - First clean: "Look! Colour came back!"
  - Low Fluff: "Getting fluffy-sleepy... one more?" / "Snack time, maybe."
  - Dozing off at 2:00: "Zzz... just resting my fluff."
  - Clutter put in the wrong place: "Close! Socks live in the basket."
  - Meeting a neighbour: "Hi! I'm Puff. I like tidying. Can I help?"
  - A missed request: "Hazel found her rolling pin! All good."
  - Coming back after time away: "You're back! I saved you a sparkle."

##### 2.4 The real-chore hook (warm, no guilt)
Established: the morning letter offers one tiny chore matched to what Puff cleaned yesterday, at 5 a day max. It never blocks progress, and skipping is fine. The Our Home scrapbook collects stickers.
- **Proposed framing:** Puff writes because Puff loves hearing about the player's home. Letters are never homework. Every letter ends with the same two choices, "I did it!" and "Not today", and both get the same warm reply.
  - Example: "Dear friend, I polished Hazel's counter. My paws sparkle! Maybe wipe one counter of yours? Or just have tea. Both are lovely. ♥ Puff"
  - After the daily cap: "That's loads today. Rest counts too."
- **Proposed:** in the year-1 finale, Puff drops one Our Home sticker into the Glimmerwell, "for your home, too". This holds even with zero chores ticked: the sticker becomes "a cosy day", so no player is left out.

##### 2.5 Growth across the year (Proposed)
- **Spring:** a curious stranger. Learns names, then learns that mess has stories. Arc beat: "I thought I was here to clean. I'm here to help."
- **Summer:** belonging. Gets invited to things, not just asked for help. Learns to rest (the dozing-off scene is played for comfort).
- **Autumn:** a wobble. Puff finds out the colour is fading at the edges of their own fur, because the fountain is still dark. Puff isn't sick and doesn't suffer. It's a gentle mystery, and the neighbours now look after Puff.
- **Winter:** the gift returned. Puff learns where they came from (Mabel 8) and that the fountain needs everyone, not just Puff. The finale is the town doing the "Many paws" gathering again. Puff has stopped being the town's cleaner and become its friend.

#### 3. Neighbours

*Established for every neighbour: home, personality, the Loves column, the heart unlocks from v2, and talk +1, liked gift +3, loved gift +8, request +10, 10 points a heart, hearts never drop. v3 A7 outlines are placeholders, so I've kept them where they work and overruled some (listed in 8.4). Likes, dislikes, secrets, routines and speech patterns are all **Proposed**. "Remembers" means the event reads save flags (section 7).*

##### 3.1 Hazel the hedgehog (bakery kitchen) · free
- **Personality (established):** busy, warm, a bit frazzled. **Loves (established):** fresh bread, flowers. **Likes:** berries, honey, a clean apron. **Dislikes:** clay, mud ("Not near the dough, petal!").
- **Want or wound:** to be needed. She's afraid that if she stops, she'll stop mattering. **Secret:** her gran's tart recipe has a missing step she has never been able to remember.
- **Routine:** bakes from 6:00 to 11:00, has the shop open 11:00 to 17:00, and falls asleep in a chair by 21:00. Closed on day 7 of each week after her 6-heart event.
- **Speech:** quick, calls everyone "petal", stops mid-sentence to check the oven. "Puff, petal, could you just — oh, the buns!"
- **Relationships:** feeds Pip, who's like a son to her. Old rival of Bea over who has the best window. Sends Otto loaves, unasked, since his uncle died.
- **Hearts:** 2: the oven has been grimy since the morning rush doubled (A7). Remembers whether the player cleaned her counter in the onboarding request. 4: Puff finds her asleep standing up. She admits she bakes for everyone but never sits down. 6: a recipe for cooking snacks (C6). Puff helps her paint a "Closed Sundays" sign, in the colour the player chooses, which stays visible in town. 8: she teaches Puff her gran's tart, the missing step is "share it while it's warm", and the player can choose who gets the first tart. 10: she holds a tea for Puff with her feet up, and the guest is whoever Puff gave the first tart to.

##### 3.2 Bea the bee (flower shop) · free
- **Personality (established):** organised, chatty. **Loves (established):** honey, rare seeds. **Likes:** flowers, string, notebooks. **Dislikes:** weeds, crumbs.
- **Want or wound:** to be perfect so no one is let down. **Secret:** she has never let a single flower grow wild.
- **Routine:** opens at 8:00 sharp, lists from 13:00 to 14:00 in the back room, walks the Riverside at 18:00.
- **Speech:** buzzy lists, numbering her own sentences. "Three things! One: hello. Two: seeds. Three: did I say hello?"
- **Relationships:** a friendly window war with Hazel. Pip's toys are the one mess she secretly adores. She waters Moss's doorstep plants without telling him.
- **Hearts:** 2: the front shop is perfect and the back room is chaos (A7). 4: lists everywhere. She's scared of letting anyone down, and Puff helps her throw out one list. 6: greenhouse unlocked. 8: she lets Puff design the window display, which shows the player's choice of three items. 10: she plants a flower bed for Puff with no plan at all, made from seeds the player has gifted her.

##### 3.3 Pip the mouse (toy workshop) · free
- **Personality (established):** creative, messy. **Loves (established):** buttons, string. **Likes:** silk thread, shells, clay. **Dislikes:** soap ("It's for later!").
- **Want or wound:** connection. Every toy was made for Wren, a friend who moved away (Decided). **Secret:** Pip has a letter from Wren he's never opened, because he's scared it says goodbye.
- **Routine:** sleeps until 10:00, works until 2:00, pops out to Hazel's for crumbs around 15:00.
- **Speech:** tumbling, invents words, ends lines with "...right?" "It's a bunny-copter! Kind of. Right?"
- **Relationships:** Hazel's surrogate son. Moss's only regular library visitor. Makes Otto bath toys.
- **Hearts:** 2: half-finished toys on every surface (A7). 4: each toy was for Wren. 6: bag upgrade. Puff and Pip finish one toy together, and its colour comes from the button the player gifts. 8: Pip mails the toy, and Puff helps him finally open Wren's old letter (overrule: adds the unopened letter). 10: a reply arrives, warm, with a drawing of the toy. Pip opens the workshop to the town, and a toy of Puff appears on the shelf.

##### 3.4 Otto the otter (Riverside bathhouse) · Plus
- **Personality (established):** cheerful, loves bubbles. **Loves (established):** shells, soap. **Likes:** fresh bread, fibre, river stones. **Dislikes:** cobwebs, silk thread.
- **Want or wound:** grief. The bathhouse belonged to his late Uncle Brook (Decided), and he isn't sure he's good enough. His cheerfulness is partly a cover. **Secret:** he can't swim very well.
- **Routine:** fishes at 6:00, polishes the brass from 10:00 to 16:00, and sits alone on the jetty at 20:00.
- **Speech:** puns about water, laughs a lot, goes quiet when he talks about Brook. "Water you up to, Puff? Heh. Heh."
- **Relationships:** Hazel's loaves keep him going. Mabel was Brook's best friend. Pip's bath toys are lined up on his windowsill.
- **Hearts:** 2: soap scum and a closed bathhouse (A7). 4: it was Brook's, and he isn't sure he's good enough. 6: Silver squeegee recipe and reopening day, where the first guests are the neighbours with the most hearts. 8: he adds a bubble bath for tired neighbours and admits he can't swim, so Puff and Otto paddle in the shallows. 10: a bath-night party for the whole town. Mabel tells a story about Brook, and Otto laughs for real.

##### 3.5 Moss the mole (dusty burrow library) · Plus
- **Personality (established):** shy, bookish. **Loves (established):** books, mushrooms. **Likes:** tea, old maps, lint. **Dislikes:** loud bubbles, flowers (they make him sneeze).
- **Want or wound:** to be around people without wearing himself out. The library became his hiding spot (A7). **Secret:** he writes stories and has never shown anyone.
- **Routine:** opens 10:00 to 16:00 behind closed curtains. Reads aloud to himself at 22:00, and Puff can overhear him from the doorway.
- **Speech:** few words, long pauses ("..."), very precise. "Hello. ... You may stay. Quietly. If you like."
- **Relationships:** Pip is the only one he lets in. Bea's secret plants. Mabel lends him maps.
- **Hearts:** 2: books stacked to the ceiling, curtains shut (A7). 4: people tire him out, so the library became his hiding spot. Puff offers to come back "only when you wave", and Moss gets a waving sign. 6: cellar unlocked, with a reading nook just for one. 8: he starts a quiet hour for others and shows Puff one of his stories, which is about a dust bunny. 10: Moss reads that story aloud at the fountain. It includes three things the player did that year, taken from save flags.

##### 3.6 Mabel the owl (lighthouse) · Plus
- **Personality (established):** wise, sleepy by day. **Loves (established):** tea, old maps. **Likes:** books, honey, silk thread. **Dislikes:** mud, crumbs at night.
- **Want or wound:** her eyes are tired and the climb is long (A7). She feels she's the one who let the light go out. **Secret:** she knows where Puff came from and has been waiting to see whether Puff is "the little keeper".
- **Routine:** asleep from 6:00 to 17:00. Takes visitors from 18:00 to 1:00, and lights a candle at the window in the hours the lamp should be lit.
- **Speech:** slow, owlish, rhyming proverbs. "Hoo. Many paws, light work."
- **Relationships:** Brook's best friend, now keeping an eye on Otto. The town's memory. She knew Hazel's gran.
- **Hearts:** 2: salt-crusted windows, the light's off (A7). 4: her eyes are tired and the climb is long. Puff fixes the stair rail. 6: lamp-night event unlocked (C3, Accepted). 8 (established): old maps reveal the Glimmerwell's history, the "Many paws" gathering and the drawing of the little keeper. Remembers how many homes are restored. 10 (established): the lighthouse and fountain relight together. This is the year-1 finale (section 4).

#### 4. Year-1 arc

##### 4.1 Spring (days 1–14, free): "Something's waking up"
- **Beats:** Puff wakes and restores the burrow. Meets Hazel, Bea and Pip. The town goes from grey to the first pastels. Goal by day 14 (established): 3 homes restored and the first festival.
- **Festival, the Spring Clean Fair (established, day 14):** Proposed beat: the town gathers in the square for the first time in years, because Puff's three friends put up posters. In the fair mini-game, everyone tidies the square together. At the end, the Glimmerwell trickles. It's one drop, then a faint shimmer, the first sign the fountain can come back. Hazel, Bea and Pip each thank Puff by name for something the player did. Fireworks, then a reveal clip.
- **The emotional high before the offer:** spring is a complete story. It ends: "Hollowfern remembered how to gather." The free arc closes fully: three friends, a trickling fountain and a party.
- **Plus offer (established timing: after the fair, never mid-task; capped at once per in-game week after a dismiss, C5 Accepted):** shown only after the fair has ended and the player is back home. Proposed framing is a postcard rather than a wall: "Spring is free. Summer, autumn and winter need Plus." It shows Otto, Moss and Mabel as silhouettes and promises "more friends, more seasons". "Not now" is the bigger, equal button. Puff's reply is the same either way: "Best spring ever." Free players can keep playing spring (the lapse and freeze rules are in the GDD).

##### 4.2 Summer (days 15–28, Plus): "Belonging"
- Riverside and Otto. Bathhouse reopening day. Puff gets invited to things, not just asked for help.
- **Festival, the Summer Picnic (established):** Proposed beat: a picnic by the river where everyone brings a dish. The mini-game is setting the blanket. Otto laughs for the first time without a pun, and the fountain's trickle becomes a small arc.

##### 4.3 Autumn (days 29–42, Plus): "The wobble"
- The Woodland edge, Moss and the library. Puff's fur dims at the edges (Proposed), and the neighbours start caring for Puff: snacks left at the door, Hazel's tart.
- **Festival, the Autumn Leaf Fest (established):** Proposed beat: leaf piles and a lantern walk to Moss's library. Moss joins in for one minute. That's his victory, and everyone claps quietly.

##### 4.4 Winter (days 43–56, Plus): "Many paws"
- The Beach, lighthouse and Mabel, unlocking on day 43 (C1, Accepted). Mabel 8: the maps and Puff's origin.
- **Festival, Winter Lights (established), as the finale:** Proposed beat: on day 56, all six neighbours walk to the square with one small clean thing each, which the player helped them find. Mabel climbs the lighthouse with Otto's help and Puff drops the Our Home sticker in. The lighthouse and fountain relight together (established), colour sweeps over the whole map, and Puff's fur is bright again. Moss reads his story. Credits roll over a montage of the reveal clips.
- **Note:** if Mabel hasn't reached 10 hearts by day 56, the finale waits for her. Proposed: the fountain is still very bright, and the finale plays whenever Mabel reaches 10 hearts. It's never lost and has no deadline.

#### 5. First 30 minutes (story layer on A6)

*A6 timings and steps are established and kept. The lines are **Proposed**.*
- **Hook (0:00):** title, "Let's tidy!", then grey. A single sparkle drifts down onto a lump of fluff in a dim, grey burrow bedroom. It sneezes ("pff!"): that's Puff. "Ooh. Grey. Let's fix that."
- **Puff's intro (0:15–1:30):** tapping to walk, Puff explores the burrow. Dusting the first patch floods it with colour: "Look! Colour came back!" Putting the sock away: "Socks live in baskets. I just know it."
- **The first room (2:30–5:00):** the Kitchen Nook stain takes three hits ("Spongey, go!"). The Fluff hint is a yawn. At the 95% burrow reveal: "It's... a home. Is it mine?" A tiny cushion appears: "It's mine."
- **Yard (6:30):** planting radishes: "Grow big. No rush."
- **The first neighbour (9:00), Hazel at the bakery door:** "Oh! A dust bunny! I mean, hello, petal! Tart? You look peckish." She hands over the Berry tart. The notice board request: "Dust Hazel's shop counter." Clearing it sets a flag that her 2-heart event remembers. Bea and Pip are met on Neighbour Lane ("Three things! One: hello!" / "Is that a real bunny? Can I draw you? Right?").
- **Evening and bed (17:00–20:00):** "Puff's getting sleepy. Head home to bed." The first letter is written in Puff's voice as in section 2.4. The hook question to leave the player with (Proposed): from the window, Puff sees the dark fountain. "Why is that so quiet?"
- No paywall, sign-in or rating prompt (established).

#### 6. Living-world detail

##### 6.1 Dialogue pool rules (Proposed)
- **Each neighbour has pools tagged by:** `season`, `weather` (sunny/rainy/windy/snowy), `timeBand` (morning 6–11, day 11–17, evening 17–22, night 22–2), `heartsMin`/`heartsMax`, `area`, and optional `flags`.
- **Selection order:** the most specific match wins (flag > hearts > weather > season > time > generic). Within a tier, pick a random line that hasn't been seen in the last 5 talks (saved). Talking once a day gives +1 (established), and after that the neighbour gives short "busy" lines with no extra points.
- **Minimum pool sizes:** 3 lines per season, plus 2 per weather, 2 per time band and 3 per heart band (0–2, 3–5, 6–8, 9–10). That's about 40 lines per neighbour per year.
- **Rules:** no guilt words (the banned list from the GDD: "failed", "overdue", "lazy", "lost"), no talk about bodies or appearance, and no complaints about the player. A missed request gets a "no worries" line.

##### 6.2 Reactive gossip (Proposed)
After a home reveal, a heart event or a festival, the other neighbours get a one-day gossip line, e.g. Bea: "Three things! Hazel sat DOWN. Two: in a chair. Three: wow." Gossip is always about something good. At most one gossip line per neighbour per day.

##### 6.3 Letters (Proposed)
- Puff's morning chore letter (established) comes first. Neighbours sometimes add a short note: thanks after a request, an invitation to a heart event, or a festival poster. Max 2 notes a day.
- The Our Home scrapbook gets a sticker for every chore ticked (established), plus "cosy day" stickers for rest days.

##### 6.4 Small mysteries (Proposed)
1. **The night humming:** a tune is heard near the square at night in spring. It turns out to be Moss reading aloud (his autumn story). The payoff is the Moss 10 heart event.
2. **The unopened letter:** a sealed envelope sits on Pip's shelf from day 2. It's from Wren, and it's opened at the Pip 8 heart event.
3. **The sparkle on Puff's fur:** at the start, one fleck of Puff's fur doesn't match the palette. It's the fountain's last sparkle, and its payoff is Mabel 8.
4. **The window candle:** a light appears in the lighthouse window at night, visible from the beach path from day 1. It's Mabel keeping the hours, and it pays off when the player meets her.
5. **Hazel's missing step:** the gran's tart tastes "nearly right" in spring. The payoff is Hazel 8.

#### 7. Pack JSON example (Hazel, 8 hearts)
Proposed shape, to be validated against the pack schema (the neighbours → heart events field in the GDD). The ids are stable and the text lives in string tables.
```json
{
  "id": "he_hazel_08",
  "neighbourId": "hazel",
  "hearts": 8,
  "trigger": { "type": "enterArea", "areaId": "bakery_kitchen", "timeBand": ["morning"] },
  "conditions": {
    "heartsMin": 8,
    "seen": ["he_hazel_06"],
    "notWeather": [],
    "notFestivalDay": true,
    "fluffMin": 0
  },
  "scene": [
    { "speaker": "hazel", "line": "he_hazel_08.l01", "emote": "flour_puff" },
    { "speaker": "puff",  "line": "he_hazel_08.l02" },
    { "speaker": "hazel", "line": "he_hazel_08.l03", "if": { "flag": "onboard_counter_done" } },
    { "speaker": "hazel", "line": "he_hazel_08.l03b", "if": { "notFlag": "onboard_counter_done" } },
    { "choice": "he_hazel_08.c01", "options": [
        { "label": "he_hazel_08.c01.bea",  "setFlag": "first_tart_bea" },
        { "label": "he_hazel_08.c01.pip",  "setFlag": "first_tart_pip" },
        { "label": "he_hazel_08.c01.self", "setFlag": "first_tart_hazel" } ] },
    { "speaker": "hazel", "line": "he_hazel_08.l04" }
  ],
  "rewards": { "recipe": "gran_tart", "sparkles": 0 },
  "setFlags": ["he_hazel_08_done"],
  "skippable": true
}
```
English string table (`en-AU`):
```json
{
  "he_hazel_08.l01": "Puff, petal! Gran's tart. Help me get it right?",
  "he_hazel_08.l02": "Ooh. Yes please!",
  "he_hazel_08.l03": "You dusted my counter on your very first day.",
  "he_hazel_08.l03b": "You've helped so much this spring, petal.",
  "he_hazel_08.c01": "The missing step: share it while it's warm. Who first?",
  "he_hazel_08.c01.bea": "Bea",
  "he_hazel_08.c01.pip": "Pip",
  "he_hazel_08.c01.self": "You, Hazel!",
  "he_hazel_08.l04": "Warm and shared. Gran would be proud."
}
```
**Localisation notes:**
- Lines are 60 characters or fewer in English, so leave about 40% room to grow for other languages.
- No puns that a scene depends on. Otto's puns have a non-pun alternative key (`.alt`), and translators may use either.
- "petal" is a term of endearment, so translate it to the local equivalent.
- Neighbour names are localisable, so use ids, never names, in logic.
- Avoid gendered grammar for Puff ("they" in English). Translators should pick neutral forms or a noun ("the bunny").
- Use a plural-aware format (ICU) for counts. No text inside images.
- Australia launches first, so `en-AU` spelling ("colour", "neighbour") is the source.

#### 8. Timeline, open threads, decisions and clashes

##### 8.1 Timeline (Proposed unless marked)
- **Years before the game:** the Glimmerwell gathering lapses, Brook dies, Wren moves away, and Mabel stops climbing to light the lamp.
- **Day 1:** Puff wakes and meets Hazel, Bea and Pip (established beat).
- **Day 3:** Riverside opens (established). **Day 5:** the Woodland edge opens (established).
- **Day 7:** 1 home restored (established target). **Day 14:** the Spring Clean Fair, the first trickle, then the Plus postcard.
- **Days 15–28:** Otto and the Summer Picnic. **Days 29–42:** Moss, the fur wobble and the Autumn Leaf Fest.
- **Days 43–56:** Mabel, her 8-heart reveal and Winter Lights. **Day 56:** the lighthouse and fountain relight (established).

##### 8.2 Open threads
- Year 2 hook (Proposed): a letter from Wren saying "Can I come home?", a seventh neighbour.
- Weekly visitors (in Plus, established) need story roles.
- The optional puzzle cellar (in the GDD as "later") could hold the first settlers' things.

##### 8.3 Decision log (draft)
- **Decided by Story Lead (2026-10-27):** the town's name (Hollowfern), the fountain's name (Glimmerwell), the "Many paws, light work" saying, and Puff's origin (the fountain's fluff and last sparkle).
- **Decided by Story Lead (2026-10-27):** Puff uses "they". **Proposed:** The fountain went dark from no one's fault. A finale that hasn't triggered by day 56 waits for Mabel, with no deadline.
- **Decided by Story Lead (2026-10-27):** new character names Wren and Uncle Brook.
- **Accepted 2026-10-27 by BB Manager:** C1 Beach and lighthouse unlock on day 43; C2 Mabel 3-heart reward is an old shore map; C3 Mabel 6-heart is a lamp-night event, not a festival; C5 Plus offer capped at once per in-game week after a dismiss; C6 the Copper recipe is sold at the General Store from day 5, and Hazel 6-heart gives a snack recipe.
- **Locked:** milestone order follows v2: all 6 neighbours in M2, neighbours 4–6 behind Plus.
- **Proposed:** the Plus offer is a postcard after the fair, back at home, with an equal "Not now" button.

##### 8.4 Clashes with the GDD and overrules of A7
- **C1 Beach unlock vs Mabel:** v2 opens the Beach and lighthouse at 3 hearts with Mabel, but Mabel lives at the lighthouse, so the player can't earn hearts before reaching her. Proposed: the Beach opens at the start of winter (day 43) or after Otto 3 hearts, since he knew Brook's friend. **Accepted 2026-10-27 by BB Manager:** the Beach and lighthouse unlock on day 43.
- **C2 Mabel's 3-heart woodland map vs the Woodland edge opening on day 5:** that unlock is redundant. Proposed: Mabel's 3-heart reward becomes the "old shore map" mystery item. **Accepted 2026-10-27 by BB Manager:** Mabel's 3-heart reward is an old shore map.
- **C3 Mabel's 6-heart "night festival" vs one festival per season:** proposed: make it a night event or "lamp night", not a festival, or fold it into Winter Lights. **Accepted 2026-10-27 by BB Manager:** her 6-heart event is a lamp-night event, not a festival.
- **C4 Free-tier Mabel:** Mabel is Plus, so free players never see the fountain's history. Proposed: free spring ends at the first trickle, which is a complete beat on its own.
- **C5 Plus offer frequency:** v3 A2 and the backend section say "at most once a day", while the older v3 backend text in v3-sections/backend.md says "once per in-game week after a dismiss". The story prefers the weekly rule (it's less pushy). **Accepted 2026-10-27 by BB Manager:** capped at once per in-game week after a dismiss.
- **C6 Hazel's 6-heart Copper sponge vs "crafted a Copper tool by day 7":** a 6-heart event by day 7 is unlikely. The Copper tool on day 7 needs another recipe source. **Accepted 2026-10-27 by BB Manager:** Builder sources the day-7 Copper tool recipe elsewhere.
- **C7 Pronoun for Puff:** v2 uses "they". **Decided by Story Lead (2026-10-27):** "they".
- **Overrules of A7:** Hazel 8 adds the missing step and the "who gets the first tart" choice, and Hazel 10 adds the remembered tart guest. Bea 4 adds throwing out one list, and Bea 10 says the seeds come from the player's gifts. Pip 8 adds the unopened letter from Wren. Otto 8 adds his secret (he can't swim), and Otto 10 adds Mabel's story about Brook. Moss 4 adds the waving sign, Moss 8 adds his story about a dust bunny, and Moss 10 says the story mentions the player's actions. Mabel 4 adds the stair rail, and Mabel 8 adds Puff's origin. Apart from these, the A7 beats are kept word for word.
