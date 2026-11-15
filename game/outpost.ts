// Outpost Commander: six player-advanced days at a small Moon base.
// The Sun storms replay real NASA DONKI records from May 8–13, 2024. Sparks,
// hearts, food and sunlight amounts are game units, not NASA engineering values.
import week from "../data/storm-week.json";

const dates = [
  "2024-05-08",
  "2024-05-09",
  "2024-05-10",
  "2024-05-11",
  "2024-05-12",
  "2024-05-13",
];
// Game sunlight: on a low-Sun day a crater rim shades the panels.
const sunlight = [4, 4, 3, 2, 4, 3];
const isModel = (instrument: string) => /^MODEL/i.test(instrument);
/** A day is a storm day only when an instrument, not a model, recorded particles. */
export const sols = dates.map((date, i) => {
  const records = week.events.filter((e) => e.time.startsWith(date));
  const measured = records.filter((e) => !isModel(e.instrument));
  return {
    date,
    sun: sunlight[i],
    storm: measured.length > 0,
    modelOnly: measured.length === 0 && records.length > 0,
    record: measured[0] ?? null,
  };
});
export const systems = [
  {
    id: "air",
    name: "Air fan",
    max: 1,
    art: "cabin",
    does: "Life support. The crew breathes easy.",
  },
  {
    id: "farm",
    name: "Greenhouse",
    max: 2,
    art: "bed",
    does: "Each spark grows 1 food. The crew eats 1 food every day.",
  },
  {
    id: "water",
    name: "Water recycler",
    max: 1,
    art: "tank",
    does: "One spark cleans 2 drinks of water. The crew drinks 1 every day.",
  },
  {
    id: "shield",
    name: "Storm shelter",
    max: 1,
    art: "shelter",
    does: "Protects the crew when a Sun storm is coming.",
  },
  {
    id: "lab",
    name: "Science lab",
    max: 3,
    art: "dish",
    does: "Each spark earns 1 science point.",
  },
] as const;
export type SystemId = (typeof systems)[number]["id"];
export type Plan = Record<SystemId, number>;
export const emptyPlan: Plan = { air: 0, farm: 0, water: 0, shield: 0, lab: 0 };

export const limits = { battery: 3, food: 4, water: 4, hearts: 3, science: 4 };

export type Outpost = {
  sol: number; // 1-based
  battery: number;
  packs: number;
  food: number;
  water: number;
  hearts: number;
  science: number;
  status: "play" | "won" | "lost";
  report: string[];
};
export const beginOutpost = (): Outpost => ({
  sol: 1,
  battery: 1,
  packs: 2,
  food: 2,
  water: 2,
  hearts: limits.hearts,
  science: 0,
  status: "play",
  report: [],
});
export const today = (s: Outpost) => sols[s.sol - 1];
/** Sparks to spend this sol: today's sunlight plus what the battery saved. */
export const sparks = (s: Outpost) => today(s).sun + s.battery;
export const spent = (plan: Plan) =>
  plan.air + plan.farm + plan.water + plan.shield + plan.lab;

/** Changes one system by one spark if the budget and the system allow it. */
export function adjust(
  s: Outpost,
  plan: Plan,
  id: SystemId,
  delta: 1 | -1,
): Plan {
  const max = systems.find((x) => x.id === id)!.max;
  const value = plan[id] + delta;
  if (value < 0 || value > max) return plan;
  if (delta > 0 && spent(plan) >= sparks(s)) return plan;
  return { ...plan, [id]: value };
}

/** What will happen if the sol ends with this plan. Shown before the player commits. */
export function preview(s: Outpost, plan: Plan) {
  const left = sparks(s) - spent(plan);
  const food = Math.min(limits.food, s.food + plan.farm);
  return {
    air: plan.air ? "on" : s.packs > 0 ? "pack" : "out",
    shield: today(s).storm
      ? plan.shield
        ? "safe"
        : "open"
      : plan.shield
        ? "spare"
        : "calm",
    fed: food > 0,
    watered: Math.min(limits.water, s.water + plan.water * 2) > 0,
    saved: Math.min(limits.battery, left),
    wasted: Math.max(0, left - limits.battery),
  } as const;
}

export function endSol(s: Outpost, plan: Plan): Outpost {
  if (s.status !== "play" || spent(plan) > sparks(s)) return s;
  for (const sys of systems)
    if (plan[sys.id] < 0 || plan[sys.id] > sys.max) return s;
  const p = preview(s, plan);
  const report: string[] = [];
  let { packs, hearts } = s;
  if (p.air === "on") report.push("The air fan ran all day.");
  else if (p.air === "pack") {
    packs--;
    report.push("The fan rested. The crew used 1 spare air pack.");
  } else {
    hearts--;
    report.push("No fan and no air packs. The crew felt tired. −1 heart.");
  }
  if (p.shield === "safe")
    report.push("Sun storm! The crew waited safely in the shelter.");
  else if (p.shield === "open") {
    hearts--;
    report.push("Sun storm! The shelter had no power. −1 heart.");
  } else if (p.shield === "spare")
    report.push("No storm came. The shelter spark was not needed.");
  let food = Math.min(limits.food, s.food + plan.farm);
  if (plan.farm) report.push("The greenhouse grew " + plan.farm + " food.");
  if (food > 0) {
    food--;
    report.push("The crew ate 1 food.");
  } else {
    hearts--;
    report.push("The pantry was empty. The crew was hungry. −1 heart.");
  }
  let water = Math.min(limits.water, s.water + plan.water * 2);
  if (plan.water) report.push("The recycler cleaned 2 drinks of water.");
  if (water > 0) water--;
  else {
    hearts--;
    report.push("The water tank was empty. The crew was thirsty. −1 heart.");
  }
  if (plan.lab)
    report.push("The lab earned " + plan.lab + " science. Great work!");
  if (p.saved) report.push("The battery saved " + p.saved + " for later.");
  if (p.wasted)
    report.push(
      "The battery was full. " + p.wasted + " sunshine slipped away.",
    );
  const science = s.science + plan.lab;
  const status =
    hearts <= 0 ? "lost" : s.sol >= sols.length ? "won" : ("play" as const);
  return {
    sol: status === "play" ? s.sol + 1 : s.sol,
    battery: p.saved,
    packs,
    food,
    water,
    hearts: Math.max(0, hearts),
    science,
    status,
    report,
  };
}
export function outpostStars(s: Outpost): [boolean, boolean, boolean] {
  const won = s.status === "won";
  return [
    won,
    won && s.hearts === limits.hearts,
    won && s.science >= limits.science,
  ];
}
