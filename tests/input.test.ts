import { expect, it } from "vitest";
import { keyToButton, parseSerialLine, readPad } from "../game/input";

it("maps arrows, WASD and action keys to the same buttons", () => {
  expect(["ArrowUp", "w", "W"].map(keyToButton)).toEqual(["up", "up", "up"]);
  expect(["a", "ArrowLeft", "d", "s"].map(keyToButton)).toEqual([
    "left",
    "left",
    "right",
    "down",
  ]);
  expect([" ", "Enter", "Escape", "p", "x"].map(keyToButton)).toEqual([
    "a",
    "a",
    "b",
    "start",
    "x",
  ]);
  expect(keyToButton("z")).toBeNull();
});
it("reads ESP32 serial lines and ignores noise", () => {
  expect(parseSerialLine("U1\r")).toEqual([{ btn: "up", down: true }]);
  expect(parseSerialLine(" a0 ")).toEqual([{ btn: "a", down: false }]);
  expect(parseSerialLine("S 1")).toEqual([{ btn: "start", down: true }]);
  expect(parseSerialLine("J 80 -60")).toEqual([
    { btn: "left", down: false },
    { btn: "right", down: true },
    { btn: "up", down: true },
    { btn: "down", down: false },
  ]);
  for (const junk of ["", "hello", "U2", "J 5", "booting ESP32..."])
    expect(parseSerialLine(junk)).toEqual([]);
});
it("reads a gamepad stick, d-pad and face buttons", () => {
  const pad = (pressed: number[], axes: number[]) => ({
    mapping: "standard",
    axes,
    buttons: Array.from({ length: 16 }, (_, i) => ({
      pressed: pressed.includes(i),
    })),
  });
  expect([...readPad(pad([0, 14], [0, 0]))].sort()).toEqual(["a", "left"]);
  expect([...readPad(pad([1, 9], [0.9, -0.8]))].sort()).toEqual([
    "b",
    "right",
    "start",
    "up",
  ]);
  expect(readPad(pad([], [0.2, -0.3])).size).toBe(0);
});

import { lcdLine, lcdText, ledLine } from "../game/device";
it("formats display and light messages for the controller", () => {
  expect(lcdLine("Pump fuel", "Fuel 2/3")).toBe("LCD|Pump fuel|Fuel 2/3");
  expect(lcdLine("Moon greenhouse")).toBe("LCD|Moon greenhouse|");
  // 16 characters, plain ASCII, and no separator inside the text.
  expect(lcdText("A very long level name indeed")).toBe("A very long leve");
  expect(lcdText("It’s −173°C | café")).toBe("It's 173C / cafe");
  expect(ledLine("g", true)).toBe("LED|G|1");
  expect(ledLine("r", false)).toBe("LED|R|0");
});
