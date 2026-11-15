import {
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
export async function GET() {
  const now = new Date();
  if (!cache || cache.until <= now.getTime()) {
    inFlight ??= readCatalog(now).finally(() => {
      inFlight = undefined;
    });
    const report = await inFlight;
    cache = {
      until: now.getTime() + (report.kind === "archive" ? 60_000 : 15 * 60_000),
      report,
    };
  }
  return Response.json(cache.report, {
    headers: { "Cache-Control": "no-store" },
  });
}
