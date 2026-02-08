/* global fetch, console, process */

import fs from "node:fs/promises";

const RATE_COSD = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
  .toISOString()
  .slice(0, 10);

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

  const lowest = entries[0];
  const highest = entries[entries.length - 1];
  const spreadBps = Math.round((highest.rate - lowest.rate) * 100);

  return {
    available: entries,
    lowest,
    highest,
    spreadBps,
  };
};

const run = async () => {
  const results = await Promise.all(SERIES_CONFIG.map((config) => fetchRateWithAliases(config)));
  const data = Object.assign({}, ...results);

  if (!Object.keys(data).length) {
    throw new Error("No rate series could be fetched from FRED.");
  }

  const now = new Date();
  const payload = {
    version: 2,
    fetchedAt: now.getTime(),
    fetchedAtIso: now.toISOString(),
    source: "FRED",
    data,
    summary: {
      bestRates: buildBestRatesSummary(data),
    },
  };

  await fs.mkdir("public", { recursive: true });
  await fs.writeFile("public/rates.json", JSON.stringify(payload, null, 2));

  const available = payload.summary.bestRates.available
    .map((entry) => `${entry.bucket}:${entry.rate.toFixed(2)}%`)
    .join(", ");
  console.log(`Wrote public/rates.json (${available})`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
