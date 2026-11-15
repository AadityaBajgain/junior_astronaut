"use client";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Droplet,
  Flag,
  Focus,
  Home,
  Leaf,
  Map,
  Moon,
  Mountain,
  Package,
  Pause,
  Play,
  Radio,
  Rocket,
  RotateCcw,
  Settings2,
  Sprout,
  Sun,
  Wind,
} from "lucide-react";
import {
  goals,
  questions,
  meters,
  stations,
  type Spot,
} from "../game/adventure";
import {
  choose,
  decodeSession,
  openSession,
  restartSession,
} from "../game/journal";
import { getMission, missions, type MissionId } from "../game/missions";
import type { WorldHandle } from "../game/world";
import { fieldNotes } from "../data/field-notes";
import { type WeatherReport, historicalEvent } from "../game/space-weather";
import { Brand, Dialog, Settings, usePreferences, chime } from "./Controls";
import FieldNote from "./Science";

function roomStore(id: MissionId) {
  const first = decodeSession(id, null);
  let session = first;
  const listeners = new Set<() => void>();
  function set(next: typeof first) {
    session = next;
    listeners.forEach((f) => f());
    return next.run;
  }
  return {
    get: () => session.run,
    initial: () => first.run,
    subscribe(f: () => void) {
      listeners.add(f);
      return () => {
        listeners.delete(f);
      };
    },
    restore: () => set(openSession(id)),
    act: (spot: Spot) => set(choose(session, spot)),
    reset: () => set(restartSession(id)),
  };
}
const icons = {
  go: [Wind, Package, Rocket],
  land: [BatteryCharging, Home, Radio],
  live: [Droplet, Sun, Sprout],
  explore: [Home, Focus, Mountain],
};
const meterIcons: Record<string, typeof Sun> = {
  Cargo: Package,
  Kit: Camera,
  Sun: Sun,
  Battery: BatteryCharging,
  Scans: Radio,
  Shift: Moon,
  Bed: Leaf,
  Rocks: Mountain,
  Photos: Camera,
};
type Panel = "photo" | "settings" | "pause" | "help" | null;

