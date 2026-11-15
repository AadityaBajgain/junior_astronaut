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
export type WeatherReport = {
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
