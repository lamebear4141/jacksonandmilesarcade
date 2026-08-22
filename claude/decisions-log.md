# Decisions Log

Running record of "we chose X over Y because Z" — check here before re-opening
a settled architecture question.

## Hosting

- **Netlify over raw Synology NAS hosting.** Started with a NAS + Docker +
  nginx setup (works, documented in infrastructure-workflow-spec's "known
  gotchas" in case ever revisited), but moved to Netlify + GitHub for real
  public hosting on the custom domain, auto-deploy on push, and no port
  forwarding / home network exposure required.
- **A record + CNAME (external DNS) over Netlify DNS.** Kept Namecheap as the
  DNS host rather than switching nameservers to Netlify — fewer moving parts
  since the domain was already at Namecheap. Netlify recommended `www` as
  primary for CDN reasons; kept the bare domain as primary instead since it's
  easier for a kid to type/remember, and the performance difference is
  negligible at this traffic scale.

## Database / backend

- **Firebase (Firestore) over Supabase.** Both were viable; Supabase was set up
  first but its free tier pauses projects after 7 days of inactivity, which is
  a real risk for a casual family project that might not be played daily.
  Firestore's Spark (free) plan never pauses and has generous daily quotas
  (1 GiB storage, 50K reads/day, 20K writes/day) — switched before much was
  built on Supabase, so the switch cost was low.
- **Firebase Auth for parents only, PIN-based profiles for kids** — not
  full accounts for children. Avoids collecting any real personal info
  (email, password) from a child, sidesteps most COPPA complexity, and is
  simpler UX for a kid than a real login. See Privacy & Safety rules in the
  project instructions.

## Design (Aug 2026)

- **"Playground" visual identity over neon arcade cabinet.** Both were built
  as fully clickable mockups; AJ picked the bright Nintendo-playground
  direction (daytime sky, chunky navy-outlined white panels, four play
  colors, springy 3D buttons) with go-big motion (particles, mascot, sound,
  screen shake). The cabinet skin proved the components are skin-independent —
  identical class names, different tokens — so this choice is cheap to revisit.
  Source of truth: `claude/visual-identity-spec.md`.
- **Login behind PLAY, not in front of it.** Login-first remains the data
  flow, but the front door shows the logo, mascot, and two equal-weight XL
  buttons (profile / guest); the email card only appears after "PLAY WITH MY
  PROFILE". A login form is the least attractive first screen a kid can see.
- **Friends' live activity is post-PIN only.** The public front-door ticker
  shows only the nickname-only public `high_scores` data; "playing now"
  friend rows render inside the arcade after PIN entry, never on the public
  front door.
- **Reskin runs between Phase 3 and Phase 4** of the character build, so the
  seven games adopt the approved look the first time they take the shell,
  instead of being restyled twice.

## Design — the three-pillar economy (Aug 21, 2026)

- **Three pillars, equally weighted: Learn, Play, Create.** Replaces the
  earlier "practice games earn 4×" weighting. Learn games pay 🧱 Bricks, Play
  games pay ⚡ Sparks, and Create (a kid's own buildable "My World" space,
  visited and high-fived by friends) pays 🪙 Coins. Full spec:
  `claude/my-world-spec.md`.
- **Every item placed in My World costs bricks AND sparks.** This is the
  balance mechanic, made physical instead of policed: a kid who only grinds
  learning games runs out of energy to build with; a kid who only plays fun
  games runs out of materials. Nobody has to enforce "do both" — the economy
  does.
- **Coins move to the social loop, not games directly** — friends' visits and
  reactions to a kid's world pay coins, which buy avatar gear and decorations.
  This is a bigger behavior change than it looks: it means the existing Shop
  (built in Character Home Phase 3, spends coins earned from games) can't
  have its coin source cut off before My World's friend-visiting exists to
  replace it. **Sequencing constraint, not just a preference:** coin-earning
  stays on games until the Create-pillar coin source (W1/W4 in
  my-world-spec.md) is live. W0 is deliberately split out to respect this.
- **Avatar Studio replaces gender selection with hair/outfit choice** — no
  gender field stored, same self-expression range.
- **Game of the Day** rotates learning games only, at a bonus that stacks on
  top of the pillar economy rather than replacing it.

## Design — collections, badges & trade alerts (Aug 21, 2026)

Full spec: `claude/collections-spec.md`. Mockup:
`design/mockups/collections.html`.

- **Eight themed sets layered over the flat 60-sprite collection**, each
  completing into three rewards: a **badge** (social title, shown by your
  nickname), a **statue** for My World, and an **avatar unlock**. The flat
  list had no completion state — nothing ever *finished*. Sets give the
  collection shape and finite goals.
- **Every set deliberately mixes easy commons with one or two rare
  capstones.** This is the trading engine, not decoration: at the existing
  drop weights (55/27/12/5/1) no kid completes a set solo, so finishing
  requires discovering a sibling has the spare. Sets exist to make trading
  matter.
- **New sprites are APPENDED ONLY** (60 → 81). The squad code is a bitmask
  over `SPRITES` indices — reordering or inserting silently corrupts every
  shared code. Documented in catalog.js and re-flagged here because it's the
  single easiest thing to break.
- **Set completion is derived, never stored as a flag** — a set is complete
  iff every member's `counts[id] > 0`. Only the *grant* is written, inside
  the same transaction as `awardRun` / `respondToTrade`, guarded by
  `arrayUnion`. A trade that completes a set fires the celebration for the
  receiving kid; that moment is the whole point of the trading system.
- **Two anti-frustration mechanics** because sets create real stuck states:
  *Collection Focus* (a chosen set biases re-rolls toward its missing members
  without inflating rarity) and *duplicate trade-in* (3 dupes of a rarity → 1
  unowned of that rarity, so a kid with no available trade partner still has a
  path). Neither costs currency.
- **Trade notification dot on the TRADE tab**, fed by
  `listTrades().incoming.length` added to Character Home's mount. Refresh on
  mount and after trade actions — **never poll**. Notifications wait on the
  hub and never interrupt a game. Same dot pattern will later serve friend
  requests and world high-fives.
- **28 sprites deliberately left unaffiliated**, so future sets (Barnyard,
  Night Shift, Sky Kings, Hero Squad, Elementals, Treasure) are pure data
  additions with no migration.

## Keeping active game builds aligned with the pillar migration (Aug 21, 2026)

AJ is running two active Claude Code builds in parallel with this planning —
Multiverse Collector v2.1 and a brand-new Math Baseball — both of which touch
`catalog.js`'s `GAMES` table and call `finishRun`, using the **old**
`xpMult`/`coinMult` shape (written before the pillar-economy decision above).
Rather than pause either:

- Both `claude/math-baseball-prompt.md` and
  `claude/multiverse-collector-v2-1-prompt.md` got a short status note added
  pointing at this section and `my-world-spec.md`. Their `kind:'learn'` /
  `kind:'fun'` tags are exactly right and carry forward unchanged; only the
  numeric multiplier fields become dead weight once the pillar migration
  lands — harmless, not worth blocking on.
- `CLAUDE.md` in the repo got a matching pointer section, so any Claude Code
  session — not just ones briefed here — checks this log and
  `character-system-prompt.md`'s status banner before adding new scoring,
  currency, or reward logic to any game.
- **`claude/wallet-foundation-w0-prompt.md` can run now**, in any order
  relative to the two in-flight game prompts — it only touches `catalog.js`
  (additively) and `arcade-shell.js`'s `finishRun`, adding bricks/sparks
  tracking without changing existing coin/XP behavior.

## Workflow / Claude usage

- **Publish-on-explicit-request over auto-publish-on-every-edit.** Original
  CLAUDE.md rule auto-committed and pushed after every single change, which
  burned through Netlify's deploy-credit allowance quickly (~15 credits per
  deploy, 300/month free). Switched to local testing
  (`python -m http.server`) plus batched "publish this" commands.
