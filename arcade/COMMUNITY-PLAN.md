# Lazer Arcade: Community games (TO BUILD)

Status: plan. Creator earnings (below) are already live via `.github/scripts/creator-earnings.js`.

## The section
- Reached from a "Community games" button on the arcade home. Same sign-in, profiles and look as the rest of the arcade.
- Community games are NOT listed with the main lineup and have **per-game leaderboards only** (no community total board).
- Build modes: remix an existing engine (instant publish) or code from scratch (needs approval first). From-scratch code runs in a sandboxed frame.
- Standout games get promoted to the main lineup, where they award player LP.
- Launch showcase: "Dockyard Tycoon" (branch `wip/dockyard-tycoon`), the crane-stacking remix of Crema's Rush engine.

## Creators
- Creators earn LP from their games' popularity (share of LP, plays, visits). Config: `arcade/creators.json`.
- **Top creators' points are doubled** (`topCreatorMultiplier`).
- A "Top creators" board ranks creators by creator LP.
- **Lazer Arcade itself is a community game by LazerYudel.** Every game on the arcade and every site visit contributes to it, so its creator earnings come from the whole site. Its leaderboard is simply the overall LP board, and clicking it redirects to `/arcade/`.
- LazerYudel (creator) gets a one-time Legend seed (1,000,000 LP) spread across games by popularity, and holds the top creator spot.
