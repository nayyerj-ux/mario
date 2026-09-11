# Architecture

## Goals

The original version of this game was a single 1,046-line HTML file with
everything - markup, CSS, and ~700 lines of JavaScript - inlined into one
`<script>` tag, plus a 1.45MB base64-encoded image inlined into the CSS.
That made the file impossible to unit-test, hard to review (one giant diff
for any change), and slow to load (the whole page payload had to be
downloaded and parsed before anything rendered).

This rewrite keeps the **same gameplay, physics constants, level data, and
visuals**, split into modules with one job each, so that:

- game rules can be unit-tested without a browser or DOM,
- rendering/audio/DOM code can change without touching game logic,
- the HTML document itself is a ~4KB shell instead of a 1.5MB blob.

## Data flow

```
input.js  ──┐
            ├──> game.js.update(input) ──> events[] ──┬──> audio.js  (sfx/voice)
LEVELS  ────┘         (pure simulation)                ├──> ui.js    (HUD/overlays/announcer)
                              │                          └──> (nothing - render reads state directly)
                              ▼
                         game.state
                              │
                              ▼
                         render.js.render(ctx, state)
```

`js/main.js` is the only module that imports all the others. Every other
module has a single, narrow concern and doesn't know the others exist:

- **`game.js`** owns all mutable game state and the rules that change it.
  It has zero DOM/canvas/audio dependencies - `update(input)` is a pure
  function of "current state + this frame's input" that mutates state and
  **returns a list of event strings** (`'jump'`, `'collectGolden'`,
  `'gameOver'`, ...) describing what happened. This is what makes
  `test/unit/game.test.js` possible without a browser: you can call
  `createGame()`, feed it fake input, and assert on `state` and the
  returned events directly.
- **`physics.js`** is pure, stateless collision math (`aabb`,
  `moveAndCollide`), extracted so it can be unit-tested in isolation from
  everything else.
- **`levels.js`** is static data (`LEVELS`) plus `cloneLevel()`, which deep
  clones a level into a fresh per-playthrough instance so retrying a level
  never mutates the source data.
- **`render.js`** is a pure function of `(ctx, state) -> pixels`. It never
  mutates state and never touches the rest of the DOM.
- **`ui.js`** owns every DOM read/write outside the canvas: HUD text,
  overlay show/hide (with focus management - see Accessibility below), and
  the screen-reader live region.
- **`audio.js`** owns synthesized sound effects (Web Audio oscillators, no
  audio files) and optional recorded voice lines. Every call is
  defensive - a browser blocking autoplay, missing the Web Audio API, or a
  dev environment missing the voice `.mp3` files must degrade to silence,
  never throw. See "Audio" below.
- **`input.js`** normalizes keyboard, touch and on-screen-button input into
  one `getMovementInput()` poll function.
- **`config.js` / `i18n.js`** are constants and the Persian-numeral
  formatting helper, with no logic of their own.

`main.js` ties these together: it polls input, calls `game.update()`,
routes the returned events to `audio`/`ui`, calls `render()`, and drives the
`requestAnimationFrame` loop - wrapped in `try/catch` so one bad frame logs
an error instead of freezing the game (see Reliability below).

## Why ES modules, and what that requires

`qarchkhor.html` loads `js/main.js` as `<script type="module">`. Browsers
refuse to load ES modules over `file://` (a CORS restriction), so **the game
must be served over HTTP** - `npm run serve` locally, and a real web server
in production (already true before this rewrite, since the deploy pipeline
always serves it over HTTP/HTTPS). There is deliberately no bundler/build
step: for a project this size, a bundler would add a build pipeline to
maintain for no real benefit - modern browsers load a handful of small JS
modules fast.

## Audio

Voice lines (`welcome.mp3`, `start.mp3`, `win.mp3`, `lose.mp3`) are
generated at deploy time by `.github/workflows/deploy.yml` via the
ElevenLabs API and are **not** committed to this repository. Locally and in
CI, `js/audio.js` will 404 on them - by design, this must stay silent
(caught and ignored) rather than break the game, since sound effects
(`sfx.*`, synthesized locally) work regardless of whether OK voice files
are present.

## Reliability

- Every audio call site is wrapped so a blocked `AudioContext`, a rejected
  `play()` promise, or a missing file degrades to silence.
- The main loop (`frame()` in `main.js`) wraps `update`/`render` in
  `try/catch` so a single bad frame is logged, not fatal.
- `init()` in `main.js` is itself wrapped in `try/catch`; if bootstrap fails
  (e.g. a missing DOM element), the player sees a Persian error message
  instead of a silent blank page.
- The loop skips simulation while `document.hidden` (backgrounded tab)
  instead of accumulating input/physics it can't render.

## Accessibility

- The on-screen mobile D-pad/jump buttons are real `role="button"
tabindex="0"` elements wired for both pointer **and** keyboard (`Enter`/
  `Space`) activation - not just touch.
- `#sr-announcer` is an `aria-live="polite"` region that announces score,
  level-complete, win and game-over transitions for screen reader users.
- `showOverlay()` moves focus to the primary button of whichever overlay
  becomes visible, so keyboard/AT users always land somewhere meaningful.
- The `<canvas>` element carries descriptive fallback content in Persian,
  which assistive tech exposes even though sighted users only see the
  rendered bitmap.
- The title screen's background was originally a photo with English
  marketing text ("MUSHROOM KINGDOM ADVENTURE") baked into the pixels,
  fighting the Persian title for attention and too busy/bright for the
  body text to stay readable over it. It's now a CSS-drawn scene in the
  same palette as the in-game canvas art - no un-localizable text, no
  extra image payload, and comfortably legible.
- `--accent`/`--leaf` (button background colors) were darkened from their
  original values so white button text clears WCAG AA contrast (4.5:1) at
  18px/700 weight, which falls just under the "large text" 3:1 exception
  threshold (18.66px).
- Idle decorative animation (mushroom bob, golden-mushroom sparkle, enemy
  wobble) is skipped when the OS `prefers-reduced-motion` setting is on;
  core gameplay motion (player/camera/enemy movement) is untouched, since
  that's the accepted exception for games, not decoration.

## Security

See [SECURITY.md](SECURITY.md).
