// The player's rewards: three stars per mission, badges and an astronaut rank.
// Everything stays on this device. There are no streaks, timers or rankings.
import { expert, limits, type Run } from "./adventure";
import { cards } from "../data/cards";
import { missions, type MissionId } from "./missions";

export const stages = [...missions.map((m) => m.id), "outpost"] as const;
export type StageId = MissionId | "outpost";
export type Stars = [boolean, boolean, boolean];
export const starNames: Record<"room" | "outpost", [string, string, string]> = {
  room: ["Mission done", "Expert goal", "Quiz solved"],
  outpost: ["Crew safe for 6 days", "All 3 hearts kept", "4 science points"],
};

export const badges = [
  { id: "power-packer", name: "Power Packer", how: "Launch with the battery" },
  { id: "shutterbug", name: "Shutterbug", how: "Launch with the camera" },
  {
    id: "night-keeper",
    name: "Night Keeper",
    how: "Keep the fan on for both Moon nights, first try",
  },
  { id: "ice-hunter", name: "Ice Hunter", how: "Scan two dark craters" },
  { id: "space-chef", name: "Space Chef", how: "Grow two space salads" },
  {
    id: "steady-air",
    name: "Steady Air",
    how: "Grow both salads and never let the fan rest",
  },
  {
    id: "safe-sound",
    name: "Safe & Sound",
    how: "Drive home with rocks and no rescue",
  },
  { id: "rock-hound", name: "Rock Hound", how: "Bring three rocks home" },
  { id: "moon-jumper", name: "Moon Jumper", how: "Jump in Moon gravity" },
  {
    id: "fact-finder",
    name: "Fact Finder",
    how: "Collect every NASA fact card",
  },
  {
    id: "mission-trainer",
    name: "Mission Trainer",
    how: "Finish Go, Land, Live and Explore",
  },
  {
    id: "base-commander",
    name: "Base Commander",
    how: "Keep the outpost crew safe for 6 days",
  },
] as const;
export type BadgeId = (typeof badges)[number]["id"];

export const ranks = [
  { stars: 0, name: "Space Cadet" },
  { stars: 3, name: "Rocket Rookie" },
  { stars: 6, name: "Moon Pilot" },
  { stars: 9, name: "Lunar Engineer" },
  { stars: 12, name: "Star Explorer" },
  { stars: 15, name: "Mission Commander" },
] as const;

export type Profile = {
  version: 1;
  stars: Record<StageId, Stars>;
  badges: BadgeId[];
  /** Ids of the NASA fact cards found so far. */
  cards: string[];
};
export const maxStars = stages.length * 3;
export function emptyProfile(): Profile {
  return {
    version: 1,
    stars: Object.fromEntries(
      stages.map((id) => [id, [false, false, false]]),
    ) as Record<StageId, Stars>,
    badges: [],
    cards: [],
  };
}
export const countStars = (stars: Stars) => stars.filter(Boolean).length;
export const totalStars = (p: Profile) =>
  stages.reduce((sum, id) => sum + countStars(p.stars[id]), 0);
export function rankOf(p: Profile) {
  const total = totalStars(p);
  const index = ranks.findLastIndex((r) => total >= r.stars);
  return { ...ranks[index], index, next: ranks[index + 1] ?? null, total };
}
/** The first stage in journey order that is not finished yet. */
export const nextStage = (p: Profile): StageId =>
  stages.find((id) => !p.stars[id][0]) ?? "outpost";

export function decodeProfile(raw: string | null): Profile {
  const profile = emptyProfile();
  try {
    const saved = JSON.parse(raw ?? "null");
    if (saved?.version !== 1) return profile;
    for (const id of stages)
      for (let i = 0; i < 3; i++)
        profile.stars[id][i] = saved.stars?.[id]?.[i] === true;
    if (Array.isArray(saved.badges))
      profile.badges = badges
        .map((b) => b.id)
        .filter((id) => saved.badges.includes(id));
    if (Array.isArray(saved.cards))
      profile.cards = cards
        .map((c) => c.id)
        .filter((id) => saved.cards.includes(id));
  } catch {
    /* An unreadable save starts a fresh profile. */
  }
  return profile;
}

