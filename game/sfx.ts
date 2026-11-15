// Tiny synth sounds. Nothing plays unless the player turns sound on.
export type Sfx = "move" | "ok" | "nope" | "star" | "win";
const tunes: Record<Sfx, [number, number][]> = {
  // [frequency Hz, start seconds]
  move: [[520, 0]],
  ok: [
    [660, 0],
    [880, 0.055],
  ],
  nope: [
    [220, 0],
    [180, 0.09],
  ],
  star: [
    [784, 0],
    [1047, 0.08],
    [1319, 0.16],
  ],
  win: [
    [523, 0],
    [659, 0.1],
    [784, 0.2],
    [1047, 0.3],
    [1319, 0.42],
  ],
};
let ctx: AudioContext | null = null;
export function play(name: Sfx) {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    for (const [freq, at] of tunes[name]) {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = name === "nope" ? "triangle" : "square";
      osc.frequency.setValueAtTime(freq, now + at);
      gain.gain.setValueAtTime(name === "move" ? 0.012 : 0.03, now + at);
      gain.gain.exponentialRampToValueAtTime(0.001, now + at + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.15);
    }
  } catch {
    /* Audio is optional. */
  }
}
