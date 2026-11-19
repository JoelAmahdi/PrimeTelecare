/**
 * Web Audio API synthesizer for live call dialing, ringing, and connection sounds.
 * Zero external audio files required — synthesized directly in the browser.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playRingingTone(): () => void {
  try {
    const ctx = getAudioContext();
    let isPlaying = true;
    let timeoutId: any;

    const playBurst = () => {
      if (!isPlaying) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 1.2);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 1.4);
      osc2.stop(ctx.currentTime + 1.4);

      timeoutId = setTimeout(playBurst, 3000);
    };

    playBurst();

    return () => {
      isPlaying = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  } catch (e) {
    console.warn('Audio ringing not supported or blocked by autoplay policy', e);
    return () => {};
  }
}

export function playConnectedTone() {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.12;

      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch (e) {
    console.warn('Could not play connected tone', e);
  }
}

export function playHangupTone() {
  try {
    const ctx = getAudioContext();
    const notes = [440, 330];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.15;

      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.28);
    });
  } catch (e) {
    console.warn('Could not play hangup tone', e);
  }
}

/**
 * Clean dual-tone chime for incoming text messages on mobile & desktop
 */
export function playMessageChime(): void {
  try {
    const ctx = getAudioContext();
    const notes = [
      { freq: 783.99, start: 0, dur: 0.12 },     // G5
      { freq: 1046.50, start: 0.08, dur: 0.28 },  // C6
    ];
    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = ctx.currentTime + start;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.18, st + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, st + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(st);
      osc.stop(st + dur + 0.05);
    });
  } catch (e) {
    console.warn('Could not play message chime', e);
  }
}

/**
 * Pleasant medical attention chime for appointment alerts, reschedules, etc.
 */
export function playNotificationChime(): void {
  try {
    const ctx = getAudioContext();
    const notes = [
      { freq: 523.25, start: 0, dur: 0.1 },      // C5
      { freq: 659.25, start: 0.08, dur: 0.1 },   // E5
      { freq: 783.99, start: 0.16, dur: 0.3 },   // G5
    ];
    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = ctx.currentTime + start;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.15, st + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, st + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(st);
      osc.stop(st + dur + 0.05);
    });
  } catch (e) {
    console.warn('Could not play notification chime', e);
  }
}

/**
 * Specialized confirmation chime for issued e-prescriptions
 */
export function playPrescriptionChime(): void {
  try {
    const ctx = getAudioContext();
    const notes = [
      { freq: 440.00, start: 0, dur: 0.09 },    // A4
      { freq: 554.37, start: 0.09, dur: 0.09 },  // C#5
      { freq: 659.25, start: 0.18, dur: 0.25 },  // E5
    ];
    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = ctx.currentTime + start;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.14, st + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, st + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(st);
      osc.stop(st + dur + 0.05);
    });
  } catch (e) {
    console.warn('Could not play prescription chime', e);
  }
}

/**
 * Unlocks AudioContext on user gesture
 */
export function ensureAudioContext(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {}
}

