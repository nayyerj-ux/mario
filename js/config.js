// Tunable constants for physics, entity sizes and scoring.
// Centralized here so level/physics/game code never hard-codes magic numbers.

export const CANVAS_W = 960;
export const CANVAS_H = 540;

// Physics
export const GRAVITY = 0.62;
export const MAX_FALL = 15;
export const MOVE_SPEED = 4.3;
export const JUMP_VEL = -12.6;
export const STOMP_BOUNCE_VEL = -9;
export const GROUND_Y = 460;
export const WORLD_BOTTOM = 640;

// Player sizes
export const SMALL_W = 30,
  SMALL_H = 38;
export const BIG_W = 36,
  BIG_H = 56;

// Entity hitboxes
export const ENEMY_SIZE = 32;
export const MUSHROOM_HITBOX = 28;
export const MUSHROOM_HALF = MUSHROOM_HITBOX / 2;

// Scoring / lives
export const SCORE_MUSHROOM = 20;
export const SCORE_GOLDEN_MUSHROOM = 100;
export const SCORE_STOMP = 50;
export const STARTING_LIVES = 3;
export const MAX_LIVES = 5;

// Invincibility windows (frames)
export const SPAWN_INVINCIBILITY = 60;
export const HIT_INVINCIBILITY = 100;
export const RESPAWN_INVINCIBILITY = 110;

// Camera
export const CAMERA_EASE = 0.15;
