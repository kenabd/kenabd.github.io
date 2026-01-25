import fs from "node:fs/promises";

const RATE_COSD = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
  .toISOString()
  .slice(0, 10);

const RATE_SOURCES = {
  MORTGAGE30US: {
    label: "Freddie Mac 30Y fixed (PMMS via FRED)",
    url: "https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US",
  },
  MORTGAGE15US: {
    label: "Freddie Mac 15Y fixed (PMMS via FRED)",
    url: "https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE15US",
  },
  MORTGAGE5US: {
    label: "Freddie Mac 5Y ARM (PMMS via FRED)",
    url: "https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE5US",
  },
};

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

const fetchRate = async (key, source) => {
  const rateUrl = `${source.url}&cosd=${RATE_COSD}`;
  const response = await fetch(rateUrl);
  if (!response.ok) throw new Error(`Failed to fetch ${key}`);
  const text = await response.text();
  const parsed = parseFredCsv(text);
  if (!parsed) throw new Error(`No data for ${key}`);
  return [key, { ...parsed, label: source.label }];
};

const run = async () => {
  const entries = await Promise.all(
    Object.entries(RATE_SOURCES).map(([key, source]) => fetchRate(key, source))
  );
  const payload = {
    fetchedAt: Date.now(),
    data: Object.fromEntries(entries),
  };
  await fs.mkdir("public", { recursive: true });
  await fs.writeFile("public/rates.json", JSON.stringify(payload, null, 2));
  console.log("Wrote public/rates.json");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
