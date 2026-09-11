// Entry point: wires input -> simulation -> {render, audio, ui} together and
// owns the main loop. This is the only module allowed to know about all the
// others; every other module only knows its own concern.

import { createGame } from './game.js';
import { render } from './render.js';
import { createUI } from './ui.js';
import { sfx, playVoice, getAudioCtx } from './audio.js';
import { getMovementInput, initMobileControls, onFirstInteraction } from './input.js';
import { toPersianDigits } from './i18n.js';

function showFatalError() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  stage.textContent = '';
  const msg = document.createElement('p');
  msg.setAttribute('role', 'alert');
  msg.style.cssText = 'color:#F3E3C3;font-family:sans-serif;text-align:center;padding:2rem;';
  msg.textContent = 'بازی نتونست بارگذاری بشه. لطفاً صفحه رو دوباره بارگذاری کن.';
  stage.appendChild(msg);
}

function init() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Extremely old/locked-down browsers without 2D canvas support: fail
    // loudly in the console rather than silently freezing on a blank screen.
    console.error('قارچ‌خور: 2D canvas context is unavailable in this browser.');
  }

  const game = createGame();
  const ui = createUI();

  initMobileControls({
    left: document.getElementById('mc-left'),
    right: document.getElementById('mc-right'),
    jump: document.getElementById('mc-jump'),
    container: document.getElementById('mobile-controls'),
  });

  let welcomeVoicePlayed = false;
  function tryPlayWelcomeVoice() {
    if (welcomeVoicePlayed || game.state.phase !== 'start') return;
    welcomeVoicePlayed = true;
    playVoice('welcome');
  }
  window.addEventListener('load', tryPlayWelcomeVoice);
  onFirstInteraction(tryPlayWelcomeVoice);

  const EVENT_SFX = {
    jump: sfx.jump,
    hurt: sfx.hurt,
    stomp: sfx.stomp,
    collectMushroom: sfx.collect,
    collectGolden: sfx.golden,
    flag: sfx.flag,
  };

  function handleEvents(events) {
    for (const evt of events) {
      EVENT_SFX[evt]?.();

      if (evt === 'gameOver') {
        sfx.lose();
        playVoice('lose');
        ui.setScoreText('go-score', 'امتیاز نهایی:', game.state.score);
        ui.showOverlay('gameover-screen');
        ui.announce(`باختی! امتیاز نهایی ${toPersianDigits(game.state.score)}`);
      } else if (evt === 'levelComplete') {
        ui.setScoreText('lc-score', 'امتیاز:', game.state.score);
        ui.setLevelCompleteTitle(game.state.currentLevel + 1);
        ui.showOverlay('levelcomplete-screen');
        ui.announce(
          `مرحله ${toPersianDigits(game.state.currentLevel + 1)} تموم شد! امتیاز ${toPersianDigits(game.state.score)}`,
        );
      } else if (evt === 'win') {
        ui.setScoreText('win-score', 'امتیاز نهایی:', game.state.score);
        playVoice('win');
        ui.showOverlay('win-screen');
        ui.announce(`بردی! امتیاز نهایی ${toPersianDigits(game.state.score)}`);
      } else if (evt === 'gameStarted') {
        ui.showHud();
        ui.showOverlay(null);
      }
    }
  }

  function frame() {
    try {
      if (!document.hidden) {
        const events = game.update(getMovementInput());
        handleEvents(events);
        if (ctx) render(ctx, game.state);
        ui.updateHud(game.state);
      }
    } catch (err) {
      // A single bad frame (e.g. a transient rendering error) must not kill
      // the whole game loop; log it and keep going so play can continue.
      console.error('قارچ‌خور: frame error', err);
    }
    requestAnimationFrame(frame);
  }

  document.getElementById('btn-start').addEventListener('click', () => {
    getAudioCtx(); // unlock the Web Audio API within this user gesture
    playVoice('start');
    handleEvents(game.startGame());
  });
  document.getElementById('btn-retry').addEventListener('click', () => {
    handleEvents(game.startGame());
  });
  document.getElementById('btn-next').addEventListener('click', () => {
    game.nextLevel();
    ui.showOverlay(null);
  });
  document.getElementById('btn-playagain').addEventListener('click', () => {
    handleEvents(game.startGame());
  });

  ui.showOverlay('start-screen');
  requestAnimationFrame(frame);
}

try {
  init();
} catch (err) {
  // A missing/mismatched DOM element or an unsupported API during bootstrap
  // must not leave the player staring at a blank page with no explanation.
  console.error('قارچ‌خور: failed to initialize', err);
  showFatalError();
}
