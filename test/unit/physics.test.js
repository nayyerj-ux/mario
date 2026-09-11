import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aabb, moveAndCollide } from '../../js/physics.js';

test('aabb detects overlap', () => {
  assert.equal(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }), true);
});

test('aabb detects no overlap when boxes are separated', () => {
  assert.equal(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 10, h: 10 }), false);
});

test('aabb treats exactly-touching edges as not overlapping', () => {
  assert.equal(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 }), false);
});

test('moveAndCollide lands the player on top of a platform', () => {
  const player = { x: 0, y: 0, w: 10, h: 10, vx: 0, vy: 5, onGround: false };
  const platforms = [{ x: -5, y: 12, w: 30, h: 20 }];
  moveAndCollide(player, platforms, 1000);
  assert.equal(player.y, 2); // platform.y - player.h
  assert.equal(player.vy, 0);
  assert.equal(player.onGround, true);
});

test('moveAndCollide blocks horizontal movement into a wall', () => {
  const player = { x: 15, y: 0, w: 10, h: 10, vx: 5, vy: 0, onGround: false };
  const platforms = [{ x: 20, y: -5, w: 30, h: 30 }];
  moveAndCollide(player, platforms, 1000);
  assert.equal(player.x, 10); // pushed back to platform.x - player.w
  assert.equal(player.vx, 0);
});

test('moveAndCollide clamps the player within level bounds', () => {
  const player = { x: 0, y: 0, w: 10, h: 10, vx: -50, vy: 0, onGround: false };
  moveAndCollide(player, [], 100);
  assert.equal(player.x, 0);

  const player2 = { x: 95, y: 0, w: 10, h: 10, vx: 50, vy: 0, onGround: false };
  moveAndCollide(player2, [], 100);
  assert.equal(player2.x, 90); // levelWidth - player.w
});

test('moveAndCollide stops upward movement against a ceiling', () => {
  const player = { x: 0, y: 14, w: 10, h: 10, vx: 0, vy: -5, onGround: false };
  const platforms = [{ x: -5, y: 0, w: 30, h: 12 }];
  moveAndCollide(player, platforms, 1000);
  assert.equal(player.y, 12); // platform.y + platform.h
  assert.equal(player.vy, 0);
});
