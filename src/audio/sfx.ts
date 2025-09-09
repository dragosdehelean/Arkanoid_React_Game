import type { Store } from '@reduxjs/toolkit';
import type { RootState } from '../state/store';

type SfxName = 'hit' | 'break' | 'lose' | 'click';

let audioCtx: AudioContext | null = null;
let volume = 1;
let muted = false;

export function initAudio(store: Store<RootState>) {
  const ensureCtx = () => {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { audioCtx = null; }
    }
  };
  // Initialize context on first interaction
  const resume = () => { ensureCtx(); audioCtx?.resume(); window.removeEventListener('pointerdown', resume); };
  window.addEventListener('pointerdown', resume, { once: true });

  const sync = () => {
    const s = store.getState();
    volume = s.settings.volume;
    muted = s.game.muted;
  };
  sync();
  store.subscribe(sync);
}

function tone(freq: number, time = 0.08, type: OscillatorType = 'sine') {
  if (muted || !audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.35 * volume, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + time);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + time + 0.02);
}

export const sfx = {
  play(name: SfxName) {
    switch (name) {
      case 'hit': tone(520, 0.06, 'triangle'); break;
      case 'break': tone(320, 0.1, 'sawtooth'); break;
      case 'lose': tone(160, 0.2, 'square'); break;
      case 'click': tone(700, 0.05, 'sine'); break;
    }
  }
};

