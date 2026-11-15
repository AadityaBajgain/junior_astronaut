import { expect, it } from "vitest";
import { act, begin, expert, milestone, type Spot } from "../game/adventure";
import { cardById, cards } from "../data/cards";
import { decodeSession } from "../game/journal";
import {
  classifyProtons,
  classifyReport,
  historicalEvent,
  stormScale,
} from "../game/space-weather";
import archive from "../data/sep-archive.json";

const route = (id: Parameters<typeof begin>[0], moves: Spot[]) =>
  moves.reduce(act, begin(id));
const liveNoRest: Spot[] = [
  "right",
  "left",
  "right",
  "right",
  "middle",
  "right",
  "left",
  "middle",
  "right",
  "right",
  "middle",
  "right",
  "right",
  "left",
  "middle",
  "right",
  "left",
  "right",
  "right",
];
it("go: launch needs air, a checked suit and a full tank", () => {
  expect(route("go", ["right"])).toMatchObject({ fuel: 1, steps: 1 });
  const noSuit = route("go", ["left", "right", "right", "right", "right"]);
  expect(noSuit).toMatchObject({ done: false, fuel: 3, steps: 4 });
  expect(noSuit.message).toMatch(/suit/);
  const launched = route("go", [
    "left",
    "left",
    "middle",
    "middle",
    "right",
    "right",
    "right",
    "right",
  ]);
  expect(launched).toMatchObject({
    done: true,
    kit: "camera",
    suit: true,
    steps: 8,
  });
  expect(expert(launched)).toBe(true);
  expect(
    expert(route("go", ["left", "left", "right", "right", "right", "right"])),
  ).toBe(false);
  expect(begin("land", "battery")).toMatchObject({ battery: 1 });
  expect(begin("explore", "camera")).toMatchObject({ camera: true });
});
it("land: two nights, each spare spark spent once", () => {
  const ready = route("land", ["right", "right", "left"]);
  expect(ready).toMatchObject({ phase: "day", maps: 1, sun: 0, battery: 1 });
  expect(act(ready, "right")).toMatchObject({ maps: 1, steps: ready.steps });
  const morning = route("land", ["right", "right", "left", "middle", "middle"]);
  expect(morning).toMatchObject({
    phase: "day",
    nights: 1,
    sun: 2,
    done: false,
  });
  const done = [..."lrmm"].reduce(
    (run, c) => act(run, c === "l" ? "left" : c === "r" ? "right" : "middle"),
    morning,
  );
  expect(done).toMatchObject({
    done: true,
    nights: 2,
    maps: 2,
    stalled: false,
  });
  expect(expert(done)).toBe(true);
  // A packed battery makes the flat pad work for two scans as well.
  const flat = (
    ["left", "right", "middle", "middle", "right", "middle", "middle"] as Spot[]
  ).reduce(act, begin("land", "battery"));
  expect(flat).toMatchObject({ done: true, maps: 2, stalled: false });
});
it("land: an unpowered night pauses the fan and is recoverable", () => {
  const stalled = route("land", ["right", "right", "right", "middle"]);
  expect(stalled).toMatchObject({ fan: false, phase: "night", stalled: true });
  const done = route("land", [
    "right",
    "right",
    "right",
    "middle",
    "middle",
    "left",
    "middle",
    "middle",
    "left",
    "middle",
    "middle",
  ]);
  expect(done).toMatchObject({ done: true, nights: 2, stalled: true });
  expect(expert(done)).toBe(false);
});
it("live: two harvests need water, light, time and saved power", () => {
  expect(route("live", ["left", "right", "right"])).toMatchObject({
    growth: 0,
    food: 0,
  });
  expect(route("live", ["right", "left", "middle", "right"])).toMatchObject({
    wet: true,
    growth: 0,
    battery: 3,
    route: "battery",
  });
  const first = route("live", [
    "right",
    "left",
    "right",
    "left",
    "right",
    "right",
    "right",
  ]);
  expect(first).toMatchObject({
    done: false,
    food: 1,
    planted: false,
    growth: 0,
    water: 2,
  });
  // Rushing the second crop into a dark shift with an empty battery rests the fan.
  const rushed = (["right", "left", "right"] as Spot[]).reduce(act, first);
  expect(rushed).toMatchObject({ rested: true, growth: 0 });
  const careful = route("live", liveNoRest);
  expect(careful).toMatchObject({
    done: true,
    food: 2,
    water: 0,
    rested: false,
  });
  expect(expert(careful)).toBe(true);
  expect(act(careful, "right")).toBe(careful);
});
it("explore: every job outside costs suit air; charging trades air for power", () => {
  const three = route("explore", [
    "middle",
    "right",
    "right",
    "middle",
    "right",
    "left",
  ]);
  expect(three).toMatchObject({
    done: true,
    samples: 3,
    power: 1,
    air: 2,
    rescued: false,
  });
  expect(expert(three)).toBe(true);
  const lastSpark = route("explore", ["middle", "right", "right", "right"]);
  expect(lastSpark).toMatchObject({ samples: 2, power: 1, steps: 3 });
  expect(route("explore", ["middle", "left"]).done).toBe(false);
  const early = route("explore", ["middle", "right", "left"]);
  expect(early).toMatchObject({ done: true, samples: 1, rescued: false });
  expect(expert(early)).toBe(false);
  // Running out of suit air ends in a safe automatic ride home with one rock.
  const rescued = route("explore", [
    "middle",
    "right",
    "middle",
    "right",
    "middle",
    "right",
    "middle",
  ]);
  expect(rescued).toMatchObject({
    done: true,
    rescued: true,
    samples: 1,
    away: false,
  });
});
it("unlocks a fact card at the right moment, once", () => {
  const seen: string[] = [];
  for (const [id, moves] of [
    ["go", ["left", "left", "middle", "right", "right", "right", "right"]],
    [
      "land",
      [
        "right",
        "right",
        "left",
        "middle",
        "middle",
        "left",
        "right",
        "middle",
        "middle",
      ],
    ],
    ["live", liveNoRest],
    ["explore", ["middle", "right", "right", "middle", "right", "left"]],
  ] as [Parameters<typeof begin>[0], Spot[]][]) {
    let run = begin(id);
    for (const move of moves) {
      const next = act(run, move);
      const card = milestone(run, next);
      if (card) seen.push(card);
      run = next;
    }
  }
  expect(seen).toEqual([
    "go-air",
    "go-fuel",
    "go-launch",
    "land-touchdown",
    "land-scan",
    "land-night",
    "live-plant",
    "live-sprout",
    "live-harvest",
    "explore-drive",
    "explore-rock",
    "explore-home",
  ]);
  for (const id of seen) expect(cardById(id)).toBeTruthy();
  const stuck = begin("go");
  expect(milestone(stuck, act(act(stuck, "left"), "left"))).toBe("go-air");
  expect(milestone(stuck, stuck)).toBeNull();
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

it("reads only a fresh, valid live proton reading and scales it like NOAA", () => {
  const now = new Date("2026-11-15T11:00:00Z");
  const row = (time_tag: string, flux: unknown, energy = ">=10 MeV") => ({
    time_tag,
    satellite: 18,
    flux,
    energy,
  });
  expect(
    classifyProtons(
      [
        row("2026-11-15T10:50:00Z", 0.3),
        row("2026-11-15T10:55:00Z", 0.25),
        row("2026-11-15T10:55:00Z", 99, ">=100 MeV"),
        row("2026-11-15T10:58:00Z", "12"),
        row("2026-11-15T10:59:00Z", -1),
      ],
      now,
    ),
  ).toEqual({
    flux: 0.25,
    time: "2026-11-15T10:55:00.000Z",
    satellite: "GOES-18",
    scale: 0,
  });
  // Stale, future, malformed and missing feeds are never shown as live.
  expect(classifyProtons([row("2026-11-15T06:00:00Z", 5)], now)).toBeNull();
  expect(classifyProtons([row("2026-11-16T06:00:00Z", 5)], now)).toBeNull();
  for (const bad of [null, {}, "x", [null, 3, {}]])
    expect(classifyProtons(bad, now)).toBeNull();
  expect([0.2, 9.9, 10, 99, 100, 5000, 1e7].map(stormScale)).toEqual([
    0, 0, 1, 1, 2, 3, 5,
  ]);
});

it("every fact card has a photo, a credit and an official source, and nothing about Mars", () => {
  expect(cards.length).toBe(13);
  for (const card of cards) {
    expect(card.image).toMatch(/^\/art\/(nasa\/|nasa-)/);
    expect(card.credit).toMatch(/NASA/);
    expect(card.source).toMatch(/^https:\/\/([a-z.]+\.)?nasa\.gov\//);
    expect(card.kid + card.title + card.caption).not.toMatch(/\bMars\b/);
  }
});
