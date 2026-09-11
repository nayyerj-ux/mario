// Keyboard + touch/mouse + keyboard-on-mobile-buttons input handling.
// Exposes a single `getMovementInput()` poll function so game logic never
// touches DOM/event state directly.

const keys = {};
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

let touchLeft = false,
  touchRight = false,
  touchJump = false;

/**
 * Wire an on-screen control button for pointer AND keyboard/AT activation
 * (Enter / Space), so touch controls are usable without a touchscreen.
 * @param {HTMLElement} el
 * @param {() => void} onDown
 * @param {() => void} onUp
 */
function bindHold(el, onDown, onUp) {
  el.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      onDown();
    },
    { passive: false },
  );
  el.addEventListener(
    'touchend',
    (e) => {
      e.preventDefault();
      onUp();
    },
    { passive: false },
  );
  el.addEventListener('mousedown', (e) => {
    e.preventDefault();
    onDown();
  });
  el.addEventListener('mouseup', (e) => {
    e.preventDefault();
    onUp();
  });
  el.addEventListener('mouseleave', () => onUp());
  el.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      onDown();
    }
  });
  el.addEventListener('keyup', (e) => {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      onUp();
    }
  });
}

/**
 * Bind the on-screen D-pad/jump buttons and reveal them on touch devices.
 * @param {{left: HTMLElement, right: HTMLElement, jump: HTMLElement, container: HTMLElement}} els
 */
export function initMobileControls(els) {
  bindHold(
    els.left,
    () => (touchLeft = true),
    () => (touchLeft = false),
  );
  bindHold(
    els.right,
    () => (touchRight = true),
    () => (touchRight = false),
  );
  bindHold(
    els.jump,
    () => (touchJump = true),
    () => (touchJump = false),
  );
  if ('ontouchstart' in window) els.container.classList.add('show');
}

/**
 * Poll the current movement intent for this frame.
 * @returns {{left: boolean, right: boolean, jump: boolean}}
 */
export function getMovementInput() {
  return {
    left: !!(keys.ArrowLeft || keys.KeyA || touchLeft),
    right: !!(keys.ArrowRight || keys.KeyD || touchRight),
    jump: !!(keys.ArrowUp || keys.KeyW || keys.Space || touchJump),
  };
}

/** True once any keyboard/pointer input has occurred (used to unlock audio autoplay). */
export function onFirstInteraction(cb) {
  document.addEventListener('pointerdown', cb, { once: true });
  document.addEventListener('keydown', cb, { once: true });
}
