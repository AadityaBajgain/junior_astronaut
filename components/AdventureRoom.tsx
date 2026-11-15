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
  Award,
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
  expertGoals,
  goals,
  questions,
  meters,
  milestone,
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
import { type WeatherReport, historicalEvent } from "../game/space-weather";
import {
  Brand,
  Dialog,
  FullscreenButton,
  Hints,
  Settings,
  StarRow,
  useGameInput,
  usePreferences,
  useProfile,
} from "./Controls";
import Album, { FactToast } from "./Science";
import { cardById, cardsFor } from "../data/cards";
import { device } from "../game/device";
import { WordList } from "./SpaceWeather";
import { isDirection } from "../game/input";
import { play } from "../game/sfx";
import {
  badges,
  profileStore,
  quizzes,
  runBadges,
  runStars,
  starNames,
  type BadgeId,
} from "../game/profile";

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
  Fuel: Droplet,
  Suit: Check,
  Nights: Moon,
  Water: Droplet,
  Salads: Leaf,
  "Suit air": Wind,
};
// Names that fit the controller's 16-character display.
const lcdNames: Record<MissionId, string> = {
  go: "Earth launchpad",
  land: "Moon landing",
  live: "Moon greenhouse",
  explore: "Moon rover trek",
};
type Panel = "photo" | "settings" | "pause" | "help" | "result" | null;

function Result({
  id,
  message,
  fresh,
  sound,
  nextHref,
  nextLabel,
  restart,
}: {
  id: MissionId;
  message: string;
  fresh: BadgeId[];
  sound: boolean;
  nextHref: string;
  nextLabel: string;
  restart: () => void;
}) {
  const { stars: allStars, cards: found } = useProfile();
  const stars = allStars[id];
  const quiz = quizzes[id];
  const [wrong, setWrong] = useState<number[]>([]);
  const next = useRef<HTMLAnchorElement>(null);
  const solved = stars[2];
  const options = useRef<HTMLElement>(null);
  useEffect(() => {
    if (solved) next.current?.focus();
  }, [solved]);
  useEffect(() => {
    // A wrong answer switches off; the next answer takes the focus.
    if (wrong.length)
      options.current
        ?.querySelector<HTMLElement>("button:not([disabled])")
        ?.focus();
  }, [wrong]);
  function answer(i: number) {
    if (i === quiz.answer) {
      profileStore.award({ stage: id, stars: [false, false, true] });
      if (sound) play("star");
    } else {
      setWrong([...wrong, i]);
      if (sound) play("nope");
    }
  }
  return (
    <div className="result">
      <div className="big-stars">
        <StarRow stars={stars} names={starNames.room} size={46} />
      </div>
      <p className="result-message">{message}</p>
      <ul className="star-list">
        {starNames.room.map((name, i) => (
          <li key={name} className={stars[i] ? "got" : ""}>
            {stars[i] ? "★" : "☆"} {name}
            {i === 1 && ": " + expertGoals[id]}
          </li>
        ))}
        <li>
          NASA fact cards:{" "}
          {cardsFor(id).filter((c) => found.includes(c.id)).length} of{" "}
          {cardsFor(id).length}
        </li>
      </ul>
      {fresh.map((badge) => (
        <p className="new-badge" key={badge}>
          <Award size={18} /> New badge:{" "}
          <b>{badges.find((b) => b.id === badge)?.name}</b>
        </p>
      ))}
      <section className="quiz" aria-live="polite" ref={options}>
        <h3>{solved ? "Star question solved!" : "Star question"}</h3>
        <p>{quiz.ask}</p>
        {solved ? (
          <p className="quiz-why">{quiz.why}</p>
        ) : (
          <>
            {quiz.options.map((option, i) => (
              <button
                key={option}
                className="menu-choice"
                data-autofocus={i === 0 ? "" : undefined}
                disabled={wrong.includes(i)}
                onClick={() => answer(i)}
              >
                {option}
              </button>
            ))}
            {wrong.length > 0 && (
              <p className="quiz-why">Not quite. Try another answer!</p>
            )}
          </>
        )}
      </section>
      <Link className="primary" href={nextHref} ref={next}>
        {nextLabel} <ArrowRight size={18} />
      </Link>
      <button className="menu-choice" onClick={restart}>
        <RotateCcw size={17} /> Play again
      </button>
      <Link className="menu-choice" href="/">
        <Map size={17} /> Mission map
      </Link>
    </div>
  );
}

