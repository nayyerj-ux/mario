# 🍄 قارچ‌خور (Qarchkhor / "Mushroom Eater")

A free, Persian-language (RTL) 2D browser platformer. Run across platforms,
dodge enemies and spikes, collect mushrooms, grab the golden mushroom to
grow and gain a life, and reach the flag at the end of each of the 3 levels.

No build step, no framework, no backend — vanilla JS + Canvas 2D, playable
straight from a static file server.

## Play it

Open `qarchkhor.html` through a local web server (it can't be opened with
`file://` because it loads ES modules, which browsers block under `file://`
for security reasons):

```sh
npm install
npm run serve
# then open http://127.0.0.1:8123/qarchkhor.html
```

**Controls:** `←`/`→` or `A`/`D` to move, `Space` or `↑` to jump. On touch
devices, on-screen buttons appear automatically.

## Project layout

```
qarchkhor.html      Markup only - links css/styles.css and js/main.js
css/styles.css       All styling
js/
  config.js          Tunable constants (physics, sizes, scoring)
  i18n.js             Persian-numeral formatting helper
  levels.js           Level data + level-instance cloning
  physics.js           Pure collision/movement helpers (unit-tested)
  audio.js             Synth sound effects + optional recorded voice lines
  input.js              Keyboard/touch input handling
  game.js                Simulation: owns game state, advances one frame,
                          reports what happened as events (DOM-free)
  render.js               Canvas drawing (pure function of state -> pixels)
  ui.js                     HUD/overlay DOM updates, screen-reader announcer
  main.js                    Entry point: wires everything together, runs
                              the main loop
assets/               self-hosted webfont (the title screen is drawn in CSS)
test/unit/             Unit tests (Node's built-in test runner)
test/e2e/                Playwright end-to-end browser tests
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the pieces fit together and
why they're split this way.

## Development

```sh
npm install
npm run lint          # ESLint
npm run format         # Prettier check (--fix with npm run format:fix)
npm run test:unit       # Fast, DOM-free logic tests
npm run test:e2e         # Playwright, drives a real headless browser
npm test                  # everything
```

CI (`.github/workflows/ci.yml`) runs all of the above on every push and pull
request. `.github/workflows/deploy.yml` only deploys to production after CI
has passed on `main`.

## Voice lines

`js/audio.js` will try to play `welcome.mp3`, `start.mp3`, `win.mp3` and
`lose.mp3` if present. These are **not** part of this repository - the
deploy workflow generates them via the ElevenLabs API and ships them
alongside the game. Locally (and in CI) they simply 404, which the game
handles silently by design - see [ARCHITECTURE.md](ARCHITECTURE.md#audio).

## Security

See [SECURITY.md](SECURITY.md) for the game's Content-Security-Policy, why
all runtime assets are self-hosted, and one known/accepted risk in the
deploy pipeline (password-based SSH) with a recommended fix.

## License

Game code: no license file is currently present - all rights reserved by
default until the project owner adds one. The Vazirmatn font
(`assets/fonts/`) is licensed under the SIL Open Font License 1.1.
