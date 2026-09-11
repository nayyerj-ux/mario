import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../../js/game.js';
import { LEVELS } from '../../js/levels.js';
import { MAX_LIVES, STARTING_LIVES } from '../../js/config.js';

const NO_INPUT = { left: false, right: false, jump: false };

test('startGame resets score/lives and enters the playing phase', () => {
  const game = createGame();
  const events = game.startGame();
  assert.deepEqual(events, ['gameStarted']);
  assert.equal(game.state.phase, 'playing');
  assert.equal(game.state.score, 0);
  assert.equal(game.state.lives, STARTING_LIVES);
  assert.equal(game.state.currentLevel, 0);
  assert.ok(game.state.player);
  assert.equal(game.state.player.x, LEVELS[0].startX);
});

test('update() is a no-op before the game has started', () => {
  const game = createGame();
  assert.deepEqual(game.update(NO_INPUT), []);
  assert.equal(game.state.phase, 'start');
});

test('pressing jump only launches the player while grounded', () => {
  const game = createGame();
  game.startGame();
  game.state.player.onGround = true;
  const events = game.update({ ...NO_INPUT, jump: true });
  assert.ok(events.includes('jump'));
  assert.ok(game.state.player.vy < 0);

  // airborne now: a second jump press should not re-trigger
  const events2 = game.update({ ...NO_INPUT, jump: true });
  assert.ok(!events2.includes('jump'));
});

test('collecting a normal mushroom scores 20 points', () => {
  const game = createGame();
  game.startGame();
  const m = game.state.level.mushrooms.find((x) => x.type === 'normal');
  game.state.player.x = m.x;
  game.state.player.y = m.y;
  const events = game.update(NO_INPUT);
  assert.ok(events.includes('collectMushroom'));
  assert.equal(game.state.score, 20);
  assert.ok(m.collected);
});

test('collecting a golden mushroom scores 100, grows the player and adds a life', () => {
  const game = createGame();
  game.startGame();
  game.state.lives = 2;
  const m = game.state.level.mushrooms.find((x) => x.type === 'golden');
  game.state.player.x = m.x;
  game.state.player.y = m.y;
  const events = game.update(NO_INPUT);
  assert.ok(events.includes('collectGolden'));
  assert.equal(game.state.score, 100);
  assert.equal(game.state.player.size, 'big');
  assert.equal(game.state.lives, 3);
});

test('golden mushroom life bonus is capped at MAX_LIVES', () => {
  const game = createGame();
  game.startGame();
  game.state.lives = MAX_LIVES;
  const m = game.state.level.mushrooms.find((x) => x.type === 'golden');
  game.state.player.x = m.x;
  game.state.player.y = m.y;
  game.update(NO_INPUT);
  assert.equal(game.state.lives, MAX_LIVES);
});

test('stomping an enemy from above kills it and bounces the player', () => {
  const game = createGame();
  game.startGame();
  const e = game.state.level.enemies[0];
  game.state.player.x = e.x;
  game.state.player.y = e.y - 32 - game.state.player.h + 3; // just touching the top
  game.state.player.vy = 5; // falling
  const events = game.update(NO_INPUT);
  assert.ok(events.includes('stomp'));
  assert.equal(e.alive, false);
  assert.equal(game.state.score, 50);
  assert.ok(game.state.player.vy < 0); // bounced back up
});

test('touching an enemy from the side damages the player instead of killing it', () => {
  const game = createGame();
  game.startGame();
  game.state.invincibleTimer = 0;
  const e = game.state.level.enemies[0];
  game.state.player.x = e.x;
  game.state.player.y = e.y - 32; // level with the enemy, not falling onto it
  game.state.player.vy = 0;
  const events = game.update(NO_INPUT);
  assert.ok(events.includes('hurt'));
  assert.ok(events.includes('loseLife'));
  assert.equal(e.alive, true);
  assert.equal(game.state.lives, STARTING_LIVES - 1);
});

test('losing the last life ends the game', () => {
  const game = createGame();
  game.startGame();
  game.state.lives = 1;
  game.state.invincibleTimer = 0;
  const s = game.state.level.spikes[0];
  game.state.player.x = s.x;
  game.state.player.y = s.y;
  const events = game.update(NO_INPUT);
  assert.ok(events.includes('gameOver'));
  assert.equal(game.state.phase, 'gameover');
  assert.equal(game.state.lives, 0);
});

test('invincibility frames prevent repeated damage', () => {
  const game = createGame();
  game.startGame();
  game.state.invincibleTimer = 60;
  const s = game.state.level.spikes[0];
  game.state.player.x = s.x;
  game.state.player.y = s.y;
  const events = game.update(NO_INPUT);
  assert.deepEqual(
    events.filter((e) => e === 'hurt'),
    [],
  );
  assert.equal(game.state.lives, STARTING_LIVES);
});

test('reaching the flag on a non-final level triggers levelComplete, and nextLevel advances', () => {
  const game = createGame();
  game.startGame();
  game.state.player.x = game.state.level.flagX + 1;
  const events = game.update(NO_INPUT);
  assert.ok(events.includes('flag'));
  assert.ok(events.includes('levelComplete'));
  assert.equal(game.state.phase, 'levelcomplete');

  game.nextLevel();
  assert.equal(game.state.currentLevel, 1);
  assert.equal(game.state.phase, 'playing');
  assert.equal(game.state.player.x, LEVELS[1].startX);
});

test('reaching the flag on the final level triggers win', () => {
  const game = createGame();
  game.startGame();
  for (let i = 0; i < LEVELS.length - 1; i++) {
    game.state.player.x = game.state.level.flagX + 1;
    game.update(NO_INPUT); // triggers levelComplete
    game.nextLevel();
  }
  assert.equal(game.state.currentLevel, LEVELS.length - 1);
  game.state.player.x = game.state.level.flagX + 1;
  const events = game.update(NO_INPUT);
  assert.ok(events.includes('win'));
  assert.equal(game.state.phase, 'win');
});
