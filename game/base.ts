// The living picture of the Outpost Commander base. It only draws what the
// React state says; it never changes the game.
import Phaser from "phaser";
import { cells, drawPlant, sparkle } from "./world-art";
import type { Plan } from "./outpost";

export type BaseView = {
  plan: Plan;
  sun: number;
  storm: boolean;
  battery: number;
  food: number;
  water: number;
  row: number; // 0 air, 1 farm, 2 water, 3 shield, 4 lab, 5 end of day
  reduced: boolean;
  paused: boolean;
};
const height = 200;
// panel, cabin (air), bed (farm), tank (water), shelter, dish (lab)
const art = ["panel", "cabin", "bed", "tank", "shelter", "dish"] as const;
const spots = [0.07, 0.23, 0.4, 0.56, 0.73, 0.91];
const sizes = [48, 60, 62, 50, 60, 50];
const poses = ["front", "walk-a", "walk-b", "side-a", "side-b"];

export function startBase(host: HTMLElement, view: () => BaseView) {
  const fit = () =>
    Math.round(
      Phaser.Math.Clamp(
        (height * host.clientWidth) / Math.max(1, host.clientHeight),
        300,
        1400,
      ),
    );
  let width = fit();
  class Base extends Phaser.Scene {
    sky!: Phaser.GameObjects.Image;
    shade!: Phaser.GameObjects.Rectangle;
    back!: Phaser.GameObjects.Graphics;
    front!: Phaser.GameObjects.Graphics;
    props: Phaser.GameObjects.Image[] = [];
    crew!: Phaser.GameObjects.Image;
    crewX = -1;
    clock = 0;
    ready = false;
    streaks = Array.from({ length: 26 }, () => ({
      x: Math.random(),
      y: Math.random(),
      v: 0.5 + Math.random() * 0.6,
    }));
    preload() {
      this.load.image("sky", "/art/world/land.webp");
      for (const name of [...art, ...poses])
        this.load.image(name, "/art/world/" + name + ".webp");
    }
    create() {
      this.sky = this.add.image(0, 0, "sky").setOrigin(0.5);
      this.shade = this.add.rectangle(0, 0, 1, 1, 0x0b0f2c).setOrigin(0);
      this.back = this.add.graphics();
      this.props = art.map((name) =>
        this.add.image(0, 0, name).setOrigin(0.5, 1),
      );
      this.crew = this.add.image(0, 0, "front").setOrigin(0.5, 1);
      this.front = this.add.graphics();
      this.ready = art.every((k) => this.textures.exists(k));
      this.layout();
    }
    ground() {
      return height * 0.84;
    }
    layout() {
      if (!this.sky) return;
      const sc = Math.max(width / this.sky.width, height / this.sky.height);
      this.sky.setPosition(width / 2, height / 2).setScale(sc);
      this.shade.setDisplaySize(width, height);
      this.props.forEach((p, i) => {
        const size = sizes[i] * Math.min(1, width / 420);
        p.setScale(size / Math.max(p.width, p.height)).setPosition(
          spots[i] * width,
          this.ground(),
        );
      });
    }
    update(_t: number, delta: number) {
      if (!this.ready) return;
      const v = view();
      const dt = Math.min(delta, 50);
      if (!v.paused && !v.reduced) this.clock += dt;
      const t = this.clock;
      const gy = this.ground();
      const g = this.back.clear(),
        f = this.front.clear();
      const dim = v.sun < 4;
      this.shade.setAlpha(dim ? 0.42 : 0.08);
      // The Sun rides high on a bright day and hides behind the crater rim on a shadow day.
      const sx = dim ? width * 0.965 : width * 0.8,
        sy = dim ? height * 0.34 : height * 0.15;
      g.fillStyle(0xfff3c4, 0.25).fillCircle(
        sx,
        sy,
        15 + Math.sin(t / 500) * 1.5,
      );
      g.fillStyle(0xfff0a8).fillCircle(sx, sy, 9);
      if (dim)
        g.fillStyle(0x0d1226).fillTriangle(
          width,
          height * 0.22,
          width,
          height * 0.62,
          width * 0.86,
          height * 0.62,
        );
      const at = (i: number) => this.props[i];
      const top = (i: number) => at(i).y - at(i).displayHeight;
      // Power flows from the solar panel to every machine that has sparks.
      const counts = [
        0,
        v.plan.air,
        v.plan.farm,
        v.plan.water,
        v.plan.shield,
        v.plan.lab,
      ];
      const limits = [0, 1, 2, 1, 1, 3];
      for (let i = 1; i < 6; i++) {
        cells(f, at(i).x, top(i) - 13, counts[i], limits[i]);
        if (!counts[i]) continue;
        g.lineStyle(1.5, 0x8a7a3c, 0.8).lineBetween(
          at(0).x,
          gy + 5,
          at(i).x,
          gy + 5,
        );
        const span = at(i).x - at(0).x;
        for (let d = 0; d < 3; d++) {
          const u = (t / 900 + d / 3) % 1;
          sparkle(g, at(0).x + span * u, gy + 5, 3, 0xffe27c);
        }
      }
      cells(f, at(0).x, gy + 10, v.battery, 3);
      // Air fan: blades spin while it has power.
      const fan = { x: at(1).x, y: top(1) + 6 };
      const turn = v.plan.air ? t / 110 : 0.6;
      f.lineStyle(2, v.plan.air ? 0x9ae8d5 : 0x6b7890);
      for (let b = 0; b < 3; b++) {
        const a = turn + (b * Math.PI * 2) / 3;
        f.lineBetween(
          fan.x,
          fan.y,
          fan.x + Math.cos(a) * 8,
          fan.y + Math.sin(a) * 8,
        );
      }
      if (v.plan.air)
        for (let b = 0; b < 3; b++) {
          const u = (t / 1300 + b / 3) % 1;
          f.fillStyle(0xbdf6ff, 0.7 * (1 - u)).fillCircle(
            fan.x + 14 + b * 4,
            fan.y - u * 18,
            2,
          );
        }
      // Greenhouse: plants are bigger with more light; crates show the pantry.
      const bed = at(2);
      for (let k = -1; k <= 1; k++)
        drawPlant(
          f,
          bed.x + k * 4,
          bed.y - bed.displayHeight * 0.42,
          v.plan.farm,
          true,
          true,
          false,
        );
      for (let k = 0; k < v.food; k++)
        f.fillStyle(0x7fd66a)
          .fillRect(bed.x - 20 + k * 11, gy + 9, 9, 7)
          .fillStyle(0x2f6b3a)
          .fillRect(bed.x - 20 + k * 11, gy + 9, 9, 2);
      // Water recycler: clean drops fall while it runs; the tank shows the drinks left.
      const tank = at(3);
      cells(f, tank.x, gy + 10, v.water, 4);
      if (v.plan.water)
        for (let k = 0; k < 3; k++) {
          const u = (t / 900 + k / 3) % 1;
          f.fillStyle(0x58dbff, 1 - u).fillCircle(
            tank.x + 16,
            tank.y - tank.displayHeight * 0.7 + u * 22,
            2,
          );
        }
      // Lab dish: signal rings while it works.
      if (v.plan.lab)
        for (let k = 0; k < v.plan.lab; k++) {
          const u = (t / 1200 + k / v.plan.lab) % 1;
          f.lineStyle(1.5, 0xc5abff, 1 - u).strokeCircle(
            at(5).x - 6,
            top(5) + 8,
            4 + u * 20,
          );
        }
      // Sun storm: fast particles are invisible in real life. The game draws them.
      const shelter = at(4);
      if (v.storm) {
        for (const s of this.streaks) {
          const u = (s.y + (t / 1400) * s.v) % 1;
          const x = ((s.x + u * 0.35) % 1) * width,
            y = u * gy;
          f.lineStyle(1, 0xffc56b, 0.55).lineBetween(x, y, x - 9, y - 7);
        }
        const r = shelter.displayWidth * 0.75;
        if (v.plan.shield)
          f.lineStyle(2.5, 0x7ff6ff, 0.65 + Math.sin(t / 200) * 0.25)
            .strokeEllipse(
              shelter.x,
              shelter.y - 4,
              r * 2,
              shelter.displayHeight * 2.1,
            )
            .fillStyle(0x7ff6ff, 0.08)
            .fillEllipse(
              shelter.x,
              shelter.y - 4,
              r * 2,
              shelter.displayHeight * 2.1,
            );
        else if (Math.floor(t / 400) % 2 === 0 || v.reduced)
          f.fillStyle(0xff8a5c)
            .fillTriangle(
              shelter.x,
              top(4) - 30,
              shelter.x - 8,
              top(4) - 16,
              shelter.x + 8,
              top(4) - 16,
            )
            .fillStyle(0x1b1020)
            .fillRect(shelter.x - 1, top(4) - 26, 2, 6)
            .fillRect(shelter.x - 1, top(4) - 19, 2, 2);
      }
      // The astronaut walks to the machine the player is looking at.
      const goal = (v.row < 5 ? at(v.row + 1).x : at(0).x) + 22;
      if (this.crewX < 0 || v.reduced) this.crewX = goal;
      const gap = goal - this.crewX;
      const moving = Math.abs(gap) > 1 && !v.paused;
      if (moving)
        this.crewX += Math.sign(gap) * Math.min(Math.abs(gap), dt * 0.2);
      const alt = Math.floor(t / 130) % 2 === 0;
      const pose = moving ? (alt ? "side-a" : "side-b") : "front";
      if (this.crew.texture.key !== pose) this.crew.setTexture(pose);
      this.crew
        .setFlipX(moving && gap < 0)
        .setDisplaySize((34 * this.crew.width) / this.crew.height, 34)
        .setPosition(this.crewX, gy + 12);
    }
  }
  const scene = new Base();
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: host,
    backgroundColor: "#131c30",
    scene,
    width,
    height,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { pixelArt: true, roundPixels: true },
    audio: { noAudio: true },
    input: { windowEvents: false },
    fps: { target: 45 },
    banner: false,
  });
  const observer = new ResizeObserver(() => {
    const next = fit();
    if (next === width) return;
    scene.crewX = (scene.crewX / width) * next;
    width = next;
    game.scale.setGameSize(width, height);
    scene.layout();
  });
  observer.observe(host);
  return () => {
    observer.disconnect();
    game.destroy(true);
  };
}
