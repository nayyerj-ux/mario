import { GROUND_Y } from './config.js';

function seg(x, y, w, h) {
  return { x, y, w, h };
}

// Static, read-only level blueprints. `cloneLevel` produces the mutable
// per-playthrough copy so replaying/retrying never mutates this source data.
export const LEVELS = [
  {
    // Level 1
    width: 2650,
    platforms: [
      seg(0, GROUND_Y, 680, 80),
      seg(800, GROUND_Y, 480, 80),
      seg(1420, GROUND_Y, 560, 80),
      seg(2120, GROUND_Y, 530, 80),
      seg(300, 360, 120, 22),
      seg(560, 300, 110, 22),
      seg(900, 330, 120, 22),
      seg(1150, 280, 120, 22),
      seg(1520, 350, 140, 22),
      seg(1880, 300, 120, 22),
      seg(2200, 360, 120, 22),
    ],
    mushrooms: [
      { x: 330, y: 322, type: 'normal' },
      { x: 590, y: 262, type: 'normal' },
      { x: 930, y: 292, type: 'normal' },
      { x: 1190, y: 242, type: 'golden' },
      { x: 1560, y: 312, type: 'normal' },
      { x: 1910, y: 262, type: 'normal' },
      { x: 2230, y: 322, type: 'normal' },
      { x: 2300, y: 422, type: 'normal' },
      { x: 120, y: 422, type: 'normal' },
      { x: 1000, y: 422, type: 'normal' },
    ],
    enemies: [
      { x: 900, y: 428, minX: 820, maxX: 1260, vx: 1.1 },
      { x: 1650, y: 428, minX: 1440, maxX: 1950, vx: 1.4 },
    ],
    spikes: [seg(2380, 436, 60, 24)],
    startX: 60,
    flagX: 2560,
  },
  {
    // Level 2
    width: 3100,
    platforms: [
      seg(0, GROUND_Y, 560, 80),
      seg(700, GROUND_Y, 360, 80),
      seg(1180, GROUND_Y, 320, 80),
      seg(1600, GROUND_Y, 420, 80),
      seg(2140, GROUND_Y, 300, 80),
      seg(2560, GROUND_Y, 540, 80),
      seg(220, 340, 110, 22),
      seg(480, 280, 110, 22),
      seg(760, 320, 100, 22),
      seg(1000, 260, 100, 22),
      seg(1240, 360, 110, 22),
      seg(1480, 300, 100, 22),
      seg(1720, 240, 110, 22),
      seg(1960, 320, 100, 22),
      seg(2200, 270, 110, 22),
      seg(2440, 340, 110, 22),
      seg(2760, 300, 110, 22),
    ],
    mushrooms: [
      { x: 250, y: 302, type: 'normal' },
      { x: 510, y: 242, type: 'normal' },
      { x: 790, y: 282, type: 'normal' },
      { x: 1030, y: 222, type: 'golden' },
      { x: 1270, y: 322, type: 'normal' },
      { x: 1510, y: 262, type: 'normal' },
      { x: 1750, y: 202, type: 'normal' },
      { x: 1990, y: 282, type: 'normal' },
      { x: 2230, y: 232, type: 'golden' },
      { x: 2470, y: 302, type: 'normal' },
      { x: 2790, y: 262, type: 'normal' },
      { x: 640, y: 422, type: 'normal' },
      { x: 1900, y: 422, type: 'normal' },
    ],
    enemies: [
      { x: 760, y: 428, minX: 700, maxX: 1050, vx: 1.3 },
      { x: 1650, y: 428, minX: 1600, maxX: 2000, vx: 1.6 },
      { x: 2600, y: 428, minX: 2560, maxX: 2980, vx: 1.4 },
      { x: 2200, y: 428, minX: 2140, maxX: 2420, vx: 1.2 },
    ],
    spikes: [seg(1150, 436, 50, 24), seg(2100, 436, 60, 24)],
    startX: 60,
    flagX: 3020,
  },
  {
    // Level 3
    width: 3500,
    platforms: [
      seg(0, GROUND_Y, 420, 80),
      seg(560, GROUND_Y, 260, 80),
      seg(940, GROUND_Y, 260, 80),
      seg(1320, GROUND_Y, 220, 80),
      seg(1660, GROUND_Y, 260, 80),
      seg(2040, GROUND_Y, 220, 80),
      seg(2380, GROUND_Y, 260, 80),
      seg(2760, GROUND_Y, 300, 80),
      seg(3180, GROUND_Y, 320, 80),
      seg(160, 340, 100, 22),
      seg(420, 280, 100, 22),
      seg(660, 230, 100, 22),
      seg(900, 300, 100, 22),
      seg(1140, 250, 100, 22),
      seg(1380, 330, 100, 22),
      seg(1600, 200, 100, 22),
      seg(1840, 270, 100, 22),
      seg(2080, 320, 100, 22),
      seg(2300, 230, 100, 22),
      seg(2540, 290, 100, 22),
      seg(2780, 220, 100, 22),
      seg(3020, 300, 100, 22),
      seg(3260, 260, 100, 22),
    ],
    mushrooms: [
      { x: 190, y: 302, type: 'normal' },
      { x: 450, y: 242, type: 'normal' },
      { x: 690, y: 192, type: 'golden' },
      { x: 930, y: 262, type: 'normal' },
      { x: 1170, y: 212, type: 'normal' },
      { x: 1410, y: 292, type: 'normal' },
      { x: 1630, y: 162, type: 'normal' },
      { x: 1870, y: 232, type: 'golden' },
      { x: 2110, y: 282, type: 'normal' },
      { x: 2330, y: 192, type: 'normal' },
      { x: 2570, y: 252, type: 'normal' },
      { x: 2810, y: 182, type: 'normal' },
      { x: 3050, y: 262, type: 'golden' },
      { x: 3290, y: 222, type: 'normal' },
    ],
    enemies: [
      { x: 600, y: 428, minX: 560, maxX: 800, vx: 1.5 },
      { x: 980, y: 428, minX: 940, maxX: 1180, vx: 1.6 },
      { x: 1700, y: 428, minX: 1660, maxX: 1900, vx: 1.7 },
      { x: 2420, y: 428, minX: 2380, maxX: 2620, vx: 1.6 },
      { x: 2800, y: 428, minX: 2760, maxX: 3040, vx: 1.8 },
      { x: 3220, y: 428, minX: 3180, maxX: 3480, vx: 1.5 },
    ],
    spikes: [seg(500, 436, 45, 24), seg(1280, 436, 45, 24), seg(2000, 436, 45, 24), seg(2720, 436, 45, 24)],
    startX: 60,
    flagX: 3420,
  },
];

/**
 * Deep-clone level index `idx` into a fresh, mutable playthrough state.
 * @param {number} idx
 */
export function cloneLevel(idx) {
  const src = LEVELS[idx];
  return {
    width: src.width,
    platforms: src.platforms.map((p) => ({ ...p })),
    mushrooms: src.mushrooms.map((m) => ({ ...m, collected: false, bob: Math.random() * Math.PI * 2 })),
    enemies: src.enemies.map((e) => ({ ...e, alive: true, dir: 1, x0: e.x })),
    spikes: src.spikes.map((s) => ({ ...s })),
    startX: src.startX,
    flagX: src.flagX,
  };
}
