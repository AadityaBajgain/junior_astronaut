import Phaser from "phaser";
import type { MissionId } from "./missions";
import { meters, stations, type Run, type Spot } from "./adventure";
import { input } from "./input";
import {
  cells,
  drawPlant,
  equipment,
  setup,
  sparkle,
  spots,
} from "./world-art";

type Target = Spot | "photo";
type Point = { x: number; y: number };
type Hooks = {
  state: () => Run;
  activate: (spot: Spot) => Run;
  /** A big jump started in Moon gravity. */
  jumped: () => void;
  /** The astronaut started or stopped walking. */
  motion: (moving: boolean) => void;
  ready: () => void;
  failed: () => void;
};
type Prop = {
  image: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
};
const height = 300;
const poses = ["front", "walk-a", "walk-b", "side-a", "side-b", "back"];
const clamp = Phaser.Math.Clamp;
// Real gravity, scaled so one metre is 60 scene units. The same push-off speed
// lifts the astronaut six times higher on the Moon and keeps them up six times longer.
const metre = 60;
const gravity = { earth: 9.81 * metre, moon: 1.62 * metre };
const jumpSpeed = 104; // about 9 units high on Earth, 55 on the Moon
const stepSpeed = 30; // the bouncy Moon walk
const approach = (p: number) => 1 - Math.pow(1 - p, 3);
export type WorldHandle = {
  travel: (target: Target) => void;
  /** Uses the nearest object, as the A button does. False when nothing is near. */
  interact: () => boolean;
  /** Jumps with real gravity: Earth on the launchpad, the Moon everywhere else. */
  jump: () => void;
  setMotion: (reduced: boolean, paused: boolean) => void;
  reset: () => void;
  destroy: () => void;
};

