import { missions, type MissionId } from "./missions";

export const saveKey = "JuniorAstronaut.map.v1";
export const defaults = {
  sound: false,
  largeText: false,
  reducedMotion: false,
};
export type Preferences = typeof defaults;
export type MapState = {
  selected: MissionId;
  prefs: Preferences;
  paused: boolean;
};
export type MapAction =
  | { type: "select"; id: MissionId }
  | { type: "preference"; key: keyof Preferences; value: boolean }
  | { type: "pause" };
export const initial: MapState = {
  selected: "go",
  prefs: defaults,
  paused: false,
};
export function reduce(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case "select":
      return { ...state, selected: action.id };
    case "preference":
      return {
        ...state,
        prefs: { ...state.prefs, [action.key]: action.value },
      };
    case "pause":
      return { ...state, paused: !state.paused };
  }
}
export function decode(raw: string | null, prefersReduced = false): MapState {
  const fallback = {
    ...initial,
    prefs: { ...defaults, reducedMotion: prefersReduced },
  };
  try {
    const saved = JSON.parse(raw ?? "null");
    if (saved?.version !== 1) return fallback;
    for (const key of Object.keys(defaults) as (keyof Preferences)[]) {
      if (typeof saved.prefs?.[key] === "boolean")
        fallback.prefs[key] = saved.prefs[key];
    }
    fallback.selected =
      missions.find((m) => m.id === saved.selected)?.id ?? "go";
  } catch {
    /* An unreadable save starts a fresh map. */
  }
  return fallback;
}
export function makeStore() {
  let state = initial;
  const listeners = new Set<() => void>();
  const publish = (next: MapState) => {
    state = next;
    listeners.forEach((fn) => fn());
  };
  return {
    get: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    restore() {
      let raw = null;
      try {
        raw = window.localStorage.getItem(saveKey);
      } catch {
        /* Session-only mode. */
      }
      publish(
        decode(
          raw,
          window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
      );
    },
    dispatch(action: MapAction) {
      const next = reduce(state, action);
      publish(next);
      try {
        window.localStorage.setItem(
          saveKey,
          JSON.stringify({
            version: 1,
            prefs: next.prefs,
            selected: next.selected,
          }),
        );
      } catch {
        /* Play can continue in memory. */
      }
    },
  };
}
export type MapStore = ReturnType<typeof makeStore>;
