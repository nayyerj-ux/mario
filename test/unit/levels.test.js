import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, cloneLevel } from '../../js/levels.js';

test('every level has a flag reachable within its width', () => {
  for (const [i, lvl] of LEVELS.entries()) {
    assert.ok(lvl.flagX < lvl.width, `level ${i}: flagX (${lvl.flagX}) should be < width (${lvl.width})`);
    assert.ok(lvl.startX >= 0 && lvl.startX < lvl.flagX, `level ${i}: startX should sit before the flag`);
  }
});

test('every level has at least one golden mushroom', () => {
  for (const [i, lvl] of LEVELS.entries()) {
    assert.ok(
      lvl.mushrooms.some((m) => m.type === 'golden'),
      `level ${i}: no golden mushroom`,
    );
  }
});

test('every enemy patrol range is well-formed and contains its spawn point', () => {
  for (const [i, lvl] of LEVELS.entries()) {
    for (const e of lvl.enemies) {
      assert.ok(e.minX < e.maxX, `level ${i}: enemy minX/maxX out of order`);
      assert.ok(e.x >= e.minX && e.x <= e.maxX, `level ${i}: enemy spawn outside its own patrol range`);
    }
  }
});

test('all platforms, mushrooms and spikes stay within the level bounds', () => {
  for (const [i, lvl] of LEVELS.entries()) {
    for (const p of lvl.platforms) {
      assert.ok(p.x >= 0 && p.x + p.w <= lvl.width, `level ${i}: platform out of bounds`);
    }
    for (const m of lvl.mushrooms) {
      assert.ok(m.x >= 0 && m.x <= lvl.width, `level ${i}: mushroom out of bounds`);
    }
    for (const s of lvl.spikes) {
      assert.ok(s.x >= 0 && s.x + s.w <= lvl.width, `level ${i}: spike out of bounds`);
    }
  }
});

test('cloneLevel deep-clones so mutating the clone never touches the source', () => {
  const clone = cloneLevel(0);
  clone.mushrooms[0].collected = true;
  clone.enemies[0].alive = false;
  clone.platforms[0].x = -999;
  assert.equal(LEVELS[0].mushrooms[0].collected, undefined);
  assert.equal(LEVELS[0].enemies[0].alive, undefined);
  assert.notEqual(LEVELS[0].platforms[0].x, -999);
});

test('cloneLevel starts every mushroom uncollected and every enemy alive', () => {
  const clone = cloneLevel(1);
  assert.ok(clone.mushrooms.every((m) => m.collected === false));
  assert.ok(clone.enemies.every((e) => e.alive === true));
});
