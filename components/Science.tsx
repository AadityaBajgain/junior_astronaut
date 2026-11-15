import Image from "next/image";
import { ChevronDown, ExternalLink, Radio, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fieldNotes } from "../data/field-notes";
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
          Mars surface dose would require a different measurement.
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
export default function FieldNote({
  id,
  report,
}: {
  id: MissionId;
  report: WeatherReport | null;
}) {
  const note = fieldNotes[id];
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
  function read() {
    const synth = window.speechSynthesis,
      voice = synth
        .getVoices()
        .find((v) => v.localService && /^en/i.test(v.lang));
    if (!voice) return;
    synth.cancel();
    const text = new SpeechSynthesisUtterance(
      note.title + ". " + note.child + " " + note.question,
    );
    text.voice = voice;
    text.rate = 0.86;
    synth.speak(text);
  }
  return (
    <article className="field-note">
      <figure>
        <div className={"field-image field-" + id}>
          <Image
            src={note.image}
            loading="eager"
            alt={note.alt}
            unoptimized
            fill
            sizes="(max-width: 600px) 95vw, 520px"
          />
        </div>
        <figcaption>
          Archive photo · {note.credit}{" "}
          <a
            href={note.photoSource}
            target="_blank"
            rel="noreferrer"
            aria-label="NASA photo source"
          >
            Source <ExternalLink size={12} />
          </a>
        </figcaption>
      </figure>
      <div className="field-copy">
        <h3>{note.fact}</h3>
        <p>{note.child}</p>
        {id === "explore" && (
          <p className="radiation-line">
            <b>0.67 mSv/day</b> on average, long ago at Gale Crater on Mars ·
            Aug 2012–Jun 2013
          </p>
        )}
        <p className="look-question">{note.question}</p>
        {canRead && (
          <button className="listen" onClick={read}>
            <Volume2 size={16} /> Read to me
          </button>
        )}
      </div>
      {id === "explore" && <WeatherCard report={report} />}
      <details className="source-fold">
        <summary>
          For curious grown-ups <ChevronDown size={16} />
        </summary>
        <p>
          <strong>{note.photoTitle}</strong>
          <br />
          {note.datePlace}
        </p>
        <p>{note.details}</p>
        <p>{note.game}</p>
        <a href={note.dataSource} target="_blank" rel="noreferrer">
          NASA science record <ExternalLink size={13} />
        </a>
        <p className="source-meta">
          Archive sources checked November 14, 2026.
        </p>
      </details>
    </article>
  );
}
