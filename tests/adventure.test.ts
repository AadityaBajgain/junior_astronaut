import { expect, it } from "vitest";
import { act, begin, type Spot } from "../game/adventure";
import { decodeSession } from "../game/journal";
import { classifyReport, historicalEvent } from "../game/space-weather";
import archive from "../data/sep-archive.json";

const route = (id: Parameters<typeof begin>[0], moves: Spot[]) =>
  moves.reduce(act, begin(id));
it("launches with air and the chosen item, within two spaces", () => {
  expect(route("go", ["right"])).toMatchObject({ done: false, steps: 0 });
  expect(
    route("go", ["left", "middle", "middle", "right", "right"]),
  ).toMatchObject({ done: true, kit: "camera", air: true, steps: 4 });
  expect(begin("land", "battery")).toMatchObject({ battery: 1 });
  expect(begin("explore", "camera")).toMatchObject({ camera: true });
});
it("spends each spare solar spark once and draws stored air power after dark", () => {
  const ready = route("land", ["right", "right", "left"]);
  expect(ready).toMatchObject({ phase: "day", maps: 1, sun: 0, battery: 1 });
  expect(act(ready, "right")).toMatchObject({ maps: 1, steps: ready.steps });
  const night = act(ready, "middle");
  expect(night).toMatchObject({ phase: "night", battery: 0, fan: true });
  expect(act(night, "middle").done).toBe(true);
});
it("supports a different landing and recovers an unpowered night", () => {
  expect(route("land", ["left", "right", "middle", "middle"])).toMatchObject({
    done: true,
    maps: 1,
  });
  expect(route("land", ["right", "right", "right", "middle"])).toMatchObject({
    fan: false,
    phase: "night",
  });
  expect(
    route("land", [
      "right",
      "right",
      "right",
      "middle",
      "middle",
      "left",
      "middle",
      "middle",
    ]),
  ).toMatchObject({ done: true, fan: true });
});
it("requires planting, water, lamp power and separate shifts before harvesting once", () => {
  expect(route("live", ["left", "right", "right"])).toMatchObject({
    growth: 0,
    food: 0,
  });
  const stored = route("live", ["right", "left", "middle", "right"]);
  expect(stored).toMatchObject({
    wet: true,
    growth: 0,
    battery: 2,
    route: "battery",
  });
  const harvest = route("live", [
    "right",
    "left",
    "right",
    "left",
    "right",
    "right",
    "right",
    "right",
  ]);
  expect(harvest).toMatchObject({ done: true, food: 1, growth: 2 });
  expect(act(harvest, "right")).toBe(harvest);
});
it("keeps return power and rewards early shelter or a second rock", () => {
  const first = route("explore", ["middle", "right", "left"]);
  expect(first).toMatchObject({
    samples: 1,
    power: 1,
    away: false,
    done: true,
  });
  const late = route("explore", ["middle", "right", "right", "right", "left"]);
  expect(late).toMatchObject({ samples: 2, power: 0, done: true });
});
it("replays only validated saves; time never advances a room", () => {
  const save = JSON.stringify({
    version: 1,
    cargo: "battery",
    actions: ["right", "left"],
  });
  expect(decodeSession("land", save).run).toMatchObject({
    phase: "day",
    sun: 1,
    battery: 2,
  });
  for (const raw of [
    "{",
    "[]",
    JSON.stringify({ version: 1, cargo: "camera", actions: ["fake"] }),
  ])
    expect(decodeSession("live", raw).run).toEqual(begin("live"));
});
it("labels valid observations, empty responses, corrupt data, old records and modeled events", () => {
  const date = new Date("2024-05-12T00:00Z");
  expect(classifyReport([archive], date)).toMatchObject({
    kind: "catalog",
    event: historicalEvent,
  });
  expect(classifyReport([], date).kind).toBe("empty");
  for (const bad of [
    null,
    [{}],
    [{ ...archive, eventTime: "broken" }],
    [{ ...archive, link: "https://example.org" }],
    [{ ...archive, instruments: [{ displayName: "MODEL: prediction" }] }],
  ])
    expect(classifyReport(bad, date)).toMatchObject({
      kind: "archive",
      event: historicalEvent,
    });
  expect(classifyReport([archive], new Date("2026-11-14T00:00Z")).kind).toBe(
    "archive",
  );
});
