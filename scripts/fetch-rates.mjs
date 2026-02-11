/* global fetch, console, process */

import fs from "node:fs/promises";

const RATE_COSD = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
  .toISOString()
  .slice(0, 10);
const RATE_STALE_DAYS = 35;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const SERIES_CONFIG = [
  {
    id: "MORTGAGE30US",
    label: "Freddie Mac 30Y fixed (PMMS via FRED)",
    aliases: [],
    bucket: "30Y fixed",
  },
  {
    id: "MORTGAGE15US",
    label: "Freddie Mac 15Y fixed (PMMS via FRED)",
    aliases: [],
    bucket: "15Y fixed",
  },
  {
    id: "MORTGAGE5US",
    label: "Freddie Mac 5/1 ARM (PMMS via FRED)",
    aliases: ["MORTGAGEARMSUS"],
    bucket: "5/1 ARM",
  },
];

const parseFredCsv = (text) => {
  const lines = text.trim().split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const [date, value] = lines[i].split(",");
    if (!value || value === ".") continue;
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) continue;
    return { date, rate: parsed };
  }
  return null;
};

const fetchSeries = async (seriesId) => {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&cosd=${RATE_COSD}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FRED ${seriesId} -> HTTP ${response.status}`);
  }
  const text = await response.text();
  const parsed = parseFredCsv(text);
  if (!parsed) throw new Error(`FRED ${seriesId} has no parsable rows`);
  return parsed;
};

const fetchRateWithAliases = async (config) => {
  const candidates = [config.id, ...config.aliases];
  const results = [];
  for (const seriesId of candidates) {
    try {
      const parsed = await fetchSeries(seriesId);
      results.push({ ...parsed, sourceSeriesId: seriesId });
    } catch {
      // Try next alias until one succeeds.
    }
  }
  if (!results.length) return {};

  results.sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
  const best = results[0];

  return {
    [config.id]: {
      ...best,
      label: config.label,
      bucket: config.bucket,
    },
  };
};

const buildBestRatesSummary = (data) => {
  const entries = Object.entries(data)
    .filter(([, value]) => Number.isFinite(value?.rate))
    .map(([id, value]) => ({
      id,
      label: value.label,
      bucket: value.bucket,
      rate: value.rate,
      date: value.date,
      isStale: value.isStale ?? false,
      staleDays: Number.isFinite(value.staleDays) ? value.staleDays : null,
    }))
    .sort((a, b) => a.rate - b.rate);

  if (!entries.length) {
    return {
      available: [],
      lowest: null,
      highest: null,
      spreadBps: null,
    };
  }

  const freshEntries = entries.filter((entry) => !entry.isStale);
  const available = freshEntries.length ? freshEntries : entries;
  const lowest = available[0];
  const highest = available[available.length - 1];
  const spreadBps = Math.round((highest.rate - lowest.rate) * 100);

  return {
    available,
    lowest,
    highest,
    spreadBps,
  };
};

const parseSeriesDateToUtc = (value) => {
  if (!value || typeof value !== "string") return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const staleDaysFromDate = (value, nowTs) => {
  const dateTs = parseSeriesDateToUtc(value);
  if (!Number.isFinite(dateTs)) return null;
  return Math.max(0, Math.floor((nowTs - dateTs) / MS_PER_DAY));
};

const latestSeriesDate = (entries) => {
  let bestTs = null;
  let bestDate = null;
  for (const entry of entries) {
    const ts = parseSeriesDateToUtc(entry?.date);
    if (!Number.isFinite(ts)) continue;
    if (bestTs === null || ts > bestTs) {
      bestTs = ts;
      bestDate = entry.date;
    }
  }
  return bestDate;
};

const run = async () => {
  const results = await Promise.all(SERIES_CONFIG.map((config) => fetchRateWithAliases(config)));
  const data = Object.assign({}, ...results);

  if (!Object.keys(data).length) {
    throw new Error("No rate series could be fetched from FRED.");
  }

  const nowTs = Date.now();
  for (const value of Object.values(data)) {
    const staleDays = staleDaysFromDate(value.date, nowTs);
    value.staleDays = staleDays;
    value.isStale = !Number.isFinite(staleDays) || staleDays > RATE_STALE_DAYS;
  }

  const freshEntries = Object.values(data).filter((value) => !value.isStale);
  const fetchedDate =
    latestSeriesDate(freshEntries) || latestSeriesDate(Object.values(data)) || new Date(nowTs).toISOString().slice(0, 10);
  const fetchedAt = parseSeriesDateToUtc(fetchedDate) ?? nowTs;

  const payload = {
    version: 3,
    fetchedAt,
    fetchedAtIso: new Date(fetchedAt).toISOString(),
    source: "FRED",
    data,
    summary: {
      bestRates: buildBestRatesSummary(data),
    },
  };

  await fs.mkdir("public", { recursive: true });
  await fs.writeFile("public/rates.json", JSON.stringify(payload, null, 2));

  const available = payload.summary.bestRates.available
    .map((entry) => `${entry.bucket}:${entry.rate.toFixed(2)}%${entry.isStale ? " (stale)" : ""}`)
    .join(", ");
  console.log(`Wrote public/rates.json (${payload.fetchedAtIso.slice(0, 10)} | ${available})`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
