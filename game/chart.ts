import Phaser from "phaser";
import { missions, type MissionId } from "./missions";
import { anchors } from "./layout";
import type { MapStore } from "./state";

export function mountChart(
  parent: HTMLElement,
  store: MapStore,
  select: (id: MissionId) => void,
  onReady: () => void,
) {
  class Chart extends Phaser.Scene {
    islands: Phaser.GameObjects.Image[] = [];
    base: number[] = [];
    marker!: Phaser.GameObjects.Graphics;
    track!: Phaser.GameObjects.Graphics;
    sky!: Phaser.GameObjects.Image;
    clock = 0;
    preload() {
      this.load.image("stars", "/art/star-chart.webp");
      missions.forEach((m) => this.load.image(m.id, "/art/" + m.id + ".webp"));
    }
    create() {
      this.sky = this.add.image(0, 0, "stars").setOrigin(0);
      this.track = this.add.graphics();
      this.marker = this.add.graphics();
      for (const m of missions) {
        const island = this.add
          .image(0, 0, m.id)
          .setOrigin(0.5, 1)
          .setInteractive({ useHandCursor: true });
        island.on("pointerdown", () => select(m.id));
        this.islands.push(island);
      }
      this.layout();
      const unsub = store.subscribe(() => this.highlight());
      this.scale.on("resize", this.layout, this);
      this.events.once("shutdown", () => {
        unsub();
        this.scale.off("resize", this.layout, this);
      });
      onReady();
    }
    layout() {
      const { width: w, height: h } = this.scale;
      if (!this.sky) return;
      const compact = w < 680;
      const nodes = anchors(compact);
      this.sky.setDisplaySize(w, h);
      this.track.clear();
      const size = compact
        ? Math.min(w * 0.37, h * 0.237)
        : Math.min(w * 0.183, h * 0.455);
      this.islands.forEach((island, i) => {
        const scale = size / Math.max(island.width, island.height);
        this.base[i] = Math.round(nodes[i].y * h - 9);
        island
          .setScale(scale)
          .setPosition(Math.round(nodes[i].x * w), this.base[i]);
      });
      // A dashed flight path curves between islands in journey order.
      for (let i = 0; i < 3; i++) {
        const a = this.islands[i],
          b = this.islands[i + 1];
        const ay = this.base[i] - a.displayHeight * 0.26,
          by = this.base[i + 1] - b.displayHeight * 0.26;
        const steps = Math.ceil(Math.hypot(b.x - a.x, by - ay) / 12);
        const point = (t: number) => ({
          x: a.x + (b.x - a.x) * t,
          y: ay + (by - ay) * t + Math.sin(t * Math.PI) * 18,
        });
        this.track.lineStyle(2, 0x8594af, 0.7);
        for (let j = 0; j < steps; j++) {
          const p = point(j / steps),
            q = point((j + 0.47) / steps);
          this.track.lineBetween(p.x, p.y, q.x, q.y);
        }
      }
      this.highlight();
    }
    highlight() {
      const index = missions.findIndex((m) => m.id === store.get().selected);
      const island = this.islands[index];
      if (!island) return;
      const w = island.displayWidth + 14,
        h = island.displayHeight + 12;
      const x = island.x - w / 2,
        y = this.base[index] - h + 6;
      this.marker.clear().lineStyle(2, 0xffcb67, 0.96);
      for (const [cx, sx] of [
        [x, 1],
        [x + w, -1],
      ])
        for (const [cy, sy] of [
          [y, 1],
          [y + h, -1],
        ]) {
          this.marker
            .lineBetween(cx, cy, cx + sx * 11, cy)
            .lineBetween(cx, cy, cx, cy + sy * 11);
        }
    }
    update(_time: number, dt: number) {
      const { paused, prefs } = store.get();
      if (!paused && !prefs.reducedMotion) this.clock += Math.min(dt, 50);
      this.islands.forEach((island, i) => {
        island.y =
          this.base[i] +
          (prefs.reducedMotion ? 0 : Math.sin(this.clock / 1000 + i * 2) * 2);
      });
    }
  }
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: parent.clientWidth,
    height: parent.clientHeight,
    scene: Chart,
    render: { antialias: true, roundPixels: true },
    audio: { noAudio: true },
    // Taps on dialogs and buttons outside the canvas must never reach the scene.
    input: { windowEvents: false },
    banner: false,
    scale: { mode: Phaser.Scale.NONE },
    fps: { target: 30 },
  });
  const observer = new ResizeObserver(() =>
    game.scale.resize(parent.clientWidth, parent.clientHeight),
  );
  observer.observe(parent);
  return () => {
    observer.disconnect();
    game.destroy(true);
  };
}
