Make local file edits freely without committing or pushing after every change.

Only commit and push when the user explicitly says "publish this" or "ship it"
(or clearly equivalent wording). When that happens, run:
1. git add -A
2. git commit -m "<short description of the change>"
3. git push

Otherwise, leave changes uncommitted in the working tree so the user can test
locally first.

## Architecture in flight — check before touching scoring, currency, or rewards

The site is mid-migration to a shared **Character system**: one XP/level/coins
profile per kid, fed by every game, plus a "My World" creative building layer.
The reward model is a **three-pillar economy** — 🧠 Learn games pay Bricks,
🎮 Play games pay Sparks, 🎨 Create (friends visiting/reacting to a kid's
world) pays Coins. This supersedes an earlier flat XP-multiplier/coin-
multiplier design that some existing game prompts still reference.

Before adding or changing anything that awards XP, coins, currency, or
progress in ANY game, read these from the `jacksonandmilesarcade` claude.ai
Project (ask AJ if you can't reach them):

- `decisions-log.md` — "Design (Aug 2026)" section, current state of the migration
- `claude/character-system-prompt.md` — the Character layer, phased build, status banner at the top
- `claude/my-world-spec.md` — the pillar economy (`PILLAR_ECONOMY`) and how it plugs into `finishRun`

If a game-specific prompt (e.g. `math-baseball-prompt.md`, a
`multiverse-collector-*-prompt.md`) specifies `xpMult`/`coinMult` fields on a
`GAMES` entry, that shape is being superseded — **keep the game's
`kind: 'learn' | 'fun'` tag** (it already routes correctly to Bricks/Sparks
once the pillar migration lands) but don't invent new multiplier or currency
logic beyond what that prompt already specifies. The actual payout swap is a
single centralized change in `catalog.js` + `arcade-shell.js`'s `finishRun` —
it does not require touching individual game files, so building or improving
any game now is not wasted work.
