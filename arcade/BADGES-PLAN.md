# Lazer Arcade: Badges and Perks (TO BUILD, NOT IMPLEMENTED)

Status: instruction only. Nothing in this file has been built yet. When asked to "build the badges feature," follow this spec.

## Goal

Leaderboard badges that mark achievements and milestones, where higher tiers unlock real privileges (for example, 50,000 LP unlocks early access to new games). Players should want to climb for the perks, not just the number.

## Two kinds of badges

1. **Tier badges** (lifetime Lazer Points). Automatic, shown next to the username on every leaderboard row, in the same style as the existing `creator` / `admin` role badges in `arcade/index.html`.
2. **Achievement badges** (from `arcade/achievements.json`). Each existing achievement gets a badge icon. Players can pin up to 3 to their leaderboard row.

Staff roles (`creator`, `admin`, from `roles.json`) stay separate and always display first.

## Tier ladder (lifetime LP, from `arcadePlayers.lp`)

| Tier | LP needed | Perk unlocked |
|------|-----------|---------------|
| Bronze | 25,000 | Badge + name color on leaderboards |
| Silver | 50,000 | Pin up to 3 achievement badges |
| Gold | 100,000 | Vote on which queued game ships next |
| Platinum | 250,000 | **Early access** to every new game (see below) |
| Diamond | 500,000 | Beta access to unreleased builds + name on the credits wall |
| Legend | 1,000,000 | All of the above + permanent "Founding Player" frame |

Pacing check: at about 100 LP per minute of skilled play, Platinum (250K) is roughly 40 hours of play and Legend (1M) roughly 170 hours.

## Credits wall

A page in the arcade (`arcade/credits/`) styled like end-of-game credits: a slowly scrolling list of every Diamond and Legend player's username, Legend names first. It's the permanent public thanks for the most dedicated players. Names come from `arcadePlayers` where lifetime LP is at or above the Diamond threshold. Players can opt out of being listed.

Thresholds live in one config file (`arcade/tiers.json`), so they can be tuned without touching code. Tiers are never lost, since lifetime LP only goes up.

## Early access (Platinum and up)

- Each entry in `upcoming.json` / `games.json` gets two dates: `earlyAccess` and `released`. Default lead time is 7 days.
- During the window, the game appears on the arcade home page for Platinum+ players with an "Early access" badge. Everyone else sees it as "Coming soon."
- Early-access plays count for LP and leaderboards like any other play.
- Gate by reading the player's tier from their `arcadePlayers` doc. Because the site is static (GitHub Pages), client-side gating can be bypassed, which is acceptable for early access since it's low stakes. Anything that must be truly protected (voting, beta builds) needs a Firestore rule or Cloud Function check against `arcadePlayers.lp`.

## Where it plugs into the existing code

- `arcade/tiers.json`: new, holds the ladder above. `arcade/credits/`: new credits wall page.
- `arcade/lz.js`: add `tierOf(lp)` and a `perks(uid)` helper next to the existing `roles` section; reuse the cached `arcadePlayers` read.
- `arcade/achievements.json`: add a `badge` field (icon + color) per achievement.
- `arcade/leaderboard/index.html` and `arcade/index.html`: render tier and pinned badges next to usernames (reuse the `.badge` styles).
- `firestore.rules`: add the pinned-badges field to the allowed keys on `arcadePlayers` (currently `username, lp, games, prog, updatedAt`) and validate it (max 3, only valid ids). Do not let clients write their own tier; derive it from `lp`.
- `arcade/index.html` "Lazer Points" panel: add a short "Tiers and perks" explainer.

## Rules to keep

- Fairness: tiers are based only on LP, which is already tuned to about 100 LP per minute of skilled play across all games.
- No pay-to-win or purchasable tiers.
- Keep it simple: one ladder, one config file, no per-game tier systems.
- Existing `SESSION_LP_CAP` (20,000 per write) is unchanged.
