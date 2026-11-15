import { expect, it } from "vitest";
import { act, begin, type Spot } from "../game/adventure";
import {
  award,
  decodeProfile,
  emptyProfile,
  maxStars,
  nextStage,
  quizzes,
  rankOf,
  runBadges,
  totalStars,
} from "../game/profile";
import {
  adjust,
  beginOutpost,
  emptyPlan,
  endSol,
  outpostStars,
  preview,
  sparks,
  type Plan,
} from "../game/outpost";

const route = (id: Parameters<typeof begin>[0], moves: Spot[]) =>
  moves.reduce(act, begin(id));
const plan = (p: Partial<Plan>): Plan => ({ ...emptyPlan, ...p });

it("gives different badges to different strategies", () => {
  expect(runBadges(route("go", ["left", "middle", "right"]))).toEqual([
    "power-packer",
  ]);
  expect(runBadges(route("go", ["left", "middle", "middle", "right"]))).toEqual(
    ["shutterbug"],
  );
  expect(
    runBadges(route("land", ["right", "right", "left", "middle", "middle"])),
  ).toEqual(["night-keeper", "crater-mapper"]);
  // Both sparks on scans: the fan pauses once, so no Night Keeper after the retry.
  expect(
    runBadges(
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
    ),
  ).toEqual([]);
  expect(
    runBadges(
      route("live", [
        "right",
        "left",
        "right",
        "left",
        "right",
        "right",
        "right",
      ]),
    ),
  ).toEqual(["space-chef", "steady-air"]);
  expect(runBadges(route("explore", ["middle", "right", "left"]))).toEqual([
    "safe-sound",
  ]);
  expect(runBadges(route("explore", ["middle", "right"]))).toEqual([]);
});
it("keeps stars forever, ranks up and recovers corrupt saves", () => {
  let p = emptyProfile();
  expect(rankOf(p).name).toBe("Space Cadet");
  expect(nextStage(p)).toBe("go");
  for (const stage of ["go", "land", "live", "explore"] as const)
    p = award(p, { stage, stars: [true, true, true] }).profile;
  expect(p.badges).toContain("mission-trainer");
  expect(totalStars(p)).toBe(12);
  expect(rankOf(p).name).toBe("Star Explorer");
  expect(nextStage(p)).toBe("outpost");
  const again = award(p, { stage: "go", stars: [false, false, false] });
  expect(again.changed).toBe(false);
  expect(again.profile.stars.go).toEqual([true, true, true]);
  expect(decodeProfile(JSON.stringify(p))).toEqual(p);
  for (const raw of [null, "{", '{"version":9}', "[]"])
    expect(decodeProfile(raw)).toEqual(emptyProfile());
  expect(
    decodeProfile('{"version":1,"stars":{"go":[1,true]},"badges":["hax"]}'),
  ).toMatchObject({ stars: { go: [false, true, false] }, badges: [] });
  expect(maxStars).toBe(15);
  for (const q of Object.values(quizzes))
    expect(q.options[q.answer]).toBeTruthy();
});
it("outpost: sparks are spent once and leftovers charge a finite battery", () => {
  const s = beginOutpost();
  expect(sparks(s)).toBe(5);
  let p = emptyPlan;
  for (let i = 0; i < 9; i++) p = adjust(s, p, "lab", 1);
  expect(p.lab).toBe(3); // system limit
  p = adjust(s, adjust(s, adjust(s, p, "air", 1), "farm", 1), "farm", 1);
  expect(p).toEqual(plan({ lab: 3, air: 1, farm: 1 })); // budget limit
  expect(adjust(s, emptyPlan, "air", -1)).toBe(emptyPlan);
  expect(endSol(s, plan({ air: 1, farm: 2, lab: 3 }))).toBe(s); // over budget
  expect(preview(s, emptyPlan)).toMatchObject({ saved: 3, wasted: 2 });
  const next = endSol(s, plan({ air: 1 }));
  expect(next).toMatchObject({ sol: 2, battery: 3, food: 1, hearts: 3 });
});
it("outpost: neglect costs hearts, a careful plan wins three stars", () => {
  // Everything into science: air packs run out, storms and hunger hit.
  let s = beginOutpost();
  while (s.status === "play")
    s = endSol(s, plan({ lab: Math.min(3, sparks(s)) }));
  expect(s.status).toBe("lost");
  expect(outpostStars(s)).toEqual([false, false, false]);
  expect(endSol(s, emptyPlan)).toBe(s);

  const careful: Partial<Plan>[] = [
    { air: 1, farm: 2, lab: 2 },
    { air: 1, shield: 1, farm: 1, lab: 1 },
    { air: 1, lab: 1 },
    { air: 1, shield: 1 },
    { air: 1, farm: 1, lab: 1 },
    { air: 1, shield: 1, lab: 1 },
  ];
  s = careful.reduce((state, p) => endSol(state, plan(p)), beginOutpost());
  expect(s).toMatchObject({ status: "won", hearts: 3, science: 6, sol: 6 });
  expect(outpostStars(s)).toEqual([true, true, true]);

  // A missed storm shelter costs exactly one heart and still finishes.
  const risky = careful.map((p, i) => (i === 1 ? { ...p, shield: 0 } : p));
  s = risky.reduce((state, p) => endSol(state, plan(p)), beginOutpost());
  expect(outpostStars(s)).toEqual([true, false, true]);
});
