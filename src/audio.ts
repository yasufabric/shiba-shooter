type Tone = "square" | "sawtooth" | "triangle";

let context: AudioContext | null = null;

export function unlockAudio(): void {
  if (context === null) {
    context = new AudioContext();
  }
  void context.resume();
}

export function playTone(
  frequency: number,
  duration: number,
  type: Tone,
  level: number,
): void {
  if (context === null) {
    return;
  }
  const now = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(level, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export function playClear(): void {
  playTone(523, 0.08, "triangle", 0.05);
  playTone(659, 0.1, "triangle", 0.05);
  playTone(784, 0.14, "triangle", 0.05);
}
