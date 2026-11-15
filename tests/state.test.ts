import { describe, expect, it } from "vitest";
import { decode, initial, reduce } from "../game/state";
import records from "../data/science.json";
describe("map saves", () => {
  it("recovers missing, corrupt and unknown-version saves", () => {
    for (const raw of [null, "{", "null", "[]", '{"version":2}'])
      expect(decode(raw, true)).toEqual({
        ...initial,
        prefs: { ...initial.prefs, reducedMotion: true },
      });
  });
  it("restores only known missions and boolean preferences", () => {
    expect(
      decode(
        '{"version":1,"selected":"oops","prefs":{"sound":"true","reducedMotion":true}}',
      ),
    ).toEqual({ ...initial, prefs: { ...initial.prefs, reducedMotion: true } });
    expect(
      decode('{"version":1,"selected":"land","prefs":{"largeText":true}}'),
    ).toEqual({
      ...initial,
      selected: "land",
      prefs: { ...initial.prefs, largeText: true },
    });
  });
  it("keeps selection, motion pause and preferences independent", () => {
    const state = reduce(
      reduce(reduce(initial, { type: "select", id: "explore" }), {
        type: "pause",
      }),
      { type: "preference", key: "largeText", value: true },
    );
    expect(state).toEqual({
      selected: "explore",
      paused: true,
      prefs: { ...initial.prefs, largeText: true },
    });
    expect(initial.selected).toBe("go");
  });
});
it("keeps the reviewed RAD average tied to its place, interval and unit", () => {
  expect(records.measurement).toMatchObject({
    kind: "Archived measurement",
    value: 0.67,
    unit: "mSv/day",
    period: "August 2012 – June 2013",
    place: "Gale Crater, Mars",
  });
  expect(records.image.id).toBe("PIA16238");
});
