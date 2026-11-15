"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  Award,
  ExternalLink,
  MoveRight,
  Pause,
  Play,
  Settings2,
  Star,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { missions, type MissionId } from "../game/missions";
import { anchors } from "../game/layout";
import { menuHandler } from "../game/input";
import {
  badges,
  maxStars,
  nextStage,
  rankOf,
  starNames,
  type Profile,
} from "../game/profile";
import { fieldNotes } from "../data/field-notes";
import {
  Brand,
  Dialog,
  Hints,
  Settings,
  StarRow,
  chime,
  useGameInput,
  usePreferences,
  useProfile,
} from "./Controls";

// The title shows once per browser tab, so coming back to the map is instant.
const startedKey = "JuniorAstronaut.started";
const titleListeners = new Set<() => void>();
const titleStore = {
  subscribe(f: () => void) {
    titleListeners.add(f);
    return () => {
      titleListeners.delete(f);
    };
  },
  seen() {
    try {
      return window.sessionStorage.getItem(startedKey) === "1";
    } catch {
      return true;
    }
  },
  dismiss() {
    try {
      window.sessionStorage.setItem(startedKey, "1");
    } catch {
      /* The title simply shows again next time. */
    }
    titleListeners.forEach((f) => f());
  },
};

function Trophies({ profile, close }: { profile: Profile; close: () => void }) {
  const rank = rankOf(profile);
  return (
    <Dialog title="Trophy room" close={close}>
      <p className="rank-line">
        <Award size={22} /> <b>{rank.name}</b> · {rank.total} of {maxStars}{" "}
        stars
      </p>
      {rank.next && (
        <p className="source-meta">
          {rank.next.stars - rank.total} more stars to become {rank.next.name}.
        </p>
      )}
      <ul className="badge-grid">
        {badges.map((badge) => {
          const got = profile.badges.includes(badge.id);
          return (
            <li key={badge.id} className={got ? "got" : ""}>
              <Trophy size={20} />
              <b>{badge.name}</b>
              <small>{got ? "Earned!" : badge.how}</small>
            </li>
          );
        })}
      </ul>
      <button className="primary" data-autofocus="" onClick={close}>
        Back to the map
      </button>
      <details className="source-fold field-note">
        <summary>For curious grown-ups: science log</summary>
        <p>
          Every mission uses one real NASA record. Photos and reports are
          archives. Sparks, hearts, stars and sols are game units.
        </p>
        {missions.map((m) => (
          <p key={m.id}>
            <strong>
              {m.name}: {fieldNotes[m.id].photoTitle}
            </strong>
            <br />
            {fieldNotes[m.id].datePlace} · {fieldNotes[m.id].credit}
            <br />
            <a
              href={fieldNotes[m.id].dataSource}
              target="_blank"
              rel="noreferrer"
            >
              NASA record <ExternalLink size={13} />
            </a>
          </p>
        ))}
      </details>
    </Dialog>
  );
}