- **This claude.ai Project chat for planning/prompts, Claude Code for all
  execution.** Keeps Claude Code sessions shorter and cheaper (less
  back-and-forth burning context) and keeps a persistent, searchable design
  history in one place (this project's knowledge files) instead of scattered
  across many Claude Code sessions.
- **Design mockups live in the repo at `design/mockups/`** (not deployed) so
  Claude Code can open them for pixel reference: `playground-chrome.html`,
  `cabinet-chrome.html`, `playground-v2.html`, `my-world.html`,
  `collections.html`.

## Features tried and reverted

- **"Infinite 67 shower" effect (Multiverse Collector).** Requested as a fun
  chaos effect on catching a hockey stick. A literal infinite loop isn't
  feasible (would freeze the browser), so it was built as a bounded rapid-fire
  effect instead. Didn't land the way it was imagined and was removed. Good
  example used with the boys about tuning/removing features being a normal
  part of building, not a mistake.

## Open / revisit later

- Whether trading and public leaderboards launch family-only-by-default or
  need a more built-out parental-approval flow before going live (leaning
  toward: family-only default, parent-toggle to public, no open text fields —
  see project instructions)
- Cross-family friends need real Firestore design work (top-level
  friendships/presence collections and actual rules changes — the recursive
  family wildcard doesn't cover them). Spec this carefully — see
  `my-world-spec.md` §4 — before building; presence visibility ships
  off-by-default with a parent toggle.
- Go-big motion volume: if the confetti/sound-everywhere approach grates in
  real use, dial celebration back to key moments only (level-up, trade,
  streak) — it's a one-variable change in the celebration hooks.
- **When to actually cut coins over to the Create pillar** (retire
  game-direct coin earning) — gated on My World's friend-visiting existing
  (W1/W4). Don't do this early; it would strand the Shop.
- **Squad-code width.** 81 sprites × 4 bits ≈ 65 chars, still fine. If more
  sets push it further, drop to 1 bit per sprite (owned/not) — the compare UI
  never shows counts anyway — and version the code so old links keep parsing.
