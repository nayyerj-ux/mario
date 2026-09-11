// Canvas rendering. Pure function of (ctx, game state) -> pixels; never
// mutates game state and never touches the rest of the DOM.

import { CANVAS_W, CANVAS_H, GROUND_Y } from './config.js';

const W = CANVAS_W,
  H = CANVAS_H;

// Idle decorative motion (mushroom bob, golden sparkle) is auto-playing and
// non-essential, so honor the OS-level reduced-motion preference for it.
// Player/camera/enemy motion stays untouched - that's core gameplay, not
// decoration, and games are the accepted exception there (see ARCHITECTURE.md).
let reduceMotion = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', (e) => {
    reduceMotion = e.matches;
  });
}

function drawCloud(ctx, x, y) {
  ctx.beginPath();
  ctx.ellipse(x, y, 30, 18, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 26, y - 8, 22, 16, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 50, y, 28, 17, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHillRow(ctx, offset, baseY, spacing, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-100, H);
  const start = -(offset % spacing) - spacing;
  for (let x = start; x < W + spacing; x += spacing) {
    ctx.quadraticCurveTo(x + spacing / 2, baseY - 60, x + spacing, baseY);
  }
  ctx.lineTo(W + 100, H);
  ctx.closePath();
  ctx.fill();
}

function drawBackground(ctx, camera) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#5EC1E0');
  g.addColorStop(1, '#BFEAF2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255,244,200,0.9)';
  ctx.beginPath();
  ctx.arc(W - 90, 80, 46, 0, Math.PI * 2);
  ctx.fill();

  const hillOffset = camera.x * 0.3;
  drawHillRow(ctx, hillOffset, 380, 220, '#8FD18A');
  drawHillRow(ctx, camera.x * 0.5, 410, 170, '#6FBE72');

  const cloudOffset = camera.x * 0.15;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 320 - (cloudOffset % 2000) + 2000) % (W + 300)) - 100;
    drawCloud(ctx, cx, 60 + (i % 3) * 40);
  }
}