export default function FlightDeck() {
  const { store, state, toggle } = usePreferences();
  const [settings, setSettings] = useState(false);
  const [trophies, setTrophies] = useState(false);
  const profile = useProfile();
  const rank = rankOf(profile);
  const upNext = nextStage(profile);
  const titleSeen = useSyncExternalStore(
    titleStore.subscribe,
    titleStore.seen,
    () => false,
  );
  const deck = useRef<HTMLDivElement>(null);
  const begin = () => {
    titleStore.dismiss();
    if (store.get().prefs.sound) chime();
    // Start on the next unfinished mission so one press of A plays it.
    requestAnimationFrame(() =>
      (
        deck.current?.querySelector<HTMLElement>("[data-next]") ??
        labels.current[0]
      )?.focus(),
    );
  };
  useGameInput((press) => {
    if (!titleSeen) {
      if (press.btn === "x") toggle("sound");
      else if (press.btn === "a" || press.btn === "start") begin();
      return true;
    }
    if (press.btn === "x") {
      setTrophies(true);
      return true;
    }
    return menuHandler(() => deck.current)(press);
  });
  const [status, setStatus] = useState("loading");
  const router = useRouter();
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLAnchorElement | null)[]>([]);
  const select = useCallback(
    (id: MissionId) => {
      store.dispatch({ type: "select", id });
    },
    [store],
  );
  const enter = useCallback(
    (id: MissionId) => {
      select(id);
      if (store.get().prefs.sound) chime();
      router.push("/missions/" + id);
    },
    [router, select, store],
  );
  useEffect(() => {
    let cancelled = false,
      dispose: (() => void) | undefined;
    void import("../game/chart")
      .then(({ mountChart }) => {
        if (!cancelled && host.current)
          dispose = mountChart(host.current, store, enter, () => {
            if (!cancelled) setStatus("ready");
          });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [store, enter]);
  return (
    <div
      ref={deck}
      className={"flight-deck hub" + (state.prefs.largeText ? " large" : "")}
    >
      {!titleSeen && (
        <div className="title-screen" role="dialog" aria-label="Title screen">
          <Image
            src="/art/world/front.webp"
            width={110}
            height={150}
            unoptimized
            alt=""
            className="title-astronaut"
          />
          <h1>
            Junior<span className="gold">Astronaut</span>
          </h1>
          <p className="title-tag">Go · Land · Live · Explore</p>
          <button className="primary press-start" onClick={begin}>
            Press SPACE or A to start
          </button>
          <button className="menu-choice" onClick={() => toggle("sound")}>
            {state.prefs.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
            Sound: {state.prefs.sound ? "on" : "off"} (press X)
          </button>
          <p className="title-note">
            Play with a keyboard, a gamepad or your own controller.
          </p>
        </div>
      )}
      <header className="topbar" inert={!titleSeen}>
        <div className="wrap top-inner">
          <Brand />
          <div className="toolbar">
            <button
              className="rank-chip"
              onClick={() => setTrophies(true)}
              aria-label={
                "Trophy room. " +
                rank.name +
                ", " +
                rank.total +
                " of " +
                maxStars +
                " stars"
              }
            >
              <Star size={17} fill="currentColor" />
              <span>
                {rank.total}/{maxStars} · {rank.name}
              </span>
            </button>
            <button
              aria-label={
                state.paused ? "Resume map motion" : "Pause map motion"
              }
              aria-pressed={state.paused}
              onClick={() => store.dispatch({ type: "pause" })}
            >
              {state.paused ? <Play /> : <Pause />}
            </button>
            <button aria-label="Settings" onClick={() => setSettings(true)}>
              <Settings2 />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>
      <main className="wrap hub-main" inert={!titleSeen}>
        <div className="hub-heading">
          <div>
            <h1>Mission map</h1>
            <p>Pick a place. Your adventure starts there.</p>
          </div>
          <Image
            src="/art/world/front.webp"
            width={55}
            height={75}
            unoptimized
            alt="Your little astronaut"
            className="map-astronaut"
          />
        </div>
        <section className="chart-frame" aria-label="Mission map">
          <div className="chart" data-status={status}>
            <div className="phaser" ref={host} aria-hidden="true" />
            {status !== "ready" && (
              <p className="loading-note" role="status">
                {status === "loading"
                  ? "Opening the star map…"
                  : "Use a destination name to enter."}
              </p>
            )}
            <nav className="destinations" aria-label="Choose a mission">
              {missions.map((m, i) => {
                const a = anchors(false)[i],
                  b = anchors(true)[i];
                return (
                  <Link
                    key={m.id}
                    href={"/missions/" + m.id}
                    ref={(el) => {
                      labels.current[i] = el;
                    }}
                    className="destination"
                    style={
                      {
                        "--dx": a.x * 100 + "%",
                        "--dy": a.y * 100 + "%",
                        "--mx": b.x * 100 + "%",
                        "--my": b.y * 100 + "%",
                        "--ink": m.color,
                      } as CSSProperties
                    }
                    aria-label={m.name + " · " + m.place}
                    data-next={upNext === m.id ? "" : undefined}
                    onFocus={() => select(m.id)}
                    onClick={() => {
                      select(m.id);
                      if (store.get().prefs.sound) chime();
                    }}
                  >
                    <span className="dest-name">
                      {m.name} <MoveRight size={14} />
                    </span>
                    <span className="dest-place">{m.place}</span>
                    <StarRow
                      stars={profile.stars[m.id]}
                      names={starNames.room}
                      size={15}
                    />
                    {upNext === m.id && <span className="next-flag">NEXT</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </section>
        <Link
          href="/outpost"
          className="outpost-card"
          data-next={upNext === "outpost" ? "" : undefined}
          aria-label="Final mission · Outpost Commander"
        >
          <Image
            src="/art/world/cabin.webp"
            width={64}
            height={64}
            unoptimized
            alt=""
          />
          <span>
            <b>Final mission · Outpost Commander</b>
            <small>
              Run a Moon base for 6 sols. Balance air, food, power and the storm
              shelter.
            </small>
          </span>
          <StarRow stars={profile.stars.outpost} names={starNames.outpost} />
          {upNext === "outpost" && <span className="next-flag">NEXT</span>}
        </Link>
        <Hints
          items={[
            ["move", "Choose"],
            ["a", "Play"],
            ["x", "Trophies"],
          ]}
        />
      </main>
      {trophies && (
        <Trophies profile={profile} close={() => setTrophies(false)} />
      )}
      {settings && (
        <Settings
          prefs={state.prefs}
          toggle={toggle}
          close={() => setSettings(false)}
        />
      )}
    </div>
  );
}
