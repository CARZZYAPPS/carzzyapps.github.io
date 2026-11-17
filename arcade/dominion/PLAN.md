# Dominion: Infinite Frontiers — build plan and status

Bonus game for Lazer Arcade, grown from Evan's concept deck (74 slides: mechanics, 18 engagement hooks, 14 monetization hooks).
**Not live.** This branch (`wip/dominion`) is the only place it exists. Do not merge to `main` until Evan says to publish.

## Layout
- `src/` — source parts. `src/build.sh` concatenates them into `index.html` (single-file game, like the other arcade games).
  - `01-core` data, state, save · `02-game` world gen, economy, quests, events · `03-battle` simulation + 2D fallback renderer
  - `03b-render3d` three.js battlefield · `04-flow` battle start/results, offers · `05-ui` screens · `05b-globe` three.js planet · `06-main` actions, boot
- three.js r128 from cdnjs (same as Crema). Both 3D views fall back to 2D canvas if WebGL is missing.
- Arcade id will be `dominion` (LZ.boot / LZ.endSession already wired; one endSession per battle win, tuned to roughly 70–100 LP/min).

## Done (verified in headless Chrome)
- Real-time squad battles: deploy cards, command points, Charge/Hold/Retreat, 4 power-ups, free General autopilot, 2× speed.
- 3D battlefields: hills (high ground), forests (cover), rivers with bridges or canyon walls (choke), walled forts with a destructible gate, turrets, relay towers that boost command regen, treasure chests, ambush waves.
- 3D globe: Core at the pole, capitals → state forts → cities → outposts, plus alloy mines and farms. Territory paints in your colour. 5 planet themes, endless planets.
- Economy: coins, food stamps, alloy, gems (earned in a trickle until payments exist), XP/levels, 8 soldier classes, gear tiers, fortress, enchantments, captives, feeding and feeding autopilot.
- Meta: main quest chain + endless side quests, badges, daily streak, weekly event with free/premium pass and limited Gauntlet mode, Blitz tournament, near-miss wheel, timed offers, alerts, AI rivals that raid you online and offline, alliances (AI for now), Hook Lens + Hook Report.
- Balance pass with an automated playthrough (see numbers in the session notes): prepared armies win capitals/cores; unprepared ones lose; militia safety net prevents a dead save.

## Not done
1. **Multiplayer (decided: shared world + live duels + free-text chat with filter).** Nothing written yet.
   - Could not be built blind: the build sandbox cannot reach Firebase, so it needs testing in a real browser against the live project.
   - Design: Firestore collections `dominionPlayers/{uid}` (public camp snapshot: name, flag, level, army, fortress, defense), `dominionReports/{uid}/inbox` (attack results applied on next login), `dominionAlliances`, `dominionChat/{channel}/msgs` (signed-in only, 120 chars, one message per 3 s via a per-user rate doc, client word filter, report button, admins can delete), `dominionQueue` (duel matchmaking).
   - Live duel: WebRTC data channel, Firestore only for signalling; host runs the simulation and streams snapshots at ~10 Hz, guest sends deploy/power-up commands. Falls back to an async fight against the opponent's AI-run camp when peer-to-peer is blocked.
   - Needs new blocks in `/firestore.rules` (deployed by the workflow on push to `main`).
2. Payments: not started. Needs Cloud Functions (Blaze plan) for Stripe Checkout + webhook. Sell gem packs, skins, event pass only.
3. Arcade listing: `games.json` entry with `"bonus": true`, BONUS badge in `arcade/index.html`, thumbnail `arcade/img/dominion.jpg`, mirror to EWieds.github.io.
4. Polish backlog: real-device performance check, alliance chat channel, more enemy variety per planet, music.
