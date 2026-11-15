import { act, begin, type Cargo, type Run, type Spot } from "./adventure";
import type { MissionId } from "./missions";

type Journal = { version: 1; cargo: Cargo; actions: Spot[] };
type Session = { run: Run; journal: Journal };
const key = (id: MissionId) => "JuniorAstronaut.room.v1." + id;
const fresh = (id: MissionId, cargo: Cargo): Session => ({
  run: begin(id, cargo),
  journal: { version: 1, cargo, actions: [] },
});

export function decodeSession(
  id: MissionId,
  raw: string | null,
  cargo: Cargo = "none",
): Session {
  try {
    const saved = JSON.parse(raw ?? "null") as Journal | null;
    if (
      saved?.version !== 1 ||
      !["none", "battery", "camera"].includes(saved.cargo) ||
      !Array.isArray(saved.actions) ||
      saved.actions.length > 12000 ||
      !saved.actions.every((item) => ["left", "middle", "right"].includes(item))
    )
      return fresh(id, cargo);
    return {
      run: saved.actions.reduce(
        (run, spot) => act(run, spot),
        begin(id, saved.cargo),
      ),
      journal: saved,
    };
  } catch {
    return fresh(id, cargo);
  }
}
function load(id: MissionId) {
  try {
    return window.localStorage.getItem(key(id));
  } catch {
    return null;
  }
}
function persist(session: Session) {
  try {
    window.localStorage.setItem(
      key(session.run.id),
      JSON.stringify(session.journal),
    );
  } catch {
    /* Storage can be disabled. */
  }
}
function deliveredCargo(): Cargo {
  const { run } = decodeSession("go", load("go"));
  return run.id === "go" && run.done ? run.kit : "none";
}
export function openSession(id: MissionId) {
  return decodeSession(id, load(id), id === "go" ? "none" : deliveredCargo());
}
export function restartSession(id: MissionId) {
  const session = fresh(id, id === "go" ? "none" : deliveredCargo());
  persist(session);
  return session;
}
export function choose(session: Session, spot: Spot): Session {
  const run = act(session.run, spot);
  if (run.steps === session.run.steps) return { ...session, run };
  const next = {
    run,
    journal: {
      ...session.journal,
      actions: [...session.journal.actions, spot],
    },
  };
  persist(next);
  return next;
}
