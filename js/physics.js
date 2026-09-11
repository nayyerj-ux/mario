// Pure collision/movement helpers. Deliberately free of game state, DOM and
// timers so they can be unit-tested in isolation (see test/physics.test.js).

/**
 * Axis-aligned bounding box overlap test.
 * @param {{x:number,y:number,w:number,h:number}} a
 * @param {{x:number,y:number,w:number,h:number}} b
 */
export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Move `player` by its current velocity, resolving axis-separated collisions
 * against `platforms`, and clamp horizontal position to the level bounds.
 * Mutates `player` in place (x, y, vx, vy, onGround).
 * @param {object} player
 * @param {Array<{x:number,y:number,w:number,h:number}>} platforms
 * @param {number} levelWidth
 */
export function moveAndCollide(player, platforms, levelWidth) {
  // horizontal
  player.x += player.vx;
  for (const p of platforms) {
    if (aabb(player, p)) {
      if (player.vx > 0) player.x = p.x - player.w;
      else if (player.vx < 0) player.x = p.x + p.w;
      player.vx = 0;
    }
  }
  player.x = Math.max(0, Math.min(player.x, levelWidth - player.w));

  // vertical
  player.y += player.vy;
  player.onGround = false;
  for (const p of platforms) {
    if (aabb(player, p)) {
      if (player.vy > 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = p.y + p.h;
        player.vy = 0;
      }
    }
  }
}
