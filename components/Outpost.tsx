"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  CloudLightning,
  FlaskConical,
  Heart,
  Map,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Salad,
  Settings2,
  Sun,
  Wind,
  Zap,
} from "lucide-react";
import {
  adjust,
  beginOutpost,
  emptyPlan,
  endSol,
  limits,
  outpostStars,
  preview,
  sols,
  sparks,
  spent,
  systems,
  today,
  type Plan,
} from "../game/outpost";
import { profileStore, starNames, badges, type BadgeId } from "../game/profile";
import { play } from "../game/sfx";
import {
  Brand,
  Dialog,
  Hints,
  Settings,
  StarRow,
  useGameInput,
  usePreferences,
  useProfile,
} from "./Controls";

type Panel = "settings" | "pause" | "report" | "end" | "brief" | null;
const pips = (n: number, of: number) =>
  Array.from({ length: of }, (_, i) => i < n);

export default function Outpost() {
  const { state, toggle } = usePreferences();
  const profile = useProfile();
  const [game, setGame] = useState(beginOutpost);
  const [plan, setPlan] = useState<Plan>(emptyPlan);
  const [row, setRow] = useState(0);
  const [panel, setPanel] = useState<Panel>("brief");
  const [fresh, setFresh] = useState<BadgeId[]>([]);
  const rows = useRef<(HTMLElement | null)[]>([]);
  const sound = state.prefs.sound;
  const day = today(game),
    budget = sparks(game),
    left = budget - spent(plan),
    look = preview(game, plan);
  const endRow = systems.length;

  function change(index: number, delta: 1 | -1) {
    const next = adjust(game, plan, systems[index].id, delta);
    if (sound) play(next === plan ? "nope" : "move");
    setPlan(next);
  }
  function commit() {
    const next = endSol(game, plan);
    if (next === game) return;
    setGame(next);
    setPlan(emptyPlan);
    setRow(0);
    if (next.status !== "play") {
      const earned = profileStore.award({
        stage: "outpost",
        stars: outpostStars(next),
      });
      setFresh(earned.fresh);
    }
    if (sound) play(next.status === "won" ? "win" : "ok");
    setPanel("report");
  }
  function restart() {
    setGame(beginOutpost());
    setPlan(emptyPlan);
    setRow(0);
    setFresh([]);
    setPanel(null);
  }
  useEffect(() => {
    if (!panel) rows.current[row]?.scrollIntoView({ block: "nearest" });
  }, [row, panel]);
  useGameInput((press) => {
    if (panel) return false;
    if (game.status !== "play") {
      setPanel("end");
      return true;
    }
    switch (press.btn) {
      case "up":
        setRow((row + endRow) % (endRow + 1));
        return true;
      case "down":
        setRow((row + 1) % (endRow + 1));
        return true;
      case "left":
        if (row < endRow) change(row, -1);
        return true;
      case "right":
        if (row < endRow) change(row, 1);
        return true;
      case "a": {
        const el = document.activeElement as HTMLElement | null;
        if (press.source === "keys" && el && el !== document.body) return false;
        if (row === endRow) commit();
        else change(row, 1);
        return true;
      }
      case "x":
        setPanel("brief");
        return true;
      default:
        setPanel("pause");
        return true;
    }
  });
  const close = () => setPanel(null);
  const warn = {
    air:
      look.air === "on"
        ? "Fan on"
        : look.air === "pack"
          ? "Fan off: uses 1 air pack"
          : "Fan off and no air packs: −1 heart",
    farm: look.fed ? "Crew will eat" : "No food: −1 heart",
    shield:
      look.shield === "safe"
        ? "Crew protected"
        : look.shield === "open"
          ? "Storm with no shelter: −1 heart"
          : look.shield === "spare"
            ? "No storm today: not needed"
            : "No storm today",
    lab: "+" + plan.lab + " science",
  };
  const bad = {
    air: look.air !== "on",
    farm: !look.fed,
    shield: look.shield === "open",
    lab: false,
  };
  return (
    <div
      className={
        "flight-deck room outpost" + (state.prefs.largeText ? " large" : "")
      }
      style={{ "--room-color": "#ffb37a" } as CSSProperties}
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
            <p className="mission-chip">
              Final mission
              <StarRow
                stars={profile.stars.outpost}
                names={starNames.outpost}
              />
            </p>
            <h1>Outpost Commander</h1>
          </div>
        </div>
        <div className="game-case">
          <div className="game-strip">
            <span className="goal">
              Sol {game.sol} of {sols.length}
            </span>
            <div className="meters" aria-label="Outpost supplies">
              <span title="Crew hearts">
                <Heart size={14} />
                <span className="meter-name">Crew</span>
                <b>
                  {game.hearts}/{limits.hearts}
                </b>
              </span>
              <span title="Food in the pantry">
                <Salad size={14} />
                <span className="meter-name">Food</span>
                <b>{game.food}</b>
              </span>
              <span title="Spare air packs">
                <Wind size={14} />
                <span className="meter-name">Air packs</span>
                <b>{game.packs}</b>
              </span>
              <span title="Science points">
                <FlaskConical size={14} />
                <span className="meter-name">Science</span>
                <b>
                  {game.science}/{limits.science}
                </b>
              </span>
            </div>
          </div>
          <div className="outpost-sky" data-storm={day.storm}>
            <p className="forecast">
              {day.sun >= 4 ? (
                <Sun size={20} />
              ) : (
                <Sun size={20} opacity={0.5} />
              )}
              <b>{day.sun >= 4 ? "Sunny sol" : "Dusty sol"}</b> · {day.sun} sun
              sparks
              {game.battery > 0 && (
                <>
                  {" "}
                  + <BatteryCharging size={18} /> {game.battery} saved
                </>
              )}
            </p>
            <p className={"forecast storm-line" + (day.storm ? " alert" : "")}>
              <CloudLightning size={20} />
              {day.storm
                ? "NOVA radio: practice Sun storm today. Power the shelter!"
                : "NOVA radio: no storm in today’s forecast."}
            </p>
            <p className="spark-bank" aria-live="polite">
              <span className="meter-name">Sparks left</span>
              <span
                role="img"
                aria-label={left + " of " + budget + " sparks left"}
              >
                {pips(left, budget).map((on, i) => (
                  <Zap
                    key={i}
                    size={22}
                    className={on ? "pip on" : "pip"}
                    fill={on ? "currentColor" : "none"}
                  />
                ))}
              </span>
            </p>
          </div>
          <div
            className="system-list"
            data-sol={game.sol}
            data-status={game.status}
          >
            {systems.map((sys, i) => (
              <div
                key={sys.id}
                ref={(el) => {
                  rows.current[i] = el;
                }}
                className={"system-row" + (row === i ? " active" : "")}
                data-system={sys.id}
                onPointerDown={() => setRow(i)}
              >
                <Image
                  src={"/art/world/" + sys.art + ".webp"}
                  width={56}
                  height={56}
                  unoptimized
                  alt=""
                />
                <span className="system-copy">
                  <b>{sys.name}</b>
                  <small>{sys.does}</small>
                  <small className={bad[sys.id] ? "outcome bad" : "outcome"}>
                    {bad[sys.id] ? "⚠ " : "✓ "}
                    {warn[sys.id]}
                  </small>
                </span>
                <span className="system-dial">
                  <button
                    tabIndex={-1}
                    aria-label={"Take a spark from " + sys.name}
                    disabled={plan[sys.id] === 0}
                    onClick={() => change(i, -1)}
                  >
                    <Minus size={18} />
                  </button>
                  <span
                    role="img"
                    aria-label={plan[sys.id] + " of " + sys.max + " sparks"}
                  >
                    {pips(plan[sys.id], sys.max).map((on, j) => (
                      <Zap
                        key={j}
                        size={20}
                        className={on ? "pip on" : "pip"}
                        fill={on ? "currentColor" : "none"}
                      />
                    ))}
                  </span>
                  <button
                    tabIndex={-1}
                    aria-label={"Give a spark to " + sys.name}
                    disabled={plan[sys.id] === sys.max || left === 0}
                    onClick={() => change(i, 1)}
                  >
                    <Plus size={18} />
                  </button>
                </span>
              </div>
            ))}
            <button
              ref={(el) => {
                rows.current[endRow] = el;
              }}
              tabIndex={-1}
              className={"end-sol" + (row === endRow ? " active" : "")}
              onClick={commit}
            >
              <span>
                <b>End sol {game.sol}</b>
                <small>
                  {look.saved > 0
                    ? "Battery saves " + look.saved + " for later"
                    : "Nothing saved in the battery"}
                  {look.wasted > 0 &&
                    " · " + look.wasted + " will slip away (battery full)"}
                </small>
              </span>
              <ArrowRight size={20} />
            </button>
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
            <div>
              <strong>NOVA</strong>
              <p>
                {left > 0
                  ? "Give your sparks to the base. Leftover sparks charge the battery."
                  : "All sparks are placed. End the sol when you are ready!"}
              </p>
            </div>
          </div>
        </div>
        <Hints
          items={[
            ["move", "Pick · add · remove"],
            ["a", "Add / End sol"],
            ["x", "How to play"],
            ["b", "Menu"],
          ]}
        />
      </main>
      {panel === "brief" && (
        <Dialog title="Commander, your base!" close={close}>
          <p>
            Keep your crew safe for <b>6 sols</b>. A sol is one day on another
            world.
          </p>
          <p>
            Each sol the Sun gives you <b>sparks</b> of power. Share them
            between the air fan, the greenhouse, the storm shelter and the lab.
            Sparks you keep charge the battery (up to {limits.battery}).
          </p>
          <p>
            Up and down pick a machine. Left and right take or give a spark.
            Then choose <b>End sol</b>.
          </p>
          <p className="source-meta">
            Sparks, hearts and storms here are game units and practice drills.
            Real crews plan shelter using space weather reports like NASA DONKI.
          </p>
          <button className="primary" onClick={close}>
            <Play size={17} /> Start
          </button>
        </Dialog>
      )}
      {panel === "report" && (
        <Dialog
          title={
            game.status === "play"
              ? "Sol " + (game.sol - 1) + " report"
              : "Sol " + game.sol + " report"
          }
          close={() => setPanel(game.status === "play" ? null : "end")}
        >
          <ul className="report-list">
            {game.report.map((line) => (
              <li key={line} className={line.includes("−1") ? "bad" : ""}>
                {line}
              </li>
            ))}
          </ul>
          <button
            className="primary"
            onClick={() => setPanel(game.status === "play" ? null : "end")}
          >
            {game.status === "play" ? "Next sol" : "See how you did"}{" "}
            <ArrowRight size={17} />
          </button>
        </Dialog>
      )}
      {panel === "end" && (
        <Dialog
          title={game.status === "won" ? "Outpost safe!" : "Let’s try again"}
          close={close}
        >
          <div className="result">
            <div className="big-stars">
              <StarRow
                stars={outpostStars(game)}
                names={starNames.outpost}
                size={46}
              />
            </div>
            <p className="result-message">
              {game.status === "won"
                ? "You balanced power, air, food and shelter for 6 sols. The crew kept " +
                  game.hearts +
                  " hearts and earned " +
                  game.science +
                  " science."
                : "The crew flew back to the lander to rest. Everyone is fine. Watch the forecast and the pantry, then try again!"}
            </p>
            <ul className="star-list">
              {starNames.outpost.map((name, i) => (
                <li key={name} className={outpostStars(game)[i] ? "got" : ""}>
                  {outpostStars(game)[i] ? "★" : "☆"} {name}
                </li>
              ))}
            </ul>
            {fresh.map((badge) => (
              <p className="new-badge" key={badge}>
                New badge: <b>{badges.find((b) => b.id === badge)?.name}</b>
              </p>
            ))}
            <button className="primary" onClick={restart}>
              <RotateCcw size={17} /> Play again
            </button>
            <Link className="menu-choice" href="/">
              <Map size={17} /> Mission map
            </Link>
          </div>
        </Dialog>
      )}
      {panel === "settings" && (
        <Settings prefs={state.prefs} toggle={toggle} close={close} />
      )}
      {panel === "pause" && (
        <Dialog title="Game paused" close={close}>
          <button className="primary" onClick={close}>
            <Play size={17} /> Keep playing
          </button>
          <button className="menu-choice" onClick={restart}>
            <RotateCcw size={17} /> Start over
          </button>
          <Link className="menu-choice" href="/">
            <Map size={17} /> Mission map
          </Link>
        </Dialog>
      )}
    </div>
  );
}