export default function AdventureRoom({ id }: { id: MissionId }) {
  const m = getMission(id);
  const { state, store: prefs, toggle } = usePreferences();
  const [store] = useState(() => roomStore(id));
  const run = useSyncExternalStore(store.subscribe, store.get, store.initial);
  const [panel, setPanel] = useState<Panel>(null);
  const [status, setStatus] = useState("loading");
  const [report, setReport] = useState<WeatherReport | null>(null);
  const host = useRef<HTMLDivElement>(null),
    world = useRef<WorldHandle | null>(null);
  const paused = useRef(false);
  const profile = useProfile();
  const [fresh, setFresh] = useState<BadgeId[]>([]);
  const openPhoto = useCallback(() => setPanel("photo"), []);
  // The fact card that just popped up, and the timer that puts it away.
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const showCard = useCallback(
    (card: string) => {
      profileStore.award({ stage: id, card });
      setToast(card);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 11000);
    },
    [id],
  );
  const index = missions.findIndex((x) => x.id === id);
  // Arriving at a level is announced on the controller's display.
  useEffect(() => {
    device.hold(null);
    device.screen(lcdNames[id], "reached! Lvl " + (index + 1) + "/5");
    return () => {
      clearTimeout(toastTimer.current);
      device.moving(false);
    };
  }, [id, index]);
  useEffect(() => {
    if (!run.done) return;
    const earned = profileStore.award({
      stage: id,
      stars: runStars(run),
      badges: runBadges(run),
    });
    device.screen("Mission done!", m.name + " complete");
    device.hold("g");
    const { reducedMotion, sound } = prefs.get().prefs;
    const timer = setTimeout(
      () => {
        if (earned.fresh.length) setFresh(earned.fresh);
        if (sound && earned.changed) play("win");
        setPanel((open) => open ?? "result");
      },
      reducedMotion ? 250 : id === "go" ? 1900 : 1200,
    );
    return () => clearTimeout(timer);
    // Only the moment of completion matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.done, id, prefs]);
  useGameInput((press) => {
    if (panel) return false;
    const el = document.activeElement as HTMLElement | null;
    const onControl = !!el && el !== document.body && el.tagName !== "CANVAS";
    if (isDirection(press.btn)) {
      // Walking always wins, so a clicked button never traps the keys.
      if (onControl) el.blur();
      return true;
    }
    switch (press.btn) {
      case "a":
        if (onControl && press.source === "keys") return false;
        if (!world.current?.interact()) setPanel(run.done ? "result" : null);
        return true;
      case "x":
        world.current?.jump();
        return true;
      default:
        setPanel("pause");
        return true;
    }
  });
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
      const before = store.get();
      const label = stations(before).find((x) => x.spot === spot)?.label ?? "";
      const run = store.act(spot);
      const worked = run.steps > before.steps;
      // The display names the action and what changed; the lights say if it worked.
      const was = Object.fromEntries(meters(before));
      const change = meters(run).find(([name, value]) => was[name] !== value);
      device.screen(
        label,
        worked ? (change ? change.join(" ") : "Done!") : "Not yet! Look up",
      );
      device.flash(worked ? "g" : "r");
      const card = milestone(before, run);
      if (card) showCard(card);
      if (prefs.get().prefs.sound) play(worked ? "ok" : "nope");
      return run;
    },
    [store, prefs, showCard],
  );
  useEffect(() => {
    let disposed = false;
    void import("../game/world")
      .then(({ startWorld }) => {
        if (disposed || !host.current) return;
        world.current = startWorld(host.current, id, {
          state: store.get,
          activate,
          jumped: () => {
            if (!profileStore.get().cards.includes("moon-jump"))
              showCard("moon-jump");
          },
          motion: (moving) => device.moving(moving),
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
  }, [id, store, prefs, activate, showCard]);
  useEffect(() => {
    paused.current = !!panel;
    world.current?.setMotion(state.prefs.reducedMotion, !!panel);
  }, [state.prefs.reducedMotion, panel]);
  // After a finished mission, closing a card returns to the stars.
  const close = () =>
    setPanel(run.done && panel !== "result" ? "result" : null);
  const restart = () => {
    store.reset();
    world.current?.reset();
    setFresh([]);
    setToast(null);
    device.hold(null);
    device.screen(lcdNames[id], "Try again!");
    setPanel(null);
  };
  const options = stations(run),
    next = missions[index + 1];
  const nextHref = next ? "/missions/" + next.id : "/outpost",
    nextLabel = next ? "Go to " + next.place : "Final mission: Outpost";
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
            <FullscreenButton />
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
            <p className="mission-chip">
              Mission {index + 1} of 4 · {m.name}
              <StarRow stars={profile.stars[id]} names={starNames.room} />
              <span className="gravity-chip">
                {id === "go"
                  ? "Earth gravity 9.8 m/s²"
                  : "Moon gravity 1.6 m/s² (one-sixth)"}
              </span>
            </p>
            <h1>{m.place}</h1>
          </div>
          <button className="photo-button" onClick={openPhoto}>
            <Camera size={18} />
            <span>
              Fact cards{" "}
              {cardsFor(id).filter((c) => profile.cards.includes(c.id)).length}/
              {cardsFor(id).length}
            </span>
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
          {toast && cardById(toast) && !panel && (
            <FactToast card={cardById(toast)!} />
          )}
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
              <button
                className="station-action"
                onClick={() => setPanel("result")}
              >
                <Award size={21} />
                <b>See my stars</b>
              </button>
              <Link className="next-mission" href={nextHref}>
                {nextLabel}
                <ArrowRight size={18} />
              </Link>
            </>
          )}
        </section>
        {id === "explore" &&
          run.id === "explore" &&
          run.samples > 0 &&
          !run.done && (
            <button className="radio-link" onClick={openPhoto}>
              <Radio size={16} /> Space weather ·{" "}
              {report?.kind === "catalog" ? "NASA report" : "NASA archive"} ·{" "}
              {(report?.event ?? historicalEvent).time.slice(0, 10)}{" "}
              <ChevronRight size={14} />
            </button>
          )}
        <Hints
          items={[
            ["move", "Walk"],
            ["a", "Use"],
            ["x", "Jump"],
            ["b", "Menu"],
          ]}
        />
      </main>
      {panel === "result" && (
        <Dialog title="Mission complete!" close={close}>
          <Result
            id={id}
            message={run.message}
            fresh={fresh}
            sound={state.prefs.sound}
            nextHref={nextHref}
            nextLabel={nextLabel}
            restart={restart}
          />
        </Dialog>
      )}
      {panel === "settings" && (
        <Settings prefs={state.prefs} toggle={toggle} close={close} />
      )}
      {panel === "photo" && (
        <Dialog title={"Fact cards · " + m.name} close={close}>
          <Album id={id} found={profile.cards} report={report} />
          <button className="primary" onClick={close}>
            Back to the mission
          </button>
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
              Walk with the arrows, W A S D or your controller stick. Stand
              beside a thing and press Space or A to use it.
            </p>
          </div>
          <p>
            Press X to jump. On the Moon you fall slowly and fly six times
            higher. Earn 3 stars: finish the mission, reach its expert goal, and
            solve the star question. Real NASA fact cards pop up as you finish
            tasks.
          </p>
          <p>
            Esc or B opens the menu. Tapping the ground or the buttons works
            too. The sparks on your screen count game power.
          </p>
          <button className="primary" onClick={close}>
            Got it <Check size={17} />
          </button>
          <WordList />
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
          <button className="menu-choice" onClick={openPhoto}>
            <Camera size={17} /> Fact cards
          </button>
          <Link className="menu-choice" href="/">
            <Map size={17} /> Mission map
          </Link>
        </Dialog>
      )}
    </div>
  );
}
