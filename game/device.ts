// What the controller shows: a 16x2 LCD and a green and a red LED.
// The game sends short text lines over the same USB serial link the buttons use:
//   LCD|top row|bottom row     both rows, at most 16 plain characters each
//   CLR                        clear the display
//   LED|G|1   LED|R|0          green or red light on or off
// A mirror of the display is kept here so the game can show it on screen and
// tests can read it without hardware.
import { input } from "./input";

export type DeviceView = {
  rows: [string, string];
  green: boolean;
  red: boolean;
};
const width = 16;
/** Plain ASCII, no separator characters, cut to the display width. */
export function lcdText(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/\|/g, "/")
    .trim()
    .slice(0, width);
}
export const lcdLine = (top: string, bottom = "") =>
  "LCD|" + lcdText(top) + "|" + lcdText(bottom);
export const ledLine = (led: "g" | "r", on: boolean) =>
  "LED|" + led.toUpperCase() + "|" + (on ? 1 : 0);

// A little astronaut bounces across the bottom row while the player walks.
const walkFrames = [
  "o/  >     ",
  " \\o  >>   ",
  "  o/  >>> ",
  "   \\o   >>",
].map((f) => "Moving " + f);

function makeDevice() {
  let view: DeviceView = { rows: ["", ""], green: false, red: false };
  let base: [string, string] = ["", ""]; // the screen to return to after walking
  let walk: ReturnType<typeof setInterval> | undefined;
  let frame = 0;
  const timers: Partial<Record<"g" | "r", ReturnType<typeof setTimeout>>> = {};
  const listeners = new Set<() => void>();
  const publish = (next: Partial<DeviceView>) => {
    view = { ...view, ...next };
    listeners.forEach((f) => f());
  };
  function draw(top: string, bottom: string) {
    const rows: [string, string] = [lcdText(top), lcdText(bottom)];
    if (rows[0] === view.rows[0] && rows[1] === view.rows[1]) return;
    publish({ rows });
    input.send(lcdLine(top, bottom));
  }
  function led(which: "g" | "r", on: boolean) {
    clearTimeout(timers[which]);
    const key = which === "g" ? "green" : "red";
    if (view[key] === on) return;
    publish({ [key]: on });
    input.send(ledLine(which, on));
  }
  const api = {
    /** Shows two rows and remembers them as the resting screen. */
    screen(top: string, bottom = "") {
      base = [top, bottom];
      if (!walk) draw(top, bottom);
    },
    /** Green for a finished task, red for a move that did not work. */
    flash(which: "g" | "r", ms = 1500) {
      led(which === "g" ? "r" : "g", false);
      led(which, true);
      timers[which] = setTimeout(() => led(which, false), ms);
    },
    /** Leaves a light on, for example green after a finished mission. */
    hold(which: "g" | "r" | null) {
      led("g", which === "g");
      led("r", which === "r");
    },
    /** Starts or stops the walking animation on the bottom row. */
    moving(on: boolean) {
      if (on === !!walk) return;
      if (on) {
        const tick = () =>
          draw(base[0], walkFrames[frame++ % walkFrames.length]);
        tick();
        walk = setInterval(tick, 260);
      } else {
        clearInterval(walk);
        walk = undefined;
        draw(base[0], base[1]);
      }
    },
    view: () => view,
    subscribe(f: () => void) {
      listeners.add(f);
      return () => {
        listeners.delete(f);
      };
    },
  };
  // A controller that was just plugged in gets the current screen and lights.
  input.onOpen(() => {
    input.send(lcdLine(view.rows[0], view.rows[1]));
    input.send(ledLine("g", view.green));
    input.send(ledLine("r", view.red));
  });
  return api;
}
export const device = makeDevice();
export const blankDevice: DeviceView = {
  rows: ["", ""],
  green: false,
  red: false,
};
