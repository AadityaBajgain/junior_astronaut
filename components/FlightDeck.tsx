"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { MoveRight, Pause, Play, Settings2 } from "lucide-react";
import { missions, type MissionId } from "../game/missions";
import { anchors } from "../game/layout";
import { Brand, Settings, chime, usePreferences } from "./Controls";

export default function FlightDeck() {
  const { store, state, toggle } = usePreferences();
  const [settings, setSettings] = useState(false);
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
      className={"flight-deck hub" + (state.prefs.largeText ? " large" : "")}
    >
      <header className="topbar">
        <div className="wrap top-inner">
          <Brand />
          <div className="toolbar">
            <button
              aria-label={
                state.paused ? "Resume map motion" : "Pause map motion"
              }
              aria-pressed={state.paused}
              onClick={() => store.dispatch({ type: "pause" })}
            >
              {state.paused ? <Play /> : <Pause />}
            </button>
            <button onClick={() => setSettings(true)}>
              <Settings2 />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>
      <main className="wrap hub-main">
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
                    onFocus={() => select(m.id)}
                    onClick={() => {
                      select(m.id);
                      if (store.get().prefs.sound) chime();
                    }}
                    onKeyDown={(e) => {
                      let n = i;
                      if (["ArrowRight", "ArrowDown"].includes(e.key))
                        n = (i + 1) % 4;
                      else if (["ArrowLeft", "ArrowUp"].includes(e.key))
                        n = (i + 3) % 4;
                      else return;
                      e.preventDefault();
                      labels.current[n]?.focus();
                    }}
                  >
                    <span className="dest-name">
                      {m.name} <MoveRight size={14} />
                    </span>
                    <span className="dest-place">{m.place}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </section>
      </main>
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
