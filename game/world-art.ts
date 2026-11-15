import type Phaser from "phaser";
import type { MissionId } from "./missions";
import type { Spot } from "./adventure";

export const spots: Spot[] = ["left", "middle", "right"];
export const equipment: Record<MissionId, [string, string, string]> = {
  go: ["air", "gear", "rocket"],
  land: ["panel", "cabin", "dish"],
  live: ["tank", "lamp", "bed"],
  explore: ["shelter", "rover", "rocks"],
};
// Feet lie on the illustrated floor; size is the longest dimension at a 300-unit scene height.
export const setup: Record<MissionId, [number, number, number][]> = {
  go: [
    [0.18, 0.73, 63],
    [0.49, 0.65, 64],
    [0.81, 0.71, 113],
  ],
  land: [
    [0.18, 0.72, 82],
    [0.5, 0.62, 92],
    [0.81, 0.73, 78],
  ],
  live: [
    [0.18, 0.69, 80],
    [0.47, 0.59, 85],
    [0.77, 0.74, 108],
  ],
  explore: [
    [0.16, 0.68, 91],
    [0.46, 0.74, 83],
    [0.8, 0.63, 68],
  ],
};

export function drawPlant(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  growth: number,
  planted: boolean,
  wet: boolean,
  picked: boolean,
) {
  if (wet) g.fillStyle(0x412c2b, 0.82).fillEllipse(x, y + 1, 49, 8);
  if (!planted) return;
  if (picked) {
    g.fillStyle(0x3c7735).fillRect(x - 4, y - 4, 8, 5);
    return;
  }
  if (!growth) {
    g.fillStyle(0x79442b).fillEllipse(x, y, 9, 5);
    g.fillStyle(0xffe48f).fillEllipse(x - 1, y - 1, 5, 3);
    return;
  }
  const count = growth === 1 ? 1 : 3;
  for (let i = 0; i < count; i++) {
    const cx = x + (i - (count - 1) / 2) * 21,
      cy = y + (i % 2 ? 2 : 0);
    g.fillStyle(0x375d32).fillRect(cx - 2, cy - 12, 4, 12);
    g.fillStyle(0x264e38).fillTriangle(
      cx,
      cy - 2,
      cx - 15,
      cy - 20,
      cx + 1,
      cy - 13,
    );
    g.fillStyle(0x5aa646).fillTriangle(
      cx,
      cy - 6,
      cx - 13,
      cy - 19,
      cx - 1,
      cy - 14,
    );
    g.fillStyle(0xa6e251).fillTriangle(
      cx - 3,
      cy - 11,
      cx - 13,
      cy - 19,
      cx - 6,
      cy - 17,
    );
    g.fillStyle(0x39875c).fillTriangle(
      cx,
      cy - 5,
      cx + 16,
      cy - 24,
      cx + 1,
      cy - 19,
    );
    g.fillStyle(0x91d65b).fillTriangle(
      cx + 2,
      cy - 11,
      cx + 13,
      cy - 23,
      cx + 4,
      cy - 20,
    );
    if (growth === 2) {
      g.fillStyle(0x386f36).fillEllipse(cx - 1, cy - 20, 13, 20);
      g.fillStyle(0x80be42).fillEllipse(cx - 2, cy - 24, 9, 13);
      g.lineStyle(1, 0xcaf582).lineBetween(cx, cy - 13, cx - 3, cy - 26);
    }
  }
}
export function cells(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  filled: number,
  total: number,
) {
  g.fillStyle(0x19233a).fillRoundedRect(
    x - total * 4 - 3,
    y,
    total * 8 + 6,
    9,
    2,
  );
  for (let i = 0; i < total; i++)
    g.fillStyle(i < filled ? 0x7ff6ac : 0x506077).fillRect(
      x - total * 4 + i * 8,
      y + 2,
      6,
      5,
    );
}
export function sparkle(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  color: number,
) {
  g.fillStyle(color)
    .fillRect(x - 1, y - r, 2, r * 2)
    .fillRect(x - r, y - 1, r * 2, 2);
}
