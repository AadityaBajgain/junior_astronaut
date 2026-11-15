import archive from "../data/sep-archive.json";

type EventRecord = {
  id: string;
  time: string;
  instrument: string;
  source: string;
};
export const historicalEvent: EventRecord = {
  id: archive.sepID,
  time: archive.eventTime,
  instrument: archive.instruments[0].displayName,
  source: archive.link,
};
/** The newest live reading of Sun protons near Earth, from a GOES weather satellite. */
export type ProtonNow = {
  flux: number; // protons with at least 10 MeV, in pfu
  time: string;
  satellite: string;
  scale: 0 | 1 | 2 | 3 | 4 | 5; // NOAA solar radiation storm scale
};
/** NOAA S-scale: S1 starts at 10 pfu and each level is ten times the last. */
export function stormScale(flux: number): ProtonNow["scale"] {
  const level = flux < 10 ? 0 : Math.floor(Math.log10(flux));
  return Math.min(5, Math.max(0, level)) as ProtonNow["scale"];
}
/** Picks the newest valid >=10 MeV reading. Old, future or malformed rows give null. */
export function classifyProtons(raw: unknown, date: Date): ProtonNow | null {
  if (!Array.isArray(raw)) return null;
  let best: ProtonNow | null = null;
  for (const row of raw) {
    if (
      !row ||
      row.energy !== ">=10 MeV" ||
      typeof row.flux !== "number" ||
      !Number.isFinite(row.flux) ||
      row.flux < 0 ||
      typeof row.time_tag !== "string" ||
      !Number.isInteger(row.satellite)
    )
      continue;
    const stamp = Date.parse(row.time_tag);
    const age = date.getTime() - stamp;
    // A reading older than three hours is no longer "now".
    if (!Number.isFinite(stamp) || age < -5 * 60_000 || age > 3 * 3600_000)
      continue;
    if (!best || stamp > Date.parse(best.time))
      best = {
        flux: row.flux,
        time: new Date(stamp).toISOString(),
        satellite: "GOES-" + row.satellite,
        scale: stormScale(row.flux),
      };
  }
  return best;
}
export type WeatherReport = {
  now?: ProtonNow | null;
  kind: "archive" | "catalog" | "empty";
  from: string;
  to: string;
  checkedAt: string;
  event: EventRecord;
};
export function windowFor(date: Date) {
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - 29);
  return {
    from: start.toISOString().slice(0, 10),
    to: date.toISOString().slice(0, 10),
  };
}
export function classifyReport(raw: unknown, date: Date): WeatherReport {
  const base = { ...windowFor(date), checkedAt: date.toISOString() };
  if (!Array.isArray(raw))
    return { ...base, kind: "archive", event: historicalEvent };
  if (!raw.length) return { ...base, kind: "empty", event: historicalEvent };
  const events: EventRecord[] = [];
  for (const e of raw) {
    if (
      !e ||
      typeof e.sepID !== "string" ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d-SEP-\d+$/.test(e.sepID) ||
      typeof e.eventTime !== "string" ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d)?Z$/.test(e.eventTime) ||
      typeof e.link !== "string" ||
      !/^https:\/\/(?:kauai\.)?ccmc\.gsfc\.nasa\.gov\/DONKI\/view\/SEP\/\d+\/-?\d+$/.test(
        e.link,
      ) ||
      !Array.isArray(e.instruments)
    )
      continue;
    const stamp = Date.parse(e.eventTime);
    if (
      !Number.isFinite(stamp) ||
      new Date(stamp).toISOString().slice(0, 16) !== e.eventTime.slice(0, 16) ||
      e.eventTime.slice(0, 10) < base.from ||
      e.eventTime.slice(0, 10) > base.to ||
      stamp > date.getTime() ||
      !e.sepID.startsWith(e.eventTime.slice(0, 16))
    )
      continue;
    // Model-only alerts are forecasts. Choose a record that names an observing instrument.
    const instrument = e.instruments.find(
      (i: { displayName?: unknown } | null) =>
        typeof i?.displayName === "string" &&
        i.displayName.trim().length > 2 &&
        !/model|forecast|prediction/i.test(i.displayName),
    );
    if (instrument)
      events.push({
        id: e.sepID,
        time: e.eventTime,
        instrument: instrument.displayName.trim(),
        source: e.link,
      });
  }
  events.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
  return events.length
    ? { ...base, kind: "catalog", event: events[0] }
    : { ...base, kind: "archive", event: historicalEvent };
}
