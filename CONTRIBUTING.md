# Contributing

## Setup

```sh
npm install
npm run serve   # http://127.0.0.1:8123/qarchkhor.html
```

## Before opening a PR

```sh
npm run lint          # must be clean
npm run format         # must be clean (or run: npm run format:fix)
npm test                # unit + e2e, must pass
```

CI runs the same checks on every push/PR (`.github/workflows/ci.yml`); a red
CI run blocks deploy to production regardless of branch.

**Recommended for the repo owner:** enable a GitHub branch protection rule
on `main` requiring the `CI / test` check to pass (and, once there's more
than one contributor, requiring PR review) before merging. This repo's
tooling can't turn that on by itself - it's an org/repo admin setting, not
a file in the tree - but it's the natural next step now that CI exists.

## Code organization

Read [ARCHITECTURE.md](ARCHITECTURE.md) first. In short:

- Game rules go in `js/game.js` and must stay DOM-free - if you need to
  touch `document` or `window` from game logic, that's a sign the change
  belongs in `js/ui.js`/`js/main.js` instead, wired through an event string.
- Anything a player can see happen (score change, win, lose, level
  complete, ...) should be both: (a) reflected in `game.state`, and (b)
  reported as an event string from `update()`, so `main.js` can react
  (sound, HUD, overlay) _and_ `js/ui.js`'s `aria-live` announcer can tell
  screen-reader users what just happened.
- New physics/collision logic belongs in `js/physics.js` and should ship
  with a unit test in `test/unit/physics.test.js` - it's pure, so it's
  cheap to test exhaustively.
- New level content goes in `js/levels.js`; add/extend the integrity checks
  in `test/unit/levels.test.js` (flag reachable, enemies patrol within
  bounds, coordinates inside the level, etc.) if you add new fields.

## Style

- No build step, no framework, no TypeScript - keep it plain ES modules.
- ESLint + Prettier are the source of truth for style; don't hand-format
  against them.
- Prefer adding a unit test (fast, DOM-free) over an e2e test when the
  behavior doesn't require an actual browser/canvas/DOM.

## Persian text / RTL

All user-facing strings are Persian. Numbers shown to the player (score,
lives, level) must go through `toPersianDigits()` from `js/i18n.js` -
mixing Western and Persian numerals in the same UI is a real, previously
shipped bug (see the "i18n" note in project history) and is treated as a
regression, not a style nit.
