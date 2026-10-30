# Short-form plan: Sweet Home Reset

No video can be guaranteed to go viral. This plan stacks the signals that short-form feeds reward, then tests until one sticks.

## What the research says
- **Viewed vs swiped away is the first gate.** Shorts that most people watch rather than swipe get shown to more people. Sources put a good rate at roughly 65–75%+ viewed. The decision happens in the first 0.5–2 s.
- **Average % watched beats raw length.** Under ~20–30 s helps. A seamless loop can push average viewed above 100%, because people rewatch before they notice it restarted.
- **The first frame needs movement and a caption.** Many viewers watch with the sound off.
- **Gameplay that explains itself beats polished trailers** for discovery. Show the core action with no context needed.
- **Satisfying before/after cleaning is a proven pull.** Cleaning-ASMR games grew straight out of this kind of clip.
- **Test different hooks.** Post versions with different openings and judge them on swipe-away, not views.

## The video (`short.html`, 16 s, 1080×1920)
| Signal | How the loop delivers it |
|---|---|
| Hook in frame 1 | A grey, messy room, a finger already tapping, and the caption on screen |
| Watch to the end | A progress bar from 0% to 100%: viewers stay to see it finish |
| Satisfaction | Every tap pops with sparkles and a circle of colour; pops climb in pitch; taps speed up as the combo grows |
| A surprise | A grumpy Dust Grumble in the bakery cheers up at the halfway point |
| Payoff | A full-room colour flood, "100% SPARKLY!", confetti |
| Rewatches | The last frame slides into the first: a seamless loop |
| Platform safe areas | Text sits at the top, clear of the like/comment buttons and title at the bottom and right |
| Sound off still works | Everything reads from the visuals and captions |

## Hooks to A/B test
- **a:** "POV: every tap brings the colour back" (identity and curiosity)
- **b:** "wait for the colour flood at 100%" (promises a payoff, so people watch to the end)
- **c:** "rate how satisfying this is from 1 to 10" (gets comments)

## Three more formats (`../shorts/`)
Each is a different kind of video, so the feeds treat them as different content, and each reaches a different audience.

| Video | Format | Hook | Why it works |
|---|---|---|---|
| `shr_timelapse.mp4` (20 s) | Progress timelapse | "I spent 56 days restoring this town" + a day counter | A big transformation; a new restoration every ~1.5 s keeps people watching; the payoff lands at the end |
| `shr_skit.mp4` (17 s) | Relatable comedy skit | "me at 2am:" + a sudden idea | Relatable humour gets shared; meme beats (the mess reveal, the speedrun, a freeze frame); ends on the game's gentle rule that dozing off is free |
| `shr_asmr.mp4` (20 s) | Slow ASMR | "turn your sound on 🎧" | Sound-first and calm; macro close-ups; gets saves and rewatches; reaches the relaxing-video audience |

## How to post it
1. Week 1: post **a** on YouTube Shorts, TikTok and Instagram Reels. Post **b** two to three days later, then **c**. Don't post them on the same day.
2. After 48 hours, compare Viewed vs swiped away (YouTube Studio) and average % watched. Keep the winning hook and drop the rest.
3. Pin a first comment that asks a question ("which room should Puff clean next? 🏠"). Reply to early comments within the first hour.
4. Make follow-ups from the winning format: new rooms, a "cleaning every room in town" series, "reply to a comment" videos, and the morning letter ("this game asks you to do one tiny real chore").
5. Save the cinematic trailer (`../cinematic/`) for the store page and press. It's not for the feed.
6. Once there's a store or wishlist page, link it in the bio and descriptions. Track wishlists per clip, not just views.

## Rules kept
No other games named. No prices (iOS rule). No release date. Grok credit goes in the description. The copy stays kind ("tidy", "sparkly"; never shaming mess).

## Re-render
From `art/trailer/`:
```
(cd viral && python3 music.py)
node lib/render.js viral/short.html?v=a video viral/shr_loop_a.mp4 viral/audio.wav   # or v=b / v=c
```