export function startWorld(
  host: HTMLElement,
  id: MissionId,
  hooks: Hooks,
): WorldHandle {
  const fitWidth = () =>
    Math.round(
      clamp(
        (height * host.clientWidth) / Math.max(1, host.clientHeight),
        300,
        850,
      ),
    );
  let width = fitWidth();
  let reduced = false,
    paused = false,
    mounted = true;
  class Room extends Phaser.Scene {
    started = false;
    sky!: Phaser.GameObjects.Image;
    shade!: Phaser.GameObjects.Rectangle;
    floorInk!: Phaser.GameObjects.Graphics;
    detail!: Phaser.GameObjects.Graphics;
    fx!: Phaser.GameObjects.Graphics;
    actor!: Phaser.GameObjects.Image;
    shadow!: Phaser.GameObjects.Ellipse;
    buddy!: Phaser.GameObjects.Image;
    photoTag!: Phaser.GameObjects.Text;
    props: Prop[] = [];
    pos: Point = { x: 0, y: 0 };
    destination: Point | null = null;
    target: Target | null = null;
    queued: Target | null = null;
    via: Point | null = null;
    prompt!: Phaser.GameObjects.Text;
    clock = 0;
    stride = 0;
    face = "front";
    left = false;
    effect: {
      spot: Spot;
      before: Run;
      elapsed: number;
      duration: number;
    } | null = null;
    pointAt: Target | null = null;
    // Ambient life and feedback. None of it changes the game state.
    motes: { x: number; y: number; v: number; r: number; p: number }[] = [];
    puffs: { x: number; y: number; age: number }[] = [];
    confetti: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      c: number;
      age: number;
    }[] = [];
    popups: { text: Phaser.GameObjects.Text; age: number }[] = [];
    cheer = 0;
    step = 0;
    // Height above the ground and upward speed, in scene units and units per second.
    z = 0;
    vz = 0;
    wasMoving = false;
    leaping = false;

    preload() {
      this.load.image("landscape", "/art/world/" + id + ".webp");
      this.load.image("nova", "/art/nova.png");
      for (const name of [...equipment[id], ...poses])
        this.load.image(name, "/art/world/" + name + ".webp");
      this.load.once("loaderror", () => {
        if (mounted) hooks.failed();
      });
    }
    create() {
      if (
        !mounted ||
        ![...equipment[id], ...poses, "landscape", "nova"].every((k) =>
          this.textures.exists(k),
        )
      )
        return;
      this.sky = this.add.image(0, 0, "landscape").setOrigin(0.5);
      this.shade = this.add
        .rectangle(0, 0, width, height, 0x111039)
        .setOrigin(0)
        .setDepth(1);
      this.floorInk = this.add.graphics().setDepth(2);
      this.detail = this.add.graphics().setDepth(320);
      this.fx = this.add.graphics().setDepth(420);
      for (let i = 0; i < 30; i++)
        this.motes.push({
          x: Math.random(),
          y: Math.random(),
          v: 5 + Math.random() * 12,
          r: Math.random() < 0.3 ? 2 : 1,
          p: Math.random() * 6.28,
        });
      const labelStyle = {
        fontFamily: "monospace",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#fff8dd",
        backgroundColor: "#202438",
        padding: { x: 5, y: 2 },
        resolution: 2,
      };
      this.props = equipment[id].map((name) => ({
        image: this.add.image(0, 0, name).setOrigin(0.5, 1),
        shadow: this.add.ellipse(0, 0, 1, 1, 0x211935, 0.28).setDepth(3),
        label: this.add
          .text(0, 0, "", labelStyle)
          .setOrigin(0.5, 0)
          .setDepth(365),
      }));
      this.buddy = this.add
        .image(0, 0, "nova")
        .setOrigin(0.5, 1)
        .setDisplaySize(24, 25);
      this.photoTag = this.add
        .text(0, 0, "PHOTO", { ...labelStyle, color: "#9ef3d4" })
        .setOrigin(0.5, 0)
        .setDepth(364);
      this.prompt = this.add
        .text(0, 0, "", {
          ...labelStyle,
          color: "#172232",
          backgroundColor: "#ffcf71",
        })
        .setOrigin(0.5, 1)
        .setDepth(430);
      this.actor = this.add.image(0, 0, "front").setOrigin(0.5, 1);
      this.shadow = this.add.ellipse(0, 0, 25, 7, 0x28202e, 0.29).setDepth(4);
      const canvas = this.game.canvas;
      canvas.tabIndex = 0;
      canvas.setAttribute("role", "group");
      canvas.setAttribute(
        "aria-label",
        "Astronaut play area. Arrow keys, W A S D or a controller to walk. Space or A to use a nearby object.",
      );
      this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
        if (paused) return;
        canvas.focus({ preventScroll: true });
        const target = this.hit(p.x, p.y);
        if (target) this.visit(target);
        else if (p.y > height * 0.45 && !this.busy()) {
          this.target = null;
          this.via = null;
          this.destination = this.bound(p.x, p.y);
        }
      });
      this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
        this.pointAt = this.hit(p.x, p.y);
        canvas.style.cursor = this.pointAt ? "pointer" : "crosshair";
      });
      this.events.once("shutdown", () => {
        this.started = false;
      });
      this.started = true;
      this.reset();
      this.paint(false);
      hooks.ready();
    }
    jump() {
      // A big jump can start from the ground or from a little walking hop.
      if (!this.started || paused || reduced || this.leaping || this.busy())
        return;
      this.leaping = true;
      this.vz = jumpSpeed;
      this.z = 0.01;
      if (id !== "go") hooks.jumped();
    }
    interact() {
      const near = this.nearest();
      if (!near || paused) return false;
      this.visit(near);
      return true;
    }
    reset() {
      if (!this.started) return;
      this.clearEffects();
      this.z = this.vz = 0;
      this.leaping = false;
      this.effect = null;
      this.destination = this.via = null;
      this.target = this.queued = null;
      const run = hooks.state();
      this.pos = {
        x: width * (run.id === "explore" && run.away ? 0.68 : 0.39),
        y: height * 0.88,
      };
      this.face = "front";
      this.left = false;
      this.arrange();
    }
    arrange() {
      if (!this.started) return;
      const sc = Math.max(width / this.sky.width, height / this.sky.height);
      this.sky.setPosition(width / 2, height / 2).setScale(sc);
      this.shade.setDisplaySize(width, height);
      this.destination = this.via = null;
      this.target = null;
      this.pos = this.bound(this.pos.x, this.pos.y);
    }
    anchor(i: number, s: Run): Point {
      let [x, y] = setup[id][i];
      if (s.id === "explore" && i === 1) {
        x = s.away ? 0.65 : s.done ? 0.28 : 0.45;
        y = s.away ? 0.76 : 0.74;
      }
      if (s.id === "land" && i === 1 && s.phase !== "arrival")
        x = s.site === "plain" ? 0.44 : 0.55;
      return { x: width * x, y: height * y };
    }
    photoPoint(): Point {
      return { x: width * 0.09, y: height * 0.87 };
    }
    bound(x: number, y: number) {
      return {
        x: clamp(x, 12, width - 12),
        y: clamp(y, height * 0.49, height * 0.97),
      };
    }
    foot(t: Target): Point {
      const a =
        t === "photo"
          ? this.photoPoint()
          : this.anchor(spots.indexOf(t), hooks.state());
      if (
        t === "left" &&
        hooks.state().id === "explore" &&
        (hooks.state() as Extract<Run, { id: "explore" }>).away
      ) {
        const rover = this.anchor(1, hooks.state());
        return this.bound(rover.x, rover.y + 22);
      }
      const beside = Math.min(43, width * 0.1);
      return this.bound(
        a.x + (t === "right" ? -beside : t === "photo" ? 19 : beside),
        a.y + 21,
      );
    }
    targets(): Target[] {
      return stations(hooks.state()).map((s) => s.spot);
    }
    hit(x: number, y: number): Target | null {
      for (const t of stations(hooks.state())) {
        const i = spots.indexOf(t.spot),
          p = this.props[i];
        if (!p) continue;
        const a = this.anchor(i, hooks.state());
        const w = Math.max(38, p.image.displayWidth),
          h = Math.max(32, p.image.displayHeight);
        if (Math.abs(x - a.x) < w / 2 + 6 && y > a.y - h - 4 && y < a.y + 20)
          return t.spot;
      }
      return null;
    }
    nearest(): Target | null {
      let result: Target | null = null,
        best = Infinity;
      for (const target of this.targets()) {
        const p =
          target === "photo"
            ? this.photoPoint()
            : this.anchor(spots.indexOf(target), hooks.state());
        const d = Math.hypot(p.x - this.pos.x, p.y + 12 - this.pos.y);
        if (d < best) {
          best = d;
          result = target;
        }
      }
      return result;
    }
    busy() {
      return (
        !!this.effect &&
        this.effect.elapsed < this.effect.duration &&
        ((this.effect.before.id === "explore" &&
          (this.effect.spot === "middle" || this.effect.spot === "left")) ||
          (this.effect.before.id === "land" &&
            this.effect.before.phase === "arrival"))
      );
    }
    visit(t: Target) {
      if (!this.started || paused || !this.targets().includes(t)) return;
      if (this.busy()) {
        this.queued = t;
        return;
      }
      this.target = t;
      this.destination = this.foot(t);
      // A clear lane across the front keeps the astronaut in front of the equipment.
      this.via =
        Math.abs(this.destination.x - this.pos.x) > 64 &&
        this.pos.y < height * 0.79
          ? { x: this.pos.x, y: height * 0.83 }
          : null;
      if (reduced) {
        this.pos = { ...this.destination };
        this.arrive();
      }
    }
    arrive() {
      const t = this.target;
      this.target = null;
      this.destination = this.via = null;
      this.face = "front";
      this.left = false;
      if (!t) return;
      if (t === "photo") return;
      const before = hooks.state(),
        after = hooks.activate(t);
      if (!reduced && after.steps > before.steps)
        this.celebrate(t, before, after);
      const duration =
        before.id === "go" && after.done
          ? 1600
          : before.id === "explore" &&
              before.away !== (after as typeof before).away
            ? 850
            : 680;
      this.effect = {
        spot: t,
        before,
        elapsed: reduced ? duration : 0,
        duration,
      };
      if (
        after.id === "explore" &&
        before.id === "explore" &&
        before.away !== after.away
      ) {
        const a = this.anchor(1, after);
        this.pos = { x: a.x + 15, y: a.y + 18 };
      }
    }
    /** Floating labels show what changed; finishing a mission throws confetti. */
    celebrate(t: Spot, before: Run, after: Run) {
      const a = this.anchor(spots.indexOf(t), after);
      const was = new Map(meters(before));
      let row = 0;
      for (const [name, value] of meters(after)) {
        if (was.get(name) === value) continue;
        const text = this.add
          .text(
            clamp(a.x, 40, width - 40),
            a.y - 58 - row++ * 13,
            name + " " + value,
            {
              fontFamily: "monospace",
              fontSize: "10px",
              fontStyle: "bold",
              color: "#172232",
              backgroundColor: "#9ae8d5",
              padding: { x: 4, y: 2 },
              resolution: 2,
            },
          )
          .setOrigin(0.5, 1)
          .setDepth(440);
        this.popups.push({ text, age: 0 });
      }
      const landed = before.id === "land" && before.phase === "arrival";
      if ((before.id === "go" && after.done) || landed)
        this.cameras.main.shake(landed ? 320 : 1100, landed ? 0.008 : 0.005);
      if (after.done) {
        this.cheer = 1500;
        for (let i = 0; i < 40; i++)
          this.confetti.push({
            x: this.pos.x,
            y: this.pos.y - 34,
            vx: (Math.random() - 0.5) * 0.24,
            vy: -0.08 - Math.random() * 0.2,
            c: [0xffd078, 0x9ae8d5, 0xff9f6b, 0xc5abff, 0xffffff][i % 5],
            age: 0,
          });
      }
    }
    clearEffects() {
      this.popups.forEach((p) => p.text.destroy());
      this.popups = [];
      this.confetti = [];
      this.puffs = [];
      this.cheer = 0;
    }
    animate(dt: number, moving: boolean) {
      if (moving !== this.wasMoving) {
        this.wasMoving = moving;
        hooks.motion(moving);
      }
      if (reduced) {
        this.z = this.vz = 0;
        return this.clearEffects();
      }
      // Falling under gravity. Walking on the Moon is a chain of slow little hops.
      const g = id === "go" ? gravity.earth : gravity.moon;
      if (this.z <= 0 && moving && id !== "go") {
        this.vz = stepSpeed;
        this.z = 0.01;
      }
      if (this.z > 0) {
        this.vz -= (g * dt) / 1000;
        this.z += (this.vz * dt) / 1000;
        if (this.z <= 0) {
          this.z = this.vz = 0;
          this.leaping = false;
        }
      }
      for (const m of this.motes) m.x = (m.x + (m.v * dt) / 1000 / width) % 1;
      this.cheer = Math.max(0, this.cheer - dt);
      // Moon dust kicks up under boots outdoors, not on the launchpad or in the greenhouse.
      const step = Math.floor(this.stride / 240);
      if (moving && step !== this.step && (id === "land" || id === "explore"))
        this.puffs.push({ x: this.pos.x, y: this.pos.y, age: 0 });
      this.step = step;
      for (const p of this.puffs) p.age += dt;
      this.puffs = this.puffs.filter((p) => p.age < 420);
      for (const c of this.confetti) {
        c.age += dt;
        c.vy += 0.00042 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
      }
      this.confetti = this.confetti.filter((c) => c.age < 1700);
      for (const p of this.popups) {
        p.age += dt;
        p.text.y -= dt * 0.018;
        p.text.setAlpha(Math.min(1, 2.4 - p.age / 500));
      }
      this.popups = this.popups.filter((p) => {
        if (p.age < 1200) return true;
        p.text.destroy();
        return false;
      });
    }
    intersectsProp(x: number, y: number) {
      const s = hooks.state();
      return this.props.some((prop, i) => {
        if (!prop.image.visible) return false;
        const p = this.anchor(i, s);
        return (
          Math.abs(x - p.x) < Math.min(prop.image.displayWidth * 0.31, 25) &&
          y > p.y - 11 &&
          y < p.y + 3
        );
      });
    }
    walk(dt: number) {
      if (this.busy()) return false;
      let dx = Number(input.held("right")) - Number(input.held("left"));
      let dy = Number(input.held("down")) - Number(input.held("up"));
      const manual = dx !== 0 || dy !== 0;
      if (manual) {
        this.destination = this.via = null;
        this.target = null;
      }
      const dest = this.via ?? this.destination;
      if (!manual && dest) {
        dx = dest.x - this.pos.x;
        dy = dest.y - this.pos.y;
      }
      const d = Math.hypot(dx, dy);
      if (!manual && dest && d <= dt * 0.23 + 1) {
        this.pos = { ...dest };
        if (this.via) this.via = null;
        else this.arrive();
        return false;
      }
      if (!d) return false;
      const amount = dt * (manual ? 0.145 : 0.23);
      const next = this.bound(
        this.pos.x + (dx / d) * amount,
        this.pos.y + (dy / d) * amount,
      );
      if (!manual || !this.intersectsProp(next.x, this.pos.y))
        this.pos.x = next.x;
      if (!manual || !this.intersectsProp(this.pos.x, next.y))
        this.pos.y = next.y;
      this.face =
        Math.abs(dx) > Math.abs(dy) * 0.8 ? "side" : dy < 0 ? "back" : "front";
      this.left = dx < 0;
      this.stride += dt;
      return true;
    }
    update(_t: number, delta: number) {
      if (!this.started || !mounted) return;
      const dt = Math.min(delta, 50);
      if (paused) return;
      if (!reduced) this.clock += dt;
      if (this.effect)
        this.effect.elapsed = reduced
          ? this.effect.duration
          : Math.min(this.effect.duration, this.effect.elapsed + dt);
      if (this.queued && !this.busy()) {
        const t = this.queued;
        this.queued = null;
        this.visit(t);
      }
      const moving = this.walk(dt);
      this.animate(dt, moving);
      this.paint(moving);
    }
    paint(moving: boolean) {
      const s = hooks.state(),
        e = this.effect;
      const u = e ? Math.min(1, e.elapsed / e.duration) : 1;
      const anim = !!e && u < 1,
        used = !!e && s.steps > e.before.steps;
      const dark = (state: Run) =>
        !state.done &&
        ((state.id === "land" && state.phase === "night") ||
          (state.id === "live" && !state.sunny));
      const from = e && anim ? Number(dark(e.before)) : Number(dark(s));
      this.shade.setAlpha(0.44 * Phaser.Math.Linear(from, Number(dark(s)), u));
      this.floorInk.clear();
      this.detail.clear();
      this.fx.clear();
      const floor = this.floorInk,
        g = this.detail,
        fx = this.fx;
      const labels = stations(s);
      const nearest = this.nearest();
      if (!reduced) {
        if (id === "land" || id === "explore") {
          // Stars twinkle in the black lunar sky. There is no air to carry dust.
          for (const m of this.motes)
            floor
              .fillStyle(
                0xffffff,
                0.25 + 0.6 * Math.abs(Math.sin(this.clock / 800 + m.p)),
              )
              .fillRect(m.p * 0.159 * width, m.y * height * 0.2, m.r, m.r);
        }
        for (const p of this.puffs)
          floor
            .fillStyle(0xd5d9e2, 0.5 * (1 - p.age / 420))
            .fillCircle(p.x, p.y - p.age * 0.012, 2 + p.age * 0.012);
        for (const c of this.confetti)
          fx.fillStyle(c.c, Math.min(1, 3 - c.age / 560)).fillRect(
            c.x,
            c.y,
            3,
            3,
          );
      }
      for (let i = 0; i < 3; i++) {
        const p = this.props[i],
          a = this.anchor(i, s),
          obj = p.image;
        const size = setup[id][i][2] * Math.min(1, width / 425);
        obj
          .setVisible(true)
          .setAlpha(1)
          .setScale(size / Math.max(obj.width, obj.height))
          .setPosition(a.x, a.y)
          .setDepth(a.y);
        p.shadow
          .setVisible(true)
          .setPosition(a.x + 2, a.y - 1)
          .setDisplaySize(obj.displayWidth * 0.76, 8);
        const opt = labels.find((item) => item.spot === spots[i]);
        const sign = opt?.sign ?? "";
        if (p.label.text !== sign) p.label.setText(sign);
        p.label.setVisible(!!opt).setPosition(a.x, a.y + 4);
        const focus = spots[i] === (this.target ?? this.pointAt ?? nearest);
        const color = focus ? "#172232" : "#fff3cd";
        if (p.label.style.color !== color)
          p.label
            .setColor(color)
            .setBackgroundColor(focus ? "#ffcf71" : "#202438");
        if (focus && opt)
          floor
            .lineStyle(1.6, 0xffcf71, 0.9)
            .strokeEllipse(a.x, a.y, obj.displayWidth * 0.95 + 12, 13);
      }
      const [l, m, r] = this.props.map((p) => p.image);
      let onboard = false,
        passengerHeight = 28;
      let ride: Point | null = null;
      const at = (i: number) => this.anchor(i, s);
      switch (s.id) {
        case "go": {
          const ship = at(2);
          if (s.done) {
            const t = e?.before.id === "go" && anim ? u : 1;
            r.y = ship.y - approach(t) * (height * 0.53);
            r.setScale(r.scaleX * (1 - t * 0.74));
            this.props[2].shadow.setAlpha(1 - t * 0.85);
            fx.fillStyle(0xff853c).fillTriangle(
              r.x - 4,
              r.y - 3,
              r.x + 4,
              r.y - 3,
              r.x,
              r.y + 8 + (reduced ? 1 : Math.sin(this.clock / 65) * 4),
            );
            fx.fillStyle(0xffe27c).fillTriangle(
              r.x - 2,
              r.y,
              r.x + 2,
              r.y,
              r.x,
              r.y + 6,
            );
            onboard = true;
            if (t < 0.85)
              for (let j = 0; j < 8; j++)
                floor
                  .fillStyle(0xebf1e6, 0.65 * (1 - t))
                  .fillCircle(
                    ship.x + (j - 3.5) * (5 + t * 8),
                    ship.y - 3 - Math.sin(j) * 4,
                    3 + t * 8,
                  );
          } else {
            this.props[2].shadow.setAlpha(1);
            cells(g, r.x, r.y + 16, s.fuel, 3);
            if (s.air || s.kit !== "none") {
              cells(
                g,
                r.x,
                r.y - r.displayHeight * 0.34,
                Number(s.air) + Number(s.kit !== "none"),
                2,
              );
              if (s.air) g.fillStyle(0x6defee).fillCircle(l.x + 11, l.y - 8, 3);
              const x = r.x - r.displayWidth * 0.35,
                y = r.y - 8;
              if (s.kit === "battery") {
                g.fillStyle(0x1b3540).fillRect(x - 4, y - 10, 9, 13);
                g.fillStyle(0x8ceaa0)
                  .fillRect(x - 3, y - 8, 7, 9)
                  .fillRect(x - 2, y - 12, 4, 2);
              } else if (s.kit === "camera") {
                g.fillStyle(0xa294d6).fillRoundedRect(x - 7, y - 10, 15, 11, 2);
                g.fillStyle(0x24344c).fillCircle(x + 1, y - 5, 4);
                g.fillStyle(0xa6eeff).fillCircle(x + 1, y - 5, 2);
              }
            }
          }
          if (used && anim && e.spot !== "right") {
            const start = e.spot === "left" ? l : m;
            const x = Phaser.Math.Linear(start.x, r.x, u),
              y =
                Phaser.Math.Linear(start.y - 26, r.y - 30, u) -
                Math.sin(u * Math.PI) * 33;
            fx.fillStyle(0x253855).fillRoundedRect(x - 5, y - 7, 10, 14, 3);
            fx.fillStyle(
              e.spot === "left"
                ? 0x89f4fd
                : s.kit === "battery"
                  ? 0x8bf0a4
                  : 0xe6c6ff,
            ).fillRoundedRect(x - 4, y - 6, 8, 10, 2);
          }
          break;
        }
        case "land": {
          const cabin = at(1);
          if (s.phase === "arrival") {
            m.y = cabin.y - 38 + (reduced ? 0 : Math.sin(this.clock / 430) * 3);
            for (const [index, obj] of [
              [0, l],
              [2, r],
            ] as const) {
              const a = at(index);
              obj.setVisible(false);
              floor.fillStyle(0x28263f, 0.64).fillEllipse(a.x, a.y, 51, 16);
              floor
                .lineStyle(2, index === 0 ? 0x9de9f0 : 0xffcc72)
                .strokeEllipse(a.x, a.y, 45, 12);
              floor
                .lineStyle(2, 0xfdf4ce)
                .lineBetween(a.x - 6, a.y, a.x + 6, a.y)
                .lineBetween(a.x, a.y - 3, a.x, a.y + 3);
            }
            fx.fillStyle(0xffcc79, 0.85).fillTriangle(
              m.x - 4,
              m.y,
              m.x + 4,
              m.y,
              m.x,
              m.y + 8,
            );
          } else {
            if (
              anim &&
              e.before.id === "land" &&
              e.before.phase === "arrival"
            ) {
              m.x = Phaser.Math.Linear(width * 0.5, cabin.x, approach(u));
              m.y = cabin.y - 40 * (1 - approach(u));
              for (const obj of [l, r])
                obj.setScale(obj.scaleX * (0.25 + 0.75 * approach(u)));
              floor
                .fillStyle(0xe3d4db, 0.6 * (1 - u))
                .fillEllipse(m.x, m.y + 5, 65 * u, 10);
            }
            cells(g, l.x, l.y - 10, s.battery, 2);
            const cx = m.x,
              cy = m.y - m.displayHeight * 0.43;
            g.fillStyle(s.fan ? 0xffdb80 : 0x24364a).fillCircle(cx, cy, 6);
            const a = s.fan ? this.clock / 150 : 0;
            for (let j = 0; j < 3; j++)
              g.lineStyle(2, 0x364356).lineBetween(
                cx,
                cy,
                cx + Math.cos(a + j * 2.094) * 4,
                cy + Math.sin(a + j * 2.094) * 4,
              );
            if (s.maps) {
              const px = r.x + 20,
                py = r.y + 3;
              floor.lineStyle(2, 0x70d9d6).strokeEllipse(px, py, 22, 7);
              g.lineStyle(2, 0x263c52).lineBetween(px, py, px, py - 15);
              g.fillStyle(0xa6f4dc).fillTriangle(
                px,
                py - 16,
                px + 10,
                py - 13,
                px,
                py - 9,
              );
            }
            if (anim && used && e.spot === "right") {
              fx.lineStyle(2, 0xa2f9ff, 1 - u).strokeCircle(
                r.x,
                r.y - r.displayHeight * 0.65,
                8 + u * 40,
              );
            }
            if (anim && used && e.spot === "left")
              sparkle(fx, l.x + 6, l.y - 22 - 14 * u, 4, 0xffff9a);
          }
          break;
        }
        case "live": {
          const bedY = r.y - r.displayHeight * 0.64;
          if (s.route === "lamp" && !s.done)
            floor
              .fillStyle(0xffdf96, s.sunny ? 0.22 : 0.09)
              .fillTriangle(
                m.x + 8,
                m.y - m.displayHeight * 0.77,
                r.x - 30,
                r.y,
                r.x + 24,
                r.y,
              );
          floor
            .lineStyle(2, 0x596054)
            .lineBetween(l.x + 10, l.y - 2, r.x, r.y - 4);
          cells(g, m.x - 8, m.y - 8, s.battery, 3);
          cells(g, l.x, l.y + 16, s.water, 4);
          drawPlant(g, r.x, bedY, s.growth, s.planted, s.wet, false);
          if (s.route === "battery")
            g.fillStyle(0x182135, 0.67).fillEllipse(
              m.x + m.displayWidth * 0.17,
              m.y - m.displayHeight * 0.8,
              m.displayWidth * 0.42,
              8,
            );
          if (anim && used && e.spot === "middle") {
            const end =
              s.route === "lamp"
                ? { x: r.x, y: bedY }
                : { x: m.x - 8, y: m.y - 8 };
            sparkle(
              fx,
              Phaser.Math.Linear(m.x + 7, end.x, u),
              Phaser.Math.Linear(m.y - m.displayHeight * 0.76, end.y, u),
              4,
              0xffe98a,
            );
          }
          if (
            anim &&
            used &&
            e.spot === "right" &&
            e.before.id === "live" &&
            (!e.before.planted || s.growth > e.before.growth || s.done)
          ) {
            for (let j = 0; j < 4; j++)
              sparkle(
                fx,
                r.x + (j - 1.5) * 11,
                bedY - 5 - u * (18 + j * 2),
                2,
                0xffef93,
              );
          }
          if (anim && used && e.spot === "left")
            for (let j = 0; j < 4; j++) {
              const t = clamp(u * 1.45 - j * 0.12, 0, 1);
              fx.fillStyle(0x58dbff).fillCircle(
                Phaser.Math.Linear(l.x, r.x, t),
                Phaser.Math.Linear(l.y - 19, bedY, t) -
                  Math.sin(t * Math.PI) * 34,
                2.5,
              );
            }
          // One crate of lettuce for each salad picked.
          for (let j = 0; j < s.food; j++) {
            g.fillStyle(0xe9ad59).fillRoundedRect(
              r.x + 15 + j * 20,
              r.y - 20,
              17,
              13,
              2,
            );
            g.fillStyle(0x89cd56).fillEllipse(
              r.x + 23 + j * 20,
              r.y - 20,
              19,
              9,
            );
          }
          break;
        }
        case "explore": {
          if (anim && e.before.id === "explore" && e.before.away !== s.away) {
            const last = this.anchor(1, e.before);
            const travel = s.away ? u : Math.min(1, u / 0.72);
            m.x = Phaser.Math.Linear(last.x, m.x, approach(travel));
            m.y = Phaser.Math.Linear(last.y, m.y, travel);
            ride = { x: m.x, y: m.y - m.displayHeight * 0.46 };
            m.setFlipX(!s.away);
            floor
              .lineStyle(2, 0xa16b64, 0.8)
              .lineBetween(last.x, last.y - 1, m.x, m.y - 1);
          } else m.setFlipX(s.done);
          this.props[1].shadow.setX(m.x);
          r.setScale(r.scaleX * (1 - s.samples * 0.18));
          for (let j = 0; j < s.samples; j++) {
            g.fillStyle(0x624576).fillCircle(m.x - 15 + j * 6, m.y - 16, 4);
            g.fillStyle(0xd5a6ff).fillCircle(m.x - 16 + j * 6, m.y - 17, 2);
          }
          if (anim && used && e.spot === "right") {
            const x = Phaser.Math.Linear(r.x, m.x - 12, u),
              y =
                Phaser.Math.Linear(r.y - 18, m.y - 15, u) -
                Math.sin(Math.PI * u) * 23;
            fx.fillStyle(0xcf9aff).fillTriangle(
              x - 5,
              y + 1,
              x + 5,
              y + 1,
              x + 1,
              y - 7,
            );
            if (s.camera && u < 0.55)
              sparkle(fx, m.x + 12, m.y - m.displayHeight * 0.75, 5, 0xfff3ca);
          }
          // Suit air rides above the astronaut while outside.
          if (s.away && !s.done) {
            cells(g, this.pos.x, this.pos.y - 62 - this.z, s.air, 6);
            if (
              s.air <= 2 &&
              (reduced || Math.floor(this.clock / 350) % 2 === 0)
            )
              sparkle(
                fx,
                this.pos.x + 30,
                this.pos.y - 58 - this.z,
                4,
                0xff8a5c,
              );
          }
          if (s.done) {
            g.lineStyle(2, 0x88f2d3).strokeEllipse(
              l.x,
              l.y - l.displayHeight * 0.4,
              17,
              20,
            );
            const stepInside = anim ? clamp((u - 0.72) / 0.28, 0, 1) : 1;
            if (stepInside > 0) {
              ride = {
                x: Phaser.Math.Linear(m.x, l.x, stepInside),
                y: Phaser.Math.Linear(
                  m.y - 9,
                  l.y - l.displayHeight * 0.22,
                  stepInside,
                ),
              };
              passengerHeight = Phaser.Math.Linear(28, 17, stepInside);
            }
          }
          break;
        }
      }
      if (anim && used && !reduced && s.done && id !== "go") {
        for (let j = 0; j < 7; j++) {
          const a = (j / 7) * Math.PI * 2;
          sparkle(
            fx,
            this.pos.x + Math.cos(a) * (8 + u * 27),
            this.pos.y - 20 + Math.sin(a) * (8 + u * 27),
            2,
            0xffed9c,
          );
        }
      }
      if (anim && !used) {
        const a = at(spots.indexOf(e.spot));
        fx.lineStyle(2, 0xffe6a4, 1 - u).strokeEllipse(
          a.x,
          a.y,
          37 + u * 15,
          11,
        );
      }
      const b = this.photoPoint();
      this.buddy
        .setPosition(
          b.x,
          b.y + (reduced ? 0 : Math.sin(this.clock / 560) * 1.5),
        )
        .setDepth(b.y);
      this.photoTag.setPosition(b.x, b.y + 2).setVisible(false);
      this.buddy.setVisible(false);
      // A bouncing button hint floats over the thing the A button would use.
      const hint = this.target || this.busy() ? null : nearest;
      if (hint) {
        const top =
          hint === "photo"
            ? { x: b.x, y: b.y - 30 }
            : {
                x: at(spots.indexOf(hint)).x,
                y:
                  at(spots.indexOf(hint)).y -
                  this.props[spots.indexOf(hint)].image.displayHeight -
                  4,
              };
        const word = input.devices().last === "keys" ? "SPACE" : "A";
        if (this.prompt.text !== word) this.prompt.setText(word);
        this.prompt.setPosition(
          clamp(top.x, 24, width - 24),
          Math.max(16, top.y) -
            (reduced ? 0 : Math.abs(Math.sin(this.clock / 260)) * 4),
        );
      }
      this.prompt.setVisible(!!hint);
      const alt = Math.floor(this.stride / 130) % 2 === 0;
      const pose =
        this.face === "side"
          ? alt
            ? "side-a"
            : "side-b"
          : this.face === "back"
            ? "back"
            : moving
              ? alt
                ? "walk-a"
                : "walk-b"
              : "front";
      const texture = ride ? "front" : pose;
      if (this.actor.texture.key !== texture) this.actor.setTexture(texture);
      this.actor.setFlipX(!ride && this.face === "side" && this.left);
      const charHeight = ride ? passengerHeight : 45;
      this.actor.setDisplaySize(
        (charHeight * this.actor.width) / this.actor.height,
        charHeight,
      );
      const x = ride?.x ?? this.pos.x,
        y = ride?.y ?? this.pos.y;
      this.actor
        .setPosition(
          x,
          y -
            (moving && !reduced && alt ? 1 : 0) -
            this.z -
            (this.cheer > 0 ? Math.abs(Math.sin(this.cheer / 150)) * 8 : 0),
        )
        .setDepth(ride ? 340 : y + 0.5)
        .setVisible(!onboard);
      this.shadow
        .setPosition(x, this.pos.y)
        .setScale(1 / (1 + this.z / 30))
        .setVisible(!onboard && !ride);
      if (this.target) {
        const a = this.foot(this.target);
        floor.lineStyle(2, 0xffed9c, 0.9).strokeEllipse(a.x, a.y, 13, 5);
      }
    }
  }
  const room = new Room();
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: host,
    backgroundColor: "#182537",
    scene: room,
    width,
    height,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { pixelArt: true, roundPixels: true },
    audio: { noAudio: true },
    // Taps on dialogs and buttons outside the canvas must never reach the scene.
    input: { windowEvents: false },
    fps: { target: 45 },
    banner: false,
  });
  const observer = new ResizeObserver(() => {
    const next = fitWidth();
    if (next === width) return;
    const fraction = room.pos.x / width;
    width = next;
    room.pos.x = fraction * width;
    game.scale.setGameSize(width, height);
    room.arrange();
    if (room.started) room.paint(false);
  });
  observer.observe(host);
  return {
    travel: (t) => room.visit(t),
    jump: () => room.jump(),
    interact: () => room.started && room.interact(),
    setMotion: (r, p) => {
      reduced = r;
      paused = p;
    },
    reset: () => room.reset(),
    destroy: () => {
      mounted = false;
      observer.disconnect();
      game.destroy(true);
    },
  };
}