export default function AdventureRoom({ id }: { id: MissionId }) {
  const m = getMission(id),
    note = fieldNotes[id];
  const { state, store: prefs, toggle } = usePreferences();
  const [store] = useState(() => roomStore(id));
  const run = useSyncExternalStore(store.subscribe, store.get, store.initial);
  const [panel, setPanel] = useState<Panel>(null);
  const [status, setStatus] = useState("loading");
  const [report, setReport] = useState<WeatherReport | null>(null);
  const host = useRef<HTMLDivElement>(null),
    world = useRef<WorldHandle | null>(null);
  const paused = useRef(false);
  useEffect(() => {
    store.restore();
    prefs.dispatch({ type: "select", id });
  }, [id, store, prefs]);
  useEffect(() => {
    if (id !== "explore") return;
    const controller = new AbortController();
    void fetch("/api/space-weather", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.event?.id && !controller.signal.aborted) setReport(data);
      })
      .catch(() => {
        /* The verified archive is already in the photo card. */
      });
    return () => controller.abort();
  }, [id]);
  const activate = useCallback(
    (spot: Spot) => {
      const run = store.act(spot);
      if (prefs.get().prefs.sound) chime();
      return run;
    },
    [store, prefs],
  );
  useEffect(() => {
    let disposed = false;
    void import("../game/world")
      .then(({ startWorld }) => {
        if (disposed || !host.current) return;
        world.current = startWorld(host.current, id, {
          state: store.get,
          activate,
          photo: () => setPanel("photo"),
          ready: () => {
            if (!disposed) setStatus("ready");
          },
          failed: () => {
            if (!disposed) setStatus("error");
          },
        });
        world.current.setMotion(
          prefs.get().prefs.reducedMotion,
          paused.current,
        );
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });
    return () => {
      disposed = true;
      world.current?.destroy();
      world.current = null;
    };
  }, [id, store, prefs, activate]);
  useEffect(() => {
    paused.current = !!panel;
    world.current?.setMotion(state.prefs.reducedMotion, !!panel);
  }, [state.prefs.reducedMotion, panel]);
  const close = () => setPanel(null);
  const restart = () => {
    store.reset();
    world.current?.reset();
    setPanel(null);
  };
  const options = stations(run),
    next = missions[missions.findIndex((x) => x.id === id) + 1];
  return (
    <div
      className={"flight-deck room" + (state.prefs.largeText ? " large" : "")}
      style={{ "--room-color": m.color } as CSSProperties}
    >
      <header className="topbar">
        <div className="wrap top-inner">
          <Link href="/" aria-label="JuniorAstronaut mission map">
            <Brand />
          </Link>
          <div className="toolbar">
            <button onClick={() => setPanel("pause")} aria-label="Pause game">
              <Pause />
              <span>Pause</span>
            </button>
            <button onClick={() => setPanel("settings")} aria-label="Settings">
              <Settings2 />
            </button>
          </div>
        </div>
      </header>
      <main className="wrap room-main">
        <div className="room-heading">
          <div>
            <Link className="back-link" href="/">
              <ArrowLeft size={15} /> Mission map
            </Link>
            <h1>{m.place}</h1>
          </div>
          <button className="photo-button" onClick={() => setPanel("photo")}>
            <Camera size={18} />
            <span>NASA photo</span>
          </button>
        </div>
        <div className="game-case">
          <div className="game-strip">
            <span className="goal">
              <Flag size={15} />
              {goals[id]}
            </span>
            <div className="meters" aria-label="Game supplies">
              {meters(run).map(([name, value]) => {
                const Icon = meterIcons[name] ?? Package;
                return (
                  <span key={name} title={"Game " + name.toLowerCase()}>
                    <Icon size={14} />
                    <span className="meter-name">{name}</span>
                    <b>{value}</b>
                  </span>
                );
              })}
            </div>
          </div>
          <div
            className="playfield"
            ref={host}
            data-status={status}
            data-room={id}
            data-turn={run.steps}
            data-complete={run.done}
            style={{ backgroundImage: "url(/art/world/" + id + ".webp)" }}
          >
            {status !== "ready" && (
              <div className="world-loading" role="status">
                {status === "loading" ? (
                  "Opening your world…"
                ) : (
                  <button onClick={() => window.location.reload()}>
                    World couldn’t load. Try again
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="dialogue-bar">
            <div className="nova-portrait">
              <Image
                unoptimized
                src="/art/nova.png"
                alt=""
                width={44}
                height={46}
              />
            </div>
            <div aria-live="polite" aria-atomic="true">
              <strong>NOVA</strong>
              <p>{run.message}</p>
              {run.done && <p className="debrief-question">{questions[id]}</p>}
            </div>
            <button
              className="help-button"
              onClick={() => setPanel("help")}
              aria-label="How to play"
            >
              <CircleHelp size={19} />
            </button>
          </div>
        </div>
        <section className="action-row" aria-label="Astronaut actions">
          {options.map((option) => {
            const Icon =
              icons[id][["left", "middle", "right"].indexOf(option.spot)];
            return (
              <button
                className="station-action"
                key={option.spot}
                data-spot={option.spot}
                disabled={status !== "ready"}
                onClick={() => world.current?.travel(option.spot)}
              >
                <span className="action-icon">
                  <Icon size={23} />
                </span>
                <span>
                  <b>{option.label}</b>
                  <small>{option.hint}</small>
                </span>
                <ChevronRight size={15} />
              </button>
            );
          })}
          {run.done && (
            <>
              <button className="station-action" onClick={restart}>
                <RotateCcw size={21} />
                <b>Play again</b>
              </button>
              <Link
                className="next-mission"
                href={next ? "/missions/" + next.id : "/"}
              >
                {next ? "Go to " + next.place : "Back to the map"}
                <ArrowRight size={18} />
              </Link>
            </>
          )}
        </section>
        {id === "explore" &&
          run.id === "explore" &&
          run.samples > 0 &&
          !run.done && (
            <button className="radio-link" onClick={() => setPanel("photo")}>
              <Radio size={16} /> Practice storm ·{" "}
              {report?.kind === "catalog" ? "NASA report" : "NASA archive"} ·{" "}
              {(report?.event ?? historicalEvent).time.slice(0, 10)}{" "}
              <ChevronRight size={14} />
            </button>
          )}
      </main>
      {panel === "settings" && (
        <Settings prefs={state.prefs} toggle={toggle} close={close} />
      )}
      {panel === "photo" && (
        <Dialog title={note.title} close={close}>
          <FieldNote id={id} report={report} />
        </Dialog>
      )}
      {panel === "help" && (
        <Dialog title="Move your astronaut" close={close}>
          <div className="how-to">
            <Image
              unoptimized
              src="/art/world/front.webp"
              width={50}
              height={70}
              alt="Your astronaut"
            />
            <p>
              Tap the ground to walk. Tap a thing to walk over and use it. The
              buttons do the same thing.
            </p>
          </div>
          <p>
            Keyboard: focus the picture. Use the arrows or W A S D to walk.
            Press Space beside a thing to use it.
          </p>
          <p>
            Visit NOVA for a real space photo. The sparks on your screen count
            game power.
          </p>
          <button className="primary" onClick={close}>
            Got it <Check size={17} />
          </button>
        </Dialog>
      )}
      {panel === "pause" && (
        <Dialog title="Game paused" close={close}>
          <button className="primary" onClick={close}>
            <Play size={17} /> Keep playing
          </button>
          <button className="menu-choice" onClick={restart}>
            <RotateCcw size={17} /> Start this room again
          </button>
          <Link className="menu-choice" href="/">
            <Map size={17} /> Mission map
          </Link>
        </Dialog>
      )}
    </div>
  );
}
