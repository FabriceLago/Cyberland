// Lightweight Web Audio API sound effects for tactile educational game feedback

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

function getContext(): AudioContext | null {
  if (!soundEnabled || typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.06, delay = 0) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + delay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.02);
  } catch {
    // Ignore audio context autoplay errors
  }
}

export function playClick() {
  playTone(540, 0.06, 'triangle', 0.04);
}

export function playPacket() {
  playTone(660, 0.08, 'sine', 0.045);
  playTone(880, 0.08, 'sine', 0.035, 0.05);
}

export function playSuccess() {
  playTone(523.25, 0.12, 'triangle', 0.06, 0);
  playTone(659.25, 0.14, 'triangle', 0.06, 0.08);
  playTone(783.99, 0.2, 'triangle', 0.06, 0.16);
}

export function playError() {
  playTone(220, 0.14, 'sawtooth', 0.045, 0);
  playTone(185, 0.18, 'sawtooth', 0.04, 0.1);
}

export function playVictory() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, idx) => {
    playTone(n, 0.22, 'triangle', 0.065, idx * 0.09);
  });
}