/** Badges a finished run has earned. Different strategies earn different badges. */
export function runBadges(run: Run): BadgeId[] {
  if (!run.done) return [];
  switch (run.id) {
    case "go":
      return run.kit === "battery"
        ? ["power-packer"]
        : run.kit === "camera"
          ? ["shutterbug"]
          : [];
    case "land":
      return [
        ...(run.stalled ? [] : (["night-keeper"] as const)),
        ...(run.maps >= 2 ? (["ice-hunter"] as const) : []),
      ];
    case "live":
      return run.rested ? ["space-chef"] : ["space-chef", "steady-air"];
    case "explore":
      return run.rescued
        ? []
        : run.samples >= limits.rocks
          ? ["safe-sound", "rock-hound"]
          : ["safe-sound"];
  }
}
/** The stars a run has earned: finishing, and the harder expert goal. */
export const runStars = (run: Run): Partial<Stars> => [run.done, expert(run)];

export type Award = {
  stage: StageId;
  stars?: Partial<Stars>;
  badges?: BadgeId[];
  card?: string;
};
/** Adds rewards. Stars, badges and cards are never taken away. */
export function award(p: Profile, a: Award) {
  const stars = p.stars[a.stage].map(
    (had, i) => had || a.stars?.[i] === true,
  ) as Stars;
  const next: Profile = {
    ...p,
    stars: { ...p.stars, [a.stage]: stars },
    badges: [...p.badges],
    cards: [...p.cards],
  };
  const add = (id: BadgeId) => {
    if (!next.badges.includes(id)) next.badges.push(id);
  };
  if (
    a.card &&
    cards.some((c) => c.id === a.card) &&
    !next.cards.includes(a.card)
  )
    next.cards.push(a.card);
  a.badges?.forEach(add);
  if (next.cards.includes("moon-jump")) add("moon-jumper");
  if (cards.every((c) => next.cards.includes(c.id))) add("fact-finder");
  if (missions.every((m) => next.stars[m.id][0])) add("mission-trainer");
  if (next.stars.outpost[0]) add("base-commander");
  const fresh = next.badges.filter((id) => !p.badges.includes(id));
  const changed =
    fresh.length > 0 ||
    next.cards.length !== p.cards.length ||
    stars.some((s, i) => s !== p.stars[a.stage][i]);
  return { profile: changed ? next : p, fresh, changed };
}

export const profileKey = "MoonSprout.profile.v1";
function makeProfileStore() {
  const empty = emptyProfile();
  let profile = empty,
    loaded = false;
  const listeners = new Set<() => void>();
  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      profile = decodeProfile(window.localStorage.getItem(profileKey));
    } catch {
      /* Session-only rewards. */
    }
  };
  return {
    get() {
      load();
      return profile;
    },
    empty: () => empty,
    subscribe(f: () => void) {
      listeners.add(f);
      return () => {
        listeners.delete(f);
      };
    },
    award(a: Award) {
      load();
      const result = award(profile, a);
      if (!result.changed) return result;
      profile = result.profile;
      try {
        window.localStorage.setItem(profileKey, JSON.stringify(profile));
      } catch {
        /* Play can continue in memory. */
      }
      listeners.forEach((f) => f());
      return result;
    },
    reset() {
      loaded = true;
      profile = emptyProfile();
      try {
        window.localStorage.removeItem(profileKey);
      } catch {
        /* Nothing was stored. */
      }
      listeners.forEach((f) => f());
    },
  };
}
export const profileStore = makeProfileStore();

export type Quiz = {
  ask: string;
  options: [string, string, string];
  answer: number;
  why: string;
};
export const quizzes: Record<MissionId, Quiz> = {
  go: {
    ask: "Why couldn’t we pack air, a battery AND a camera?",
    options: [
      "Cameras don’t work in space",
      "The ship only had two cargo spaces",
      "Batteries are too shiny",
    ],
    answer: 1,
    why: "Right! Room on a rocket is small, so crews choose what matters most.",
  },
  land: {
    ask: "What kept the air fan spinning through the Moon night?",
    options: [
      "Power saved in the battery",
      "Wind on the Moon",
      "The radio dish",
    ],
    answer: 0,
    why: "Right! Solar panels get no light at night, so we save power first.",
  },
  live: {
    ask: "Why did you send some sunlight to the battery?",
    options: [
      "Batteries taste good",
      "Plants grow in the dark",
      "So the air fan could run in the dark shift",
    ],
    answer: 2,
    why: "Right! Air comes first. Then light, water and time grow the food.",
  },
  explore: {
    ask: "Why can’t an astronaut stay outside all day?",
    options: [
      "Moon rocks get sleepy",
      "Suit air and rover power run out",
      "The Moon is too bouncy",
    ],
    answer: 1,
    why: "Right! Every job outside uses air and power, so crews plan the trip home.",
  },
};