function drawPlatform(ctx, p, camera) {
  const x = p.x - camera.x;
  if (x + p.w < 0 || x > W) return;
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(x, p.y, p.w, p.h);
  ctx.fillStyle = '#4FAE52';
  ctx.fillRect(x, p.y, p.w, 12);
  ctx.fillStyle = '#3E8E4F';
  for (let gx = x; gx < x + p.w; gx += 14) {
    ctx.beginPath();
    ctx.moveTo(gx, p.y + 12);
    ctx.lineTo(gx + 7, p.y + 2);
    ctx.lineTo(gx + 14, p.y + 12);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let dx = x + 8; dx < x + p.w - 8; dx += 26) {
    ctx.beginPath();
    ctx.arc(dx, p.y + p.h / 2 + 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpike(ctx, s, camera) {
  const x = s.x - camera.x;
  if (x + s.w < 0 || x > W) return;
  ctx.fillStyle = '#5B5B66';
  const n = Math.floor(s.w / 16);
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 16, s.y + s.h);
    ctx.lineTo(x + i * 16 + 8, s.y);
    ctx.lineTo(x + i * 16 + 16, s.y + s.h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawMushroom(ctx, m, camera) {
  if (m.collected) return;
  const x = m.x - camera.x;
  if (x < -30 || x > W + 30) return;
  const bobY = reduceMotion ? 0 : Math.sin(m.bob + performance.now() / 300) * 3;
  const y = m.y + bobY;
  const gold = m.type === 'golden';
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#F3E3C3';
  ctx.fillRect(-7, 2, 14, 14);
  ctx.fillStyle = gold ? '#F0B429' : '#D3372B';
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 13, 0, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 2, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gold ? '#FFF3D0' : '#ffffff';
  ctx.beginPath();
  ctx.arc(-7, -6, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4, -8, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(9, -3, 2.2, 0, Math.PI * 2);
  ctx.fill();
  if (gold && !reduceMotion) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.4;
    const sp = performance.now() / 200 + m.bob;
    for (let i = 0; i < 3; i++) {
      const ang = sp + i * 2.1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 20, -8 + Math.sin(ang) * 8);
      ctx.lineTo(Math.cos(ang) * 24, -8 + Math.sin(ang) * 8);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawEnemy(ctx, e, camera) {
  if (!e.alive) return;
  const x = e.x - camera.x;
  if (x < -40 || x > W + 40) return;
  const y = e.y;
  const wob = reduceMotion ? 0 : Math.sin(performance.now() / 150 + e.x) * 2;
  ctx.save();
  ctx.translate(x + 16, y - 16 + wob);
  ctx.fillStyle = '#7A4E9E';
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5C3A78';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 8, 10);
    ctx.lineTo(i * 8, 16);
    ctx.stroke();
  }
  const dir = e.dir;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(4 * dir, -3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-5 * dir, -3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2A1A3A';
  ctx.beginPath();
  ctx.arc(4 * dir + 1.5 * dir, -3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-5 * dir + 1 * dir, -3, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2A1A3A';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-2 * dir, -9);
  ctx.lineTo(8 * dir, -11);
  ctx.stroke();
  ctx.restore();
}

function drawFlag(ctx, level, camera, flagAnimT) {
  const x = level.flagX - camera.x;
  if (x < -40 || x > W + 40) return;
  ctx.fillStyle = '#C8A165';
  ctx.fillRect(x, 200, 8, GROUND_Y - 200);
  ctx.fillStyle = '#F0B429';
  const wave = Math.sin(flagAnimT) * 6;
  ctx.beginPath();
  ctx.moveTo(x + 8, 205);
  ctx.lineTo(x + 50 + wave, 216);
  ctx.lineTo(x + 8, 235);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8B5E3C';
  ctx.beginPath();
  ctx.arc(x + 4, 200, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, player, camera, invincibleTimer) {
  const x = player.x - camera.x;
  const y = player.y;
  const flashing = invincibleTimer > 0 && Math.floor(invincibleTimer / 6) % 2 === 0;
  if (flashing) return;

  const w = player.w,
    h = player.h;

  ctx.save();
  ctx.translate(x + w / 2, y + h);
  ctx.scale(player.facing, 1);

  const squash = player.onGround ? 1 : 0.95;

  const legH = h * 0.28 * squash;
  const bodyH = h * 0.34 * squash;
  const headR = w * 0.52;
  const legsTop = -(legH + 6);
  const torsoTop = -(legH + bodyH + 6);
  const headCY = torsoTop - headR * 0.85;

  ctx.fillStyle = '#6B3A17';
  ctx.beginPath();
  ctx.ellipse(-w * 0.24, -3, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.08, -3, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1E4FBF';
  ctx.fillRect(-w * 0.34, legsTop, w * 0.28, legH);
  ctx.fillRect(w * 0.02, legsTop, w * 0.32, legH);

  ctx.fillStyle = '#D3271E';
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, legsTop);
  ctx.lineTo(-w * 0.42, torsoTop + 4);
  ctx.quadraticCurveTo(0, torsoTop - 6, w * 0.42, torsoTop + 4);
  ctx.lineTo(w * 0.42, legsTop);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#D3271E';
  ctx.beginPath();
  ctx.ellipse(w * 0.42, torsoTop + 16, 6, 10, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(w * 0.46, torsoTop + 24, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1E4FBF';
  ctx.fillRect(-w * 0.3, torsoTop + 8, w * 0.6, bodyH - 2);
  ctx.fillRect(-w * 0.26, torsoTop - 4, 6, 18);
  ctx.fillRect(w * 0.2, torsoTop - 4, 6, 18);
  ctx.fillStyle = '#F0B429';
  ctx.beginPath();
  ctx.arc(-w * 0.15, torsoTop + 16, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.15, torsoTop + 16, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#D3271E';
  ctx.beginPath();
  ctx.ellipse(-w * 0.44, torsoTop + 16, 6, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-w * 0.48, torsoTop + 24, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F4C49B';
  ctx.beginPath();
  ctx.ellipse(0, headCY, headR, headR * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F4C49B';
  ctx.beginPath();
  ctx.arc(-headR * 0.68, headCY + headR * 0.08, headR * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5C3A21';
  ctx.beginPath();
  ctx.ellipse(-headR * 0.55, headCY + headR * 0.2, headR * 0.28, headR * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F4C49B';
  ctx.beginPath();
  ctx.ellipse(headR * 0.58, headCY + headR * 0.08, headR * 0.36, headR * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4A2E18';
  ctx.beginPath();
  ctx.moveTo(headR * 0.05, headCY + headR * 0.28);
  ctx.quadraticCurveTo(headR * 0.5, headCY + headR * 0.58, headR * 0.98, headCY + headR * 0.3);
  ctx.quadraticCurveTo(headR * 0.5, headCY + headR * 0.38, headR * 0.05, headCY + headR * 0.28);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(headR * 0.1, headCY - headR * 0.18, headR * 0.22, headR * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#26301F';
  ctx.beginPath();
  ctx.arc(headR * 0.18, headCY - headR * 0.16, headR * 0.09, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#4A2E18';
  ctx.lineWidth = Math.max(1.6, headR * 0.12);
  ctx.beginPath();
  ctx.moveTo(-headR * 0.05, headCY - headR * 0.42);
  ctx.lineTo(headR * 0.45, headCY - headR * 0.5);
  ctx.stroke();

  ctx.fillStyle = '#D3271E';
  ctx.beginPath();
  ctx.ellipse(0, headCY - headR * 0.45, headR * 1.08, headR * 0.72, 0, Math.PI, 0, true);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headR * 0.55, headCY - headR * 0.1, headR * 0.6, headR * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-headR * 0.08, headCY - headR * 0.52, headR * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#D3271E';
  ctx.font = `bold ${Math.max(8, Math.round(headR * 0.42))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', -headR * 0.08, headCY - headR * 0.5);

  ctx.restore();
}

function drawParticles(ctx, particles, camera) {
  for (const p of particles) {
    const x = p.x - camera.x;
    ctx.globalAlpha = Math.max(p.life / 30, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/**
 * Render one frame of `state` onto `ctx`.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state game state as produced by createGame()
 */
export function render(ctx, state) {
  drawBackground(ctx, state.camera);
  if (!state.level) return;
  for (const p of state.level.platforms) drawPlatform(ctx, p, state.camera);
  for (const s of state.level.spikes) drawSpike(ctx, s, state.camera);
  for (const m of state.level.mushrooms) drawMushroom(ctx, m, state.camera);
  for (const e of state.level.enemies) drawEnemy(ctx, e, state.camera);
  drawFlag(ctx, state.level, state.camera, state.flagAnimT);
  drawPlayer(ctx, state.player, state.camera, state.invincibleTimer);
  drawParticles(ctx, state.particles, state.camera);
}
