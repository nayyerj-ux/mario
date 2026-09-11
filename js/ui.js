// All DOM reads/writes for HUD, overlays and screen-reader announcements
// live here. Built with element creation (no innerHTML) so there is no
// string-concatenation-into-markup pattern anywhere in the codebase.

import { toPersianDigits } from './i18n.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function makeLifeIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'life-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');

  const shapes = [
    ['ellipse', { cx: '12', cy: '14', rx: '8', ry: '7', fill: '#fff' }],
    ['path', { d: 'M4 13 C4 5, 20 5, 20 13 C20 8, 4 8, 4 13 Z', fill: '#D3372B' }],
    ['circle', { cx: '8', cy: '12', r: '1.4', fill: '#D3372B' }],
    ['circle', { cx: '12', cy: '10', r: '1.2', fill: '#D3372B' }],
    ['circle', { cx: '16', cy: '12.5', r: '1.3', fill: '#D3372B' }],
  ];
  for (const [tag, attrs] of shapes) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.appendChild(el);
  }
  return svg;
}

/** Build the UI controller bound to the game's known DOM ids. */
export function createUI() {
  const hud = document.getElementById('hud');
  const hudScore = document.getElementById('hud-score');
  const hudLevel = document.getElementById('hud-level');
  const hudLives = document.getElementById('hud-lives');
  const announcer = document.getElementById('sr-announcer');
  const overlays = document.querySelectorAll('.overlay');

  function announce(text) {
    if (!announcer) return;
    announcer.textContent = '';
    // Force a DOM mutation even if the text is identical to the last announcement.
    requestAnimationFrame(() => {
      announcer.textContent = text;
    });
  }

  function showOverlay(id) {
    overlays.forEach((el) => el.classList.add('hidden'));
    if (!id) return;
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    const focusTarget = el.querySelector('button');
    if (focusTarget) focusTarget.focus();
  }

  function updateHud(state) {
    hudScore.textContent = toPersianDigits(state.score);
    hudLevel.textContent = toPersianDigits(state.currentLevel + 1);
    hudLives.innerHTML = '';
    for (let i = 0; i < state.lives; i++) hudLives.appendChild(makeLifeIcon());
  }

  function showHud() {
    hud.classList.remove('hidden');
  }

  function setScoreText(elementId, prefix, score) {
    document.getElementById(elementId).textContent = `${prefix} ${toPersianDigits(score)}`;
  }

  function setLevelCompleteTitle(levelNumber) {
    document.getElementById('lc-title').textContent = `مرحله ${toPersianDigits(levelNumber)} تموم شد! 🎉`;
  }

  return { announce, showOverlay, updateHud, showHud, setScoreText, setLevelCompleteTitle };
}
