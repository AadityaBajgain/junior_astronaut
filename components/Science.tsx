import Image from "next/image";
import { ChevronDown, ExternalLink, Lock, Radio, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cardsFor, type Card } from "../data/cards";
import { surfaceDose } from "../data/facts";
import { historicalEvent, type WeatherReport } from "../game/space-weather";
import type { MissionId } from "../game/missions";

function WeatherCard({ report }: { report: WeatherReport | null }) {
  const e = report?.event ?? historicalEvent;
  const source =
    report?.kind === "catalog"
      ? "Recent NASA catalog record"
      : "Archived NASA event";
  return (
    <section className="weather-card">
      <h3>
        <Radio size={18} /> Space radio
      </h3>
      <p>
        A space tool spotted speedy bits from the Sun. We use its report for our
        shelter game.
      </p>
      <p className="weather-date">
        {source} · {e.time.slice(0, 10)}
      </p>
      {report?.now && (
        <p className="weather-date">
          <b className="live-tag">LIVE</b> Near Earth right now:{" "}
          {report.now.scale === 0
            ? "calm, no Sun storm"
            : "Sun storm level S" + report.now.scale}{" "}
          · {report.now.flux.toFixed(2)} pfu · {report.now.satellite} ·{" "}
          {report.now.time.slice(11, 16)} UTC · NOAA
        </p>
      )}
      {report?.kind === "empty" && (
        <p className="source-meta">
          NASA returned no matching events for {report.from} to {report.to}. The
          drill uses the older event.
        </p>
      )}
      {report?.kind === "archive" && (
        <p className="source-meta">
          Using our saved example. The catalog did not supply a usable recent
          record.
        </p>
      )}
      <details>
        <summary>
          Event details <ChevronDown size={14} />
        </summary>
        <p>
          {e.id} · {e.time} UTC
          <br />
          {e.instrument}. The instrument found energetic particles in space. A
          dose on the Moon’s surface would need a different measurement.
        </p>
        {report && (
          <p>
            Catalog checked {report.checkedAt} for {report.from} to {report.to}{" "}
            (UTC).
          </p>
        )}
        <a href={e.source} target="_blank" rel="noreferrer">
          NASA DONKI event <ExternalLink size={13} />
        </a>
      </details>
    </section>
  );
}
/** The pop-up that appears by itself when a task unlocks a real fact. */
export function FactToast({ card }: { card: Card }) {
  return (
    <aside className="fact-toast" role="status" aria-live="polite">
      <div className="fact-toast-photo">
        <Image src={card.image} alt={card.alt} unoptimized fill sizes="180px" />
      </div>
      <div>
        <b className="real-tag">REAL NASA FACT</b>
        <h3>{card.title}</h3>
        <p>{card.kid}</p>
        <small>
          Photo: {card.caption} {card.credit}
        </small>
      </div>
    </aside>
  );
}
/** Every fact card of a mission. Cards still locked show how to find them. */
export default function Album({
  id,
  found,
  report,
}: {
  id: MissionId;
  found: string[];
  report: WeatherReport | null;
}) {
  const list = cardsFor(id);
  const [canRead, setCanRead] = useState(false);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const check = () =>
      setCanRead(
        synth.getVoices().some((v) => v.localService && /^en/i.test(v.lang)),
      );
    check();
    synth.addEventListener("voiceschanged", check);
    return () => {
      synth.cancel();
      synth.removeEventListener("voiceschanged", check);
    };
  }, []);
  function read(card: Card) {
    const synth = window.speechSynthesis,
      voice = synth
        .getVoices()
        .find((v) => v.localService && /^en/i.test(v.lang));
    if (!voice) return;
    synth.cancel();
    const text = new SpeechSynthesisUtterance(card.title + ". " + card.kid);
    text.voice = voice;
    text.rate = 0.86;
    synth.speak(text);
  }
  return (
    <div className="field-note album">
      <p className="source-meta">
        Fact cards pop up by themselves when you finish a task. Found{" "}
        {list.filter((c) => found.includes(c.id)).length} of {list.length}.
      </p>
      {list.map((card) =>
        found.includes(card.id) ? (
          <article key={card.id} className="album-card">
            <figure>
              <div className="field-image">
                <Image
                  src={card.image}
                  loading="eager"
                  alt={card.alt}
                  unoptimized
                  fill
                  sizes="(max-width: 600px) 95vw, 520px"
                />
              </div>
              <figcaption>
                Archive photo · {card.caption} {card.credit}
              </figcaption>
            </figure>
            <div className="field-copy">
              <h3>{card.title}</h3>
              <p>{card.kid}</p>
              <a href={card.source} target="_blank" rel="noreferrer">
                NASA source <ExternalLink size={12} />
              </a>
              {canRead && (
                <button className="listen" onClick={() => read(card)}>
                  <Volume2 size={16} /> Read to me
                </button>
              )}
            </div>
          </article>
        ) : (
          <p key={card.id} className="album-locked">
            <Lock size={16} /> {card.task} to find this card.
          </p>
        ),
      )}
      {id === "explore" && (
        <>
          <p className="radiation-line">
            <b>
              {surfaceDose.moon.value} {surfaceDose.moon.unit}
            </b>{" "}
            measured on the Moon in {surfaceDose.moon.when} ·{" "}
            {surfaceDose.moon.by}
          </p>
          <WeatherCard report={report} />
        </>
      )}
      <p className="source-meta">
        Photos are archives. Sparks, suit air and the game’s rules are game
        units. Sources checked November 15, 2026.
      </p>
    </div>
  );
}
