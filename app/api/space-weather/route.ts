import {
  classifyProtons,
  classifyReport,
  windowFor,
  type WeatherReport,
} from "../../../game/space-weather";

export const dynamic = "force-dynamic";
let cache: { until: number; report: WeatherReport } | undefined;
let inFlight: Promise<WeatherReport> | undefined;

async function readCatalog(now: Date): Promise<WeatherReport> {
  const { from, to } = windowFor(now);
  const url = new URL("https://ccmc.gsfc.nasa.gov/DONKI/WS/get/SEP");
  url.search = new URLSearchParams({ startDate: from, endDate: to }).toString();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4500),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Catalog unavailable");
    return classifyReport(await res.json(), now);
  } catch {
    return classifyReport(null, now);
  }
}
// Live proton flux from the primary GOES satellite, published by NOAA SWPC.
async function readProtons(now: Date) {
  try {
    const res = await fetch(
      "https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json",
      { signal: AbortSignal.timeout(4500), cache: "no-store" },
    );
    if (!res.ok) throw new Error("Feed unavailable");
    return classifyProtons(await res.json(), now);
  } catch {
    return null;
  }
}
export async function GET() {
  const now = new Date();
  if (!cache || cache.until <= now.getTime()) {
    inFlight ??= Promise.all([readCatalog(now), readProtons(now)])
      .then(([report, live]) => ({ ...report, now: live }))
      .finally(() => {
        inFlight = undefined;
      });
    const report = await inFlight;
    cache = {
      // The live reading changes every five minutes.
      until: now.getTime() + (report.kind === "archive" ? 60_000 : 5 * 60_000),
      report,
    };
  }
  return Response.json(cache.report, {
    // Vercel's edge keeps a reading for five minutes, the pace of the satellite feed,
    // so most visitors never wake the function or NASA's servers.
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
