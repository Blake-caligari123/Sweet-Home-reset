# Ratings and privacy forms (draft, 30 Oct 2026)
Answers for the IARC questionnaire (Google Play and others), Apple's age rating, Apple's App Privacy labels and Google's Data safety form. They must stay true to what the game does and match `apps/web/public/privacy.html`. Blake submits them; Ops can choose a higher age band on purpose.

## Content (IARC and Apple age rating)
| Question | Answer | Why |
|---|---|---|
| Violence of any kind | None | Grumbles are befriended, never harmed. |
| Fear or horror | None | |
| Sexual content or nudity | None | No romance (VISION §6). |
| Crude humour or bad language | None | Copy is a kind friend (CLAUDE.md). |
| Drugs, alcohol, tobacco | None | |
| Gambling or simulated gambling | None | No random paid rewards or loot boxes (CLAUDE.md hard rules). |
| Users can talk to each other or share content | No | No chat or visits; the reveal clip and screenshots are made on the device and shared only by the player's own share sheet (GDD A2). |
| Shares the user's location | No | |
| Digital purchases | Yes | One non-consumable "Full game" unlock, behind a grown-up question. |
| Unrestricted web access | No | |
| **Likely result** | Everyone / 4+ | Separate from the 16+ policy for accounts. |

## Apple App Privacy (nutrition label)
- **Data used to track you:** none. No IDFA, no ad SDKs, no third-party analytics.
- **Data linked to you** (only for players who make an account):
  - Contact info: email address (app functionality: sign-in).
  - User content: game progress, the cloud save (app functionality: sync).
  - Purchases: purchase history (app functionality: the unlock).
- **Data not linked to you:** usage data, anonymous gameplay counts with a random install id (analytics; can be turned off in Pause).

## Google Play Data safety
- Collected: email (optional account), app activity (anonymous gameplay counts), in-app purchase history, game progress (optional cloud save).
- Shared with third parties: no (Cloudflare, Resend, Stripe, RevenueCat, Apple and Google act as processors).
- Encrypted in transit: yes. Players can request deletion: yes (in the app, and the public /delete-account page).
- Required to use the app: none of it. Every item is optional or can be turned off.

## Families
Not listed in the Kids category: its rules don't allow this kind of purchase and link (VISION §10). The store rating is still for everyone.
