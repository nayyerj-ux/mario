// The simulation layer: owns all game state and advances it one frame at a
// time. Deliberately has zero knowledge of the DOM, canvas or audio - it
// reports what happened via a list of *events* so the presentation layer
// (render.js/ui.js/audio.js, wired together in main.js) can react without
// this module reaching back out to them. That one-way data flow is what
// keeps the simulation independently testable (see test/game.test.js).

import {
  GRAVITY,
  MAX_FALL,
  MOVE_SPEED,
  JUMP_VEL,
  STOMP_BOUNCE_VEL,
  GROUND_Y,
  WORLD_BOTTOM,
  SMALL_W,
  SMALL_H,
  BIG_W,
  BIG_H,
  ENEMY_SIZE,
  MUSHROOM_HALF,
  SCORE_MUSHROOM,
  SCORE_GOLDEN_MUSHROOM,
  SCORE_STOMP,
  STARTING_LIVES,
  MAX_LIVES,
  SPAWN_INVINCIBILITY,
  HIT_INVINCIBILITY,
  RESPAWN_INVINCIBILITY,
  CAMERA_EASE,
  CANVAS_W,
} from './config.js';
import { LEVELS, cloneLevel } from './levels.js';
import { aabb, moveAndCollide } from './physics.js';

/** Create a fresh game instance with its own isolated state. */
export function createGame() {
  const state = {
    phase: 'start', // start | playing | levelcomplete | gameover | win
    currentLevel: 0,
    score: 0,
    lives: STARTING_LIVES,
    camera: { x: 0 },
    level: null,
    player: null,
    particles: [],
    invincibleTimer: 0,
    flagAnimT: 0,
  };

  function makePlayer(x) {
    return {
      x,
      y: GROUND_Y - SMALL_H,
      w: SMALL_W,
      h: SMALL_H,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      size: 'small',
      bob: 0,
    };
  }

  function loadLevel(idx) {
    state.level = cloneLevel(idx);
    state.player = makePlayer(state.level.startX);
    state.camera.x = 0;
    state.invincibleTimer = SPAWN_INVINCIBILITY;
    state.flagAnimT = 0;
  }

  function startGame() {
    state.score = 0;
    state.lives = STARTING_LIVES;
    state.currentLevel = 0;
    loadLevel(0);
    state.phase = 'playing';
    return ['gameStarted'];
  }

  function nextLevel() {
    state.currentLevel++;
    loadLevel(state.currentLevel);
    state.phase = 'playing';
  }

  function grow() {
    const player = state.player;
    if (player.size === 'big') return;
    const dw = BIG_W - SMALL_W,
      dh = BIG_H - SMALL_H;
    player.x -= dw / 2;
    player.y -= dh;
    player.w = BIG_W;
    player.h = BIG_H;
    player.size = 'big';
  }

  function shrink() {
    const player = state.player;
    if (player.size === 'small') return;
    const dw = BIG_W - SMALL_W,
      dh = BIG_H - SMALL_H;
    player.x += dw / 2;
    player.y += dh;
    player.w = SMALL_W;
    player.h = SMALL_H;
    player.size = 'small';
  }

  function respawn() {
    const player = state.player,
      level = state.level;
    player.x = level.startX;
    player.y = GROUND_Y - player.h;
    player.vx = 0;
    player.vy = 0;
    state.camera.x = 0;
  }

  function spawnBurst(x, y, color) {
    for (let i = 0; i < 10; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 1.2) * 6,
        life: 30,
        color,
      });
    }
  }

  /** Returns the events triggered by this hit (hurt + shrink/loseLife/gameOver). */
  function damagePlayer() {
    if (state.invincibleTimer > 0) return [];
    const events = ['hurt'];
    spawnBurst(state.player.x + state.player.w / 2, state.player.y + state.player.h / 2, '#E0562D');
    if (state.player.size === 'big') {
      shrink();
      state.invincibleTimer = HIT_INVINCIBILITY;
      events.push('shrink');
    } else {
      state.lives--;
      if (state.lives <= 0) {
        state.phase = 'gameover';
        events.push('loseLife', 'gameOver');
      } else {
        respawn();
        state.invincibleTimer = RESPAWN_INVINCIBILITY;
        events.push('loseLife');
      }
    }
    return events;
  }

  /**
   * Advance the simulation by one frame.
   * @param {{left:boolean, right:boolean, jump:boolean}} input
   * @returns {string[]} events that occurred this frame, in order
   */
  function update(input) {
    if (state.phase !== 'playing') return [];
    const events = [];
    const player = state.player,
      level = state.level;

    if (input.left && !input.right) {
      player.vx = -MOVE_SPEED;
      player.facing = -1;
    } else if (input.right && !input.left) {
      player.vx = MOVE_SPEED;
      player.facing = 1;
    } else {
      player.vx = 0;
    }

    if (input.jump && player.onGround) {
      player.vy = JUMP_VEL;
      player.onGround = false;
      events.push('jump');
    }

    player.vy += GRAVITY;
    if (player.vy > MAX_FALL) player.vy = MAX_FALL;

    moveAndCollide(player, level.platforms, level.width);

    // fell into a pit
    if (player.y > WORLD_BOTTOM) {
      events.push(...damagePlayer());
      if (state.phase !== 'playing') return events;
    }

    // enemies
    for (const e of level.enemies) {
      if (!e.alive) continue;
      e.x += e.vx * e.dir;
      if (e.x < e.minX || e.x + ENEMY_SIZE > e.maxX) e.dir *= -1;
      const ebox = { x: e.x, y: e.y - ENEMY_SIZE, w: ENEMY_SIZE, h: ENEMY_SIZE };
      if (aabb(player, ebox)) {
        const playerBottom = player.y + player.h;
        const fallingOnTop = player.vy > 0 && playerBottom - ebox.y < 22;
        if (fallingOnTop) {
          e.alive = false;
          player.vy = STOMP_BOUNCE_VEL;
          state.score += SCORE_STOMP;
          events.push('stomp');
          spawnBurst(ebox.x + 16, ebox.y + 16, '#7A4E9E');
        } else {
          events.push(...damagePlayer());
          if (state.phase !== 'playing') return events;
        }
      }
    }

    // spikes
    for (const s of level.spikes) {
      if (aabb(player, s)) {
        events.push(...damagePlayer());
        if (state.phase !== 'playing') return events;
        break;
      }
    }

    // mushrooms
    for (const m of level.mushrooms) {
      if (m.collected) continue;
      const mbox = { x: m.x - MUSHROOM_HALF, y: m.y - MUSHROOM_HALF, w: MUSHROOM_HALF * 2, h: MUSHROOM_HALF * 2 };
      if (aabb(player, mbox)) {
        m.collected = true;
        if (m.type === 'golden') {
          grow();
          state.score += SCORE_GOLDEN_MUSHROOM;
          state.lives = Math.min(state.lives + 1, MAX_LIVES);
          events.push('collectGolden');
          spawnBurst(m.x, m.y, '#F0B429');
        } else {
          state.score += SCORE_MUSHROOM;
          events.push('collectMushroom');
          spawnBurst(m.x, m.y, '#E0562D');
        }
      }
    }

    // flag
    if (player.x > level.flagX) {
      events.push('flag');
      if (state.currentLevel >= LEVELS.length - 1) {
        state.phase = 'win';
        events.push('win');
      } else {
        state.phase = 'levelcomplete';
        events.push('levelComplete');
      }
    }

    if (state.invincibleTimer > 0) state.invincibleTimer--;

    for (const p of state.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life--;
    }
    state.particles = state.particles.filter((p) => p.life > 0);

    const targetX = player.x - CANVAS_W / 2 + player.w / 2;
    state.camera.x += (targetX - state.camera.x) * CAMERA_EASE;
    state.camera.x = Math.max(0, Math.min(state.camera.x, level.width - CANVAS_W));

    player.bob += 0.2;
    state.flagAnimT += 0.05;

    return events;
  }

  return { state, startGame, nextLevel, update, totalLevels: LEVELS.length };
}
