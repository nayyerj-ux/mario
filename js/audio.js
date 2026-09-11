// Synthesized sound effects (no audio files needed) plus optional recorded
// voice lines. Every entry point is defensive: browsers that block/lack the
// Web Audio API, or a deploy target missing the *.mp3 voice files, must
// degrade to a silent no-op rather than throw.

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      try {
        audioCtx = new AC();
      } catch {
        audioCtx = null;
      }
    }
  }
  return audioCtx;
}

function beep(freq, dur, type, vol) {
  type = type || 'sine';
  vol = vol === undefined ? 0.18 : vol;
  const ac = getAudioCtx();
  if (!ac) return;
  try {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(ac.destination);
    const now = ac.currentTime;
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.stop(now + dur + 0.02);
  } catch {
    /* audio is decorative; ignore playback failures */
  }
}

export const sfx = {
  jump: () => beep(520, 0.12, 'square', 0.15),
  collect: () => {
    beep(700, 0.08, 'triangle', 0.18);
    setTimeout(() => beep(980, 0.1, 'triangle', 0.15), 60);
  },
  golden: () => {
    beep(600, 0.09, 'sawtooth', 0.16);
    setTimeout(() => beep(900, 0.09, 'sawtooth', 0.16), 70);
    setTimeout(() => beep(1200, 0.14, 'sawtooth', 0.16), 140);
  },
  stomp: () => beep(160, 0.14, 'square', 0.2),
  hurt: () => beep(120, 0.25, 'sawtooth', 0.22),
  flag: () => {
    [660, 760, 880, 990].forEach((f, i) => setTimeout(() => beep(f, 0.15, 'triangle', 0.18), i * 90));
  },
  lose: () => {
    [300, 260, 220, 160].forEach((f, i) => setTimeout(() => beep(f, 0.22, 'sawtooth', 0.2), i * 130));
  },
};

// Voice lines are generated at deploy time (see .github/workflows/deploy.yml)
// and are NOT part of the repository, so a local checkout/dev server will
// legitimately 404 on these - that must stay silent, never break the game.
const VOICE_FILES = { welcome: 'welcome.mp3', start: 'start.mp3', win: 'win.mp3', lose: 'lose.mp3' };
const voices = {};
function getVoice(key) {
  if (!(key in VOICE_FILES)) return null;
  if (!(key in voices)) {
    try {
      voices[key] = new Audio(VOICE_FILES[key]);
    } catch {
      voices[key] = null;
    }
  }
  return voices[key];
}

/**
 * Best-effort playback of a recorded voice line. Never throws and never
 * surfaces a rejected promise, even if the file is missing or autoplay is
 * blocked by the browser.
 * @param {'welcome'|'start'|'win'|'lose'} key
 */
export function playVoice(key) {
  const a = getVoice(key);
  if (!a) return;
  try {
    a.currentTime = 0;
    const p = a.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {
    /* ignore: voice lines are a non-essential enhancement */
  }
}

export { getAudioCtx };
