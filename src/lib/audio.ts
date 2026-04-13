let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine") {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export function playCountdownBeep() {
  playTone(660, 0.15, "sine");
}

export function playGoBeep() {
  playTone(880, 0.3, "square");
  setTimeout(() => playTone(1100, 0.4, "square"), 100);
}

export function playCompleteBeep() {
  playTone(523, 0.15, "sine");
  setTimeout(() => playTone(659, 0.15, "sine"), 150);
  setTimeout(() => playTone(784, 0.2, "sine"), 300);
}

export async function runCountdown(
  onTick: (secondsLeft: number) => void,
  totalSeconds: number = 3
): Promise<void> {
  resumeAudioContext();

  for (let i = totalSeconds; i > 0; i--) {
    onTick(i);
    playCountdownBeep();
    await new Promise((r) => setTimeout(r, 1000));
  }

  onTick(0);
  playGoBeep();
}
