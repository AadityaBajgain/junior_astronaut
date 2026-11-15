"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Radio, Satellite } from "lucide-react";
import { facts, surfaceDose, words } from "../data/facts";
import type { ProtonNow, WeatherReport } from "../game/space-weather";
import { Dialog } from "./Controls";

// One request per page load, shared by every screen that shows space weather.
let request: Promise<WeatherReport | null> | undefined;
export function useWeather() {
  const [report, setReport] = useState<WeatherReport | null>(null);
  useEffect(() => {
    let live = true;
    request ??= fetch("/api/space-weather")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data?.event?.id ? (data as WeatherReport) : null))
      .catch(() => null);
    void request.then((data) => {
      if (!data) request = undefined;
      if (live) setReport(data);
    });
    return () => {
      live = false;
    };
  }, []);
  return report;
}
const clock = (iso: string) =>
  iso.slice(0, 10) + " " + iso.slice(11, 16) + " UTC";
export const describeNow = (now: ProtonNow) =>
  now.scale === 0
    ? "Calm. No Sun storm."
    : "Sun storm, level S" + now.scale + "!";

/** A one-line live reading. It says so plainly when the live feed cannot be reached. */
export function WeatherStrip({ report }: { report: WeatherReport | null }) {
  const now = report?.now;
  return (
    <span className="weather-strip" data-live={!!now}>
      <Satellite size={18} />
      {now ? (
        <span>
          <b className="live-tag">LIVE</b> Space weather near Earth and the
          Moon: <b>{describeNow(now)}</b>{" "}
          <span className="meter-name">
            {now.flux.toFixed(2)} pfu · {now.satellite} · {clock(now.time)}
          </span>
        </span>
      ) : (
        <span>
          Live space weather is not available right now. Archived NASA records
          are still here.
        </span>
      )}
    </span>
  );
}

export function WeatherStation({
  report,
  close,
}: {
  report: WeatherReport | null;
  close: () => void;
}) {
  const now = report?.now;
  return (
    <Dialog title="Space weather station" close={close}>
      <section className="weather-card">
        <h3>
          <Satellite size={18} /> Right now, near Earth and the Moon
        </h3>
        {now ? (
          <>
            <p className="big-reading">
              <b className="live-tag">LIVE</b> {describeNow(now)}
            </p>
            <p>
              A weather satellite counted <b>{now.flux.toFixed(2)} pfu</b> of
              fast Sun protons. A Sun storm starts at 10 pfu.
            </p>
            <p className="source-meta">
              {now.satellite} satellite, protons of 10 MeV and more, read{" "}
              {clock(now.time)}. Data: NOAA Space Weather Prediction Center.
              GOES satellites are built with NASA. pfu means particles hitting a
              small area each second.
            </p>
          </>
        ) : (
          <p>
            The live satellite feed could not be reached. Nothing here is being
            shown as live.
          </p>
        )}
        <a
          href="https://www.swpc.noaa.gov/products/goes-proton-flux"
          target="_blank"
          rel="noreferrer"
        >
          NOAA GOES proton flux <ExternalLink size={13} />
        </a>
      </section>
      <section className="weather-card">
        <h3>
          <Radio size={18} /> Measured on the ground (not live)
        </h3>
        <p>
          Nobody shares a live radiation meter from the Moon or Mars yet. These
          are real measurements from past missions.
        </p>
        {(["moon", "mars"] as const).map((world) => {
          const d = surfaceDose[world];
          return (
            <p key={world} className="radiation-line">
              <b>
                {d.value} {d.unit}
              </b>{" "}
              · {d.where} · {d.when}
              <br />
              <span className="source-meta">
                {d.by} {d.exact}.{" "}
                <a href={d.link} target="_blank" rel="noreferrer">
                  Source <ExternalLink size={12} />
                </a>
              </span>
            </p>
          );
        })}
        <p className="source-meta">
          mSv means millisievert, a unit for how much radiation a body soaks up.
          These numbers are averages for one place and time. They are not a
          safety limit.
        </p>
      </section>
      <button className="primary" data-autofocus="" onClick={close}>
        Back
      </button>
      <WordList />
    </Dialog>
  );
}
export function WordList() {
  return (
    <details className="source-fold field-note">
      <summary>Space words</summary>
      {words.map(([word, meaning]) => (
        <p key={word}>
          <strong>{word}:</strong> {meaning}
        </p>
      ))}
    </details>
  );
}
/** Real findings with their sources, plus questions for a parent or teacher. */
export function GrownUps() {
  return (
    <details className="source-fold field-note">
      <summary>For grown-ups and classrooms</summary>
      <p>
        Every mission teaches one real limit of living in space: room on a
        rocket, power in the dark, food that takes time, and shelter from Sun
        storms. Outpost Commander puts them together. Try these questions after
        playing:
      </p>
      <p>
        1. Why could the base not run everything at once?
        <br />
        2. What did you give up to keep the crew safe in a storm?
        <br />
        3. A forecast warned of a storm that never came. Was the shelter spark
        wasted?
      </p>
      <p>
        <strong>Real findings used in the game</strong>
      </p>
      {facts.map((fact) => (
        <p key={fact.id}>
          {fact.detail}{" "}
          <a href={fact.link} target="_blank" rel="noreferrer">
            {fact.agency} <ExternalLink size={12} />
          </a>
        </p>
      ))}
      <p className="source-meta">
        Sparks, hearts, stars and sunlight amounts are game units, not NASA
        engineering values. Sources were read on November 15, 2026.
      </p>
    </details>
  );
}
