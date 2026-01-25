import { useEffect, useMemo, useState } from "react";
import { Calculator, FileDown, Home, Moon, RotateCcw, Sun, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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
};
const RATE_CACHE_KEY = "calculator.rateCache.v1";
const RATE_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const hasRateData = (data) => data && Object.keys(data).length > 0;
const PMI_RATE_DEFAULT = 0.006;

const LOAN_TYPES = [
  {
    id: "conventional-30",
    label: "Conventional 30-year fixed",
    rateSeries: "MORTGAGE30US",
    amortizationYears: 30,
    rateAdjust: 0,
  },
  {
    id: "conventional-15",
    label: "Conventional 15-year fixed",
    rateSeries: "MORTGAGE15US",
    amortizationYears: 15,
    rateAdjust: 0,
  },
  {
    id: "arm-5-1",
    label: "ARM 5/1 (30-year amortization)",
    rateSeries: "MORTGAGE5US",
    amortizationYears: 30,
    rateAdjust: 0,
  },
  {
    id: "fha-30",
    label: "FHA 30-year fixed",
    rateSeries: "MORTGAGE30US",
    amortizationYears: 30,
    rateAdjust: -0.15,
  },
  {
    id: "va-30",
    label: "VA 30-year fixed",
    rateSeries: "MORTGAGE30US",
    amortizationYears: 30,
    rateAdjust: -0.2,
  },
  {
    id: "usda-30",
    label: "USDA 30-year fixed",
    rateSeries: "MORTGAGE30US",
    amortizationYears: 30,
    rateAdjust: -0.1,
  },
  {
    id: "jumbo-30",
    label: "Jumbo 30-year fixed",
    rateSeries: "MORTGAGE30US",
    amortizationYears: 30,
    rateAdjust: 0.25,
  },
];

const CREDIT_SCORE_BUCKETS = [
  { id: "760plus", label: "760+", adjust: 0 },
  { id: "740-759", label: "740-759", adjust: 0.125 },
  { id: "720-739", label: "720-739", adjust: 0.25 },
  { id: "700-719", label: "700-719", adjust: 0.375 },
  { id: "680-699", label: "680-699", adjust: 0.5 },
  { id: "660-679", label: "660-679", adjust: 0.75 },
  { id: "640-659", label: "640-659", adjust: 1.0 },
  { id: "620-639", label: "620-639", adjust: 1.5 },
];

const AFFORD_STRATEGIES = [
  { id: "conservative", label: "Conservative (25% of gross income)", ratio: 0.25 },
  { id: "standard", label: "Standard (28% of gross income)", ratio: 0.28 },
  { id: "stretch", label: "Stretch (33% of gross income)", ratio: 0.33 },
];

const parseNumber = (value) => {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeNumeric = (value) => {
  if (!value) return "";
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, "")}`;
};

const formatMoney = (value) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return "0.00%";
  return `${value.toFixed(2)}%`;
};

const formatRatioPercent = (value) => formatPercent(value * 100);

const monthlyPayment = (principal, annualRate, years = 30) => {
  const n = years * 12;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return principal * ((r * factor) / (factor - 1));
};

const solveRateForBreakEven = ({ balance, currentRate, closingCosts, targetMonths, years = 30 }) => {
  if (balance <= 0 || currentRate <= 0 || closingCosts <= 0 || targetMonths <= 0) return null;
  const currentPayment = monthlyPayment(balance, currentRate, years);
  const requiredSavings = closingCosts / targetMonths;
  const targetPayment = currentPayment - requiredSavings;
  if (targetPayment <= 0) return null;

  let low = 0.1;
  let high = Math.min(currentRate, 15);
  let best = null;
  for (let i = 0; i < 30; i += 1) {
    const mid = (low + high) / 2;
    const midPayment = monthlyPayment(balance, mid, years);
    if (midPayment > targetPayment) {
      high = mid;
    } else {
      best = mid;
      low = mid;
    }
  }
  return best;
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

const parseCensusTaxRate = (rows) => {
  if (!Array.isArray(rows) || rows.length < 2) return null;
  const [header, data] = rows;
  const nameIndex = header.indexOf("NAME");
  const valueIndex = header.indexOf("B25077_001E");
  const taxIndex = header.indexOf("B25103_001E");
  if (valueIndex === -1 || taxIndex === -1) return null;
  const homeValue = Number.parseFloat(data[valueIndex]);
  const annualTax = Number.parseFloat(data[taxIndex]);
  if (!Number.isFinite(homeValue) || !Number.isFinite(annualTax) || homeValue <= 0) return null;
  return {
    name: nameIndex !== -1 ? data[nameIndex] : "ZCTA",
    homeValue,
    annualTax,
    rate: annualTax / homeValue,
  };
};

const buildPdfHtml = (title, sections, options = {}) => {
  const { autoPrint = false } = options;
  const sectionHtml = sections
    .map((section) => {
      if (section.table) {
        return `
        <section>
          <h2>${section.title}</h2>
          ${section.table}
        </section>
      `;
      }

      return `
        <section>
          <h2>${section.title}</h2>
          <dl>
            ${section.items
              .map(
                (item) => `
              <div>
                <dt>${item.label}</dt>
                <dd>${item.value}</dd>
              </div>
            `
              )
              .join("")}
          </dl>
        </section>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: "Manrope", "Segoe UI", Tahoma, sans-serif;
            margin: 48px;
            color: #0f172a;
          }
          .brand {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: #64748b;
          }
          .brand-mark {
            width: 18px;
            height: 18px;
            border-radius: 6px;
            background: #1e3a8a;
          }
          h1 {
            font-family: "Fraunces", "Times New Roman", serif;
            font-size: 28px;
            margin-bottom: 8px;
          }
          p {
            margin: 0 0 24px 0;
            color: #475569;
          }
          section {
            margin-bottom: 24px;
            padding: 16px 20px;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          h2 {
            margin: 0 0 12px 0;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #1e293b;
          }
          dl {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px 20px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          dl > div {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          th,
          td {
            text-align: left;
            padding: 8px 6px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }
          th {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #475569;
            background: #f8fafc;
          }
          .print-btn {
            margin: 16px 0 24px;
            padding: 10px 14px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: #0f172a;
            color: #fff;
            font-size: 12px;
            cursor: pointer;
          }
          dt {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 4px;
          }
          dd {
            margin: 0;
            font-size: 15px;
            color: #0f172a;
          }
          @media print {
            body { margin: 24px; }
            .print-btn { display: none; }
          }
          @page {
            margin: 24px;
          }
        </style>
        ${autoPrint ? `<script>window.addEventListener("load", () => setTimeout(() => window.print(), 300));</script>` : ""}
      </head>
      <body>
        <div class="brand">
          <span class="brand-mark"></span>
          Home Affordability Calculator
        </div>
        <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
        <h1>${title}</h1>
        <p>
          Assessment summary generated by Home Affordability Calculator on
          ${new Date().toLocaleDateString("en-US")}.
        </p>
        <p>
          These figures are estimates based on the inputs provided, benchmark rates, and ZIP-level property tax
          estimates from U.S. Census ACS data. PMI is estimated when LTV is above 80%.
        </p>
        <p><strong>Not a quote:</strong> This report is for planning only and does not constitute a lender offer.</p>
        ${sectionHtml}
      </body>
    </html>
  `;
};

const openPdfExport = (title, sections) => {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const html = buildPdfHtml(title, sections, { autoPrint: !isMobile });
  const printWindow = window.open("", "_blank");

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    return;
  }

  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.srcdoc = html;
  document.body.appendChild(frame);

  frame.onload = () => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => {
      frame.remove();
    }, 500);
  };
};

const selectClassName =
  "h-9 w-full rounded-md border border-border bg-background/70 px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export default function CalculatorPage() {
  const [affordInputs, setAffordInputs] = useState({
    annualIncome: "",
    expenses: "",
    downPayment: "",
    closingCosts: "",
    closingCostRate: "",
    hoaAnnual: "",
    zipCode: "",
    rate: "",
  });

  const [refiInputs, setRefiInputs] = useState({
    balance: "",
    currentRate: "",
    newRate: "",
    closingCosts: "",
    targetMonths: "",
  });

  const [loanTypeId, setLoanTypeId] = useState("conventional-30");
  const [rateMode, setRateMode] = useState("live");
  const [creditScoreId, setCreditScoreId] = useState("760plus");
  const [refiLoanTypeId, setRefiLoanTypeId] = useState("conventional-30");
  const [refiRateMode, setRefiRateMode] = useState("live");
  const [refiCreditScoreId, setRefiCreditScoreId] = useState("760plus");
  const [strategyIndex, setStrategyIndex] = useState(1);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [insuranceOverride, setInsuranceOverride] = useState("");
  const [pmiRateOverride, setPmiRateOverride] = useState("");
  const [taxRateOverride, setTaxRateOverride] = useState("");
  const [rateData, setRateData] = useState({});
  const [rateStatus, setRateStatus] = useState("idle");
  const [taxStatus, setTaxStatus] = useState("idle");
  const [taxRate, setTaxRate] = useState(0);
  const [taxMeta, setTaxMeta] = useState(null);
  const [activeCalc, setActiveCalc] = useState("afford");
  const [resetTick, setResetTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const selectedLoanType = useMemo(
    () => LOAN_TYPES.find((loan) => loan.id === loanTypeId) ?? LOAN_TYPES[0],
    [loanTypeId]
  );
  const selectedRefiLoanType = useMemo(
    () => LOAN_TYPES.find((loan) => loan.id === refiLoanTypeId) ?? LOAN_TYPES[0],
    [refiLoanTypeId]
  );
  const selectedStrategy = useMemo(
    () => AFFORD_STRATEGIES[Math.min(Math.max(strategyIndex, 0), AFFORD_STRATEGIES.length - 1)],
    [strategyIndex]
  );
  const selectedScore = useMemo(
    () => CREDIT_SCORE_BUCKETS.find((bucket) => bucket.id === creditScoreId) ?? CREDIT_SCORE_BUCKETS[0],
    [creditScoreId]
  );
  const selectedRefiScore = useMemo(
    () => CREDIT_SCORE_BUCKETS.find((bucket) => bucket.id === refiCreditScoreId) ?? CREDIT_SCORE_BUCKETS[0],
    [refiCreditScoreId]
  );

  useEffect(() => {
    try {
      const storedAfford = JSON.parse(localStorage.getItem("calculator.affordInputs") || "{}");
      const storedRefi = JSON.parse(localStorage.getItem("calculator.refiInputs") || "{}");
      const storedSettings = JSON.parse(localStorage.getItem("calculator.settings") || "{}");
      if (storedAfford && typeof storedAfford === "object") {
        setAffordInputs((prev) => ({ ...prev, ...storedAfford }));
      }
      if (storedRefi && typeof storedRefi === "object") {
        setRefiInputs((prev) => ({ ...prev, ...storedRefi }));
      }
      if (storedSettings && typeof storedSettings === "object") {
        if (storedSettings.activeCalc) setActiveCalc(storedSettings.activeCalc);
        if (storedSettings.loanTypeId) setLoanTypeId(storedSettings.loanTypeId);
        if (storedSettings.rateMode) setRateMode(storedSettings.rateMode);
        if (storedSettings.creditScoreId) setCreditScoreId(storedSettings.creditScoreId);
        if (storedSettings.refiLoanTypeId) setRefiLoanTypeId(storedSettings.refiLoanTypeId);
        if (storedSettings.refiRateMode) setRefiRateMode(storedSettings.refiRateMode);
        if (storedSettings.refiCreditScoreId) setRefiCreditScoreId(storedSettings.refiCreditScoreId);
        if (Number.isFinite(storedSettings.strategyIndex)) setStrategyIndex(storedSettings.strategyIndex);
        if (typeof storedSettings.showAssumptions === "boolean")
          setShowAssumptions(storedSettings.showAssumptions);
        if (typeof storedSettings.insuranceOverride === "string")
          setInsuranceOverride(storedSettings.insuranceOverride);
        if (typeof storedSettings.pmiRateOverride === "string")
          setPmiRateOverride(storedSettings.pmiRateOverride);
        if (typeof storedSettings.taxRateOverride === "string")
          setTaxRateOverride(storedSettings.taxRateOverride);
      }
    } catch (error) {
      // Ignore storage parse issues.
    } finally {
      setHydrated(true);
    }

    const loadServerCache = async () => {
      try {
        const response = await fetch("/rates.json");
        if (!response.ok) return false;
        const payload = await response.json();
        if (!hasRateData(payload?.data)) return false;
        setRateData(payload.data);
        setRateStatus("ready");
        localStorage.setItem(
          RATE_CACHE_KEY,
          JSON.stringify({ fetchedAt: Date.now(), data: payload.data })
        );
        return true;
      } catch (error) {
        return false;
      }
    };

    const fetchRates = async () => {
      setRateStatus("loading");
      let hasLocalCache = false;
      try {
        const cachedPayload = JSON.parse(localStorage.getItem(RATE_CACHE_KEY) || "null");
        if (
          cachedPayload &&
          hasRateData(cachedPayload.data) &&
          typeof cachedPayload.fetchedAt === "number" &&
          Date.now() - cachedPayload.fetchedAt < RATE_CACHE_TTL_MS
        ) {
          setRateData(cachedPayload.data);
          setRateStatus("ready");
          hasLocalCache = true;
        }
      } catch (error) {
        hasLocalCache = false;
      }

      const hasServerCache = await loadServerCache();
      if (hasServerCache || hasLocalCache) return;

      try {
        const entries = await Promise.all(
          Object.entries(RATE_SOURCES).map(async ([key, source]) => {
            const rateUrl = `${source.url}&cosd=${RATE_COSD}`;
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rateUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`Failed to fetch ${key}`);
            const text = await response.text();
            const parsed = parseFredCsv(text);
            if (!parsed) throw new Error(`No data for ${key}`);
            return [key, { ...parsed, label: source.label }];
          })
        );
        const nextData = Object.fromEntries(entries);
        setRateData(nextData);
        setRateStatus("ready");
        localStorage.setItem(
          RATE_CACHE_KEY,
          JSON.stringify({ fetchedAt: Date.now(), data: nextData })
        );
      } catch (error) {
        setRateStatus("error");
      }
    };

    fetchRates();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    if (!hydrated) return;
    const settings = {
      activeCalc,
      loanTypeId,
      rateMode,
      creditScoreId,
      refiLoanTypeId,
      refiRateMode,
      refiCreditScoreId,
      strategyIndex,
      showAssumptions,
      insuranceOverride,
      pmiRateOverride,
      taxRateOverride,
    };
    localStorage.setItem("calculator.affordInputs", JSON.stringify(affordInputs));
    localStorage.setItem("calculator.refiInputs", JSON.stringify(refiInputs));
    localStorage.setItem("calculator.settings", JSON.stringify(settings));
  }, [
    hydrated,
    affordInputs,
    refiInputs,
    activeCalc,
    loanTypeId,
    rateMode,
    creditScoreId,
    refiLoanTypeId,
    refiRateMode,
    refiCreditScoreId,
    strategyIndex,
    showAssumptions,
    insuranceOverride,
    pmiRateOverride,
    taxRateOverride,
  ]);

  useEffect(() => {
    const zip = affordInputs.zipCode.trim();
    if (zip.length !== 5) {
      setTaxStatus("idle");
      setTaxRate(0);
      setTaxMeta(null);
      return;
    }

    const fetchTaxRate = async () => {
      setTaxStatus("loading");
      try {
        const url =
          `https://api.census.gov/data/2022/acs/acs5?get=NAME,B25077_001E,B25103_001E&for=zip%20code%20tabulation%20area:${zip}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Tax fetch failed");
        const data = await response.json();
        const parsed = parseCensusTaxRate(data);
        if (!parsed) throw new Error("Tax parse failed");
        setTaxRate(parsed.rate);
        setTaxMeta({ name: parsed.name, year: "2022 ACS 5-year" });
        setTaxStatus("ready");
      } catch (error) {
        setTaxStatus("error");
        setTaxRate(0);
        setTaxMeta(null);
      }
    };

    fetchTaxRate();
  }, [affordInputs.zipCode]);

  const resolvedRate = useMemo(() => {
    const manualRate = parseNumber(affordInputs.rate);
    const baseRate = rateData[selectedLoanType.rateSeries]?.rate ?? manualRate;
    const loanAdjust = selectedLoanType.rateAdjust;
    const scoreAdjust = rateMode === "credit" ? selectedScore.adjust : 0;

    if (rateMode === "manual") {
      return { rate: manualRate, baseRate: manualRate, loanAdjust: 0, scoreAdjust: 0 };
    }

    const rate = baseRate + loanAdjust + scoreAdjust;
    return { rate, baseRate, loanAdjust, scoreAdjust };
  }, [affordInputs.rate, rateData, rateMode, selectedLoanType, selectedScore]);

  const resolveRateForLoan = (loan) => {
    const manualRate = parseNumber(affordInputs.rate);
    const baseRate =
      rateMode === "manual" ? manualRate : rateData[loan.rateSeries]?.rate ?? manualRate;
    const scoreAdjust = rateMode === "credit" ? selectedScore.adjust : 0;
    const rate = baseRate + loan.rateAdjust + scoreAdjust;
    return { rate, baseRate, scoreAdjust };
  };

  const resolveRefiRate = () => {
    const manualRate = parseNumber(refiInputs.newRate);
    const baseRate =
      refiRateMode === "manual"
        ? manualRate
        : rateData[selectedRefiLoanType.rateSeries]?.rate ?? manualRate;
    const scoreAdjust = refiRateMode === "credit" ? selectedRefiScore.adjust : 0;
    const rate = baseRate + selectedRefiLoanType.rateAdjust + scoreAdjust;
    return { rate, baseRate, scoreAdjust };
  };

  const loanOptions = useMemo(() => {
    const annualIncome = parseNumber(affordInputs.annualIncome);
    const expenses = parseNumber(affordInputs.expenses);
    const downPayment = parseNumber(affordInputs.downPayment);
    const closingCosts = parseNumber(affordInputs.closingCosts);
    const hoaMonthly = parseNumber(affordInputs.hoaAnnual) / 12;
    const grossMonthly = annualIncome / 12;
    const maxHousingBudget = Math.max(0, grossMonthly * selectedStrategy.ratio - expenses);
    const insuranceMonthly = 120;
    const pmiRateOverrideValue = parseNumber(pmiRateOverride);
    const pmiAnnualRate =
      pmiRateOverrideValue > 0 ? pmiRateOverrideValue / 100 : PMI_RATE_DEFAULT;

    return LOAN_TYPES.map((loan) => {
      const { rate } = resolveRateForLoan(loan);
      const loanPaymentFactor = monthlyPayment(1, rate, loan.amortizationYears) || 1;
      const basePrincipal = Math.max(0, maxHousingBudget - insuranceMonthly - hoaMonthly);
      const baseLoanAmount = basePrincipal > 0 ? basePrincipal / loanPaymentFactor : 0;
      const baseHomePrice = baseLoanAmount + downPayment;
      const propertyTaxMonthly = taxRate > 0 ? (baseHomePrice * taxRate) / 12 : 0;
      const principalPayment = Math.max(
        0,
        maxHousingBudget - insuranceMonthly - hoaMonthly - propertyTaxMonthly
      );
      const loanAmount = principalPayment > 0 ? principalPayment / loanPaymentFactor : 0;
      const homePrice = loanAmount + downPayment;
      const ltv = homePrice > 0 ? loanAmount / homePrice : 0;
      const pmiMonthly = ltv > 0.8 ? (loanAmount * pmiAnnualRate) / 12 : 0;
      const monthlyPI = monthlyPayment(loanAmount, rate, loan.amortizationYears);
      const totalMonthly = monthlyPI + insuranceMonthly + pmiMonthly + hoaMonthly + propertyTaxMonthly;
      const termMonths = loan.amortizationYears * 12;
      const totalInterest = monthlyPI * termMonths - loanAmount;

      return {
        id: loan.id,
        label: loan.label,
        rate,
        loanAmount,
        homePrice,
        pmiMonthly,
        monthlyPI,
        totalMonthly,
        totalInterest,
        closingCosts,
      };
    });
  }, [
    affordInputs.annualIncome,
    affordInputs.expenses,
    affordInputs.downPayment,
    affordInputs.closingCosts,
    affordInputs.hoaAnnual,
    affordInputs.rate,
    rateData,
    rateMode,
    selectedScore,
    selectedStrategy,
    taxRate,
    pmiRateOverride,
  ]);

  const affordability = useMemo(() => {
    const annualIncome = parseNumber(affordInputs.annualIncome);
    const expenses = parseNumber(affordInputs.expenses);
    const downPayment = parseNumber(affordInputs.downPayment);
    const closingCostsInput = parseNumber(affordInputs.closingCosts);
    const closingCostRateInput = parseNumber(affordInputs.closingCostRate) / 100;
    const hoaAnnual = parseNumber(affordInputs.hoaAnnual);
    const rate = resolvedRate.rate;

    const grossMonthly = annualIncome / 12;
    const maxHousingBudget = Math.max(0, grossMonthly * selectedStrategy.ratio - expenses);
    const hoaMonthly = hoaAnnual / 12;
    const insuranceMonthlyDefault = 120;
    const insuranceMonthly =
      insuranceOverride !== "" ? parseNumber(insuranceOverride) : insuranceMonthlyDefault;
    const pmiRateOverrideValue = parseNumber(pmiRateOverride);
    const pmiAnnualRate =
      pmiRateOverrideValue > 0 ? pmiRateOverrideValue / 100 : PMI_RATE_DEFAULT;
    const loanPaymentFactor = monthlyPayment(1, rate, selectedLoanType.amortizationYears) || 1;
    const basePrincipal = Math.max(0, maxHousingBudget - insuranceMonthly - hoaMonthly);
    const baseLoanAmount = basePrincipal > 0 ? basePrincipal / loanPaymentFactor : 0;
    const baseHomePrice = baseLoanAmount + downPayment;
    const overrideTaxRate = parseNumber(taxRateOverride) / 100;
    const taxRateUsed = overrideTaxRate > 0 ? overrideTaxRate : taxRate;
    const propertyTaxMonthly = taxRateUsed > 0 ? (baseHomePrice * taxRateUsed) / 12 : 0;
    const principalPaymentPre = Math.max(
      0,
      maxHousingBudget - insuranceMonthly - hoaMonthly - propertyTaxMonthly
    );
    const loanAmountPre = principalPaymentPre > 0 ? principalPaymentPre / loanPaymentFactor : 0;
    const homePricePre = loanAmountPre + downPayment;
    const ltvPre = homePricePre > 0 ? loanAmountPre / homePricePre : 0;
    const pmiMonthlyPre = ltvPre > 0.8 ? (loanAmountPre * pmiAnnualRate) / 12 : 0;
    const principalPayment = Math.max(
      0,
      maxHousingBudget - insuranceMonthly - hoaMonthly - propertyTaxMonthly - pmiMonthlyPre
    );
    const loanAmount = principalPayment > 0 ? principalPayment / loanPaymentFactor : 0;
    const estimatedHomePrice = loanAmount + downPayment;
    const ltv = estimatedHomePrice > 0 ? loanAmount / estimatedHomePrice : 0;
    const pmiMonthly = ltv > 0.8 ? (loanAmount * pmiAnnualRate) / 12 : 0;
    const closingCostRateDefault = 0.025;
    const closingCostRateUsed = closingCostRateInput || closingCostRateDefault;
    const closingCostsAuto = estimatedHomePrice * closingCostRateUsed;
    const closingCosts =
      closingCostsInput > 0
        ? closingCostsInput
        : closingCostRateInput > 0
        ? closingCostsAuto
        : estimatedHomePrice * closingCostRateDefault;

    const conservative = loanAmount * 0.95 + downPayment;
    const optimistic = loanAmount * 1.05 + downPayment;

    return {
      annualIncome,
      grossMonthly,
      expenses,
      downPayment,
      closingCosts,
      closingCostsAuto,
      closingCostRateUsed,
      hoaAnnual,
      hoaMonthly,
      rate,
      insuranceMonthly,
      insuranceMonthlyDefault,
      pmiMonthly,
      pmiAnnualRate,
      ltv,
      propertyTaxMonthly,
      taxRate: taxRateUsed,
      taxRateSource: overrideTaxRate > 0 ? "override" : "zip",
      estimatedHomePrice,
      maxHousingBudget,
      principalPayment,
      loanAmount,
      conservative,
      optimistic,
    };
  }, [
    affordInputs,
    resolvedRate,
    selectedLoanType,
    selectedStrategy,
    taxRate,
    insuranceOverride,
    pmiRateOverride,
    taxRateOverride,
  ]);

  const refi = useMemo(() => {
    const balance = parseNumber(refiInputs.balance);
    const currentRate = parseNumber(refiInputs.currentRate);
    const targetMonths = parseNumber(refiInputs.targetMonths);
    const resolvedRefi = resolveRefiRate();
    const manualRate = parseNumber(refiInputs.newRate);
    const targetRate = solveRateForBreakEven({
      balance,
      currentRate,
      closingCosts: parseNumber(refiInputs.closingCosts),
      targetMonths,
      years: selectedRefiLoanType.amortizationYears,
    });
    const newRate =
      refiRateMode === "target"
        ? targetRate ?? 0
        : refiRateMode === "manual"
        ? manualRate
        : resolvedRefi.rate;
    const closingCosts = parseNumber(refiInputs.closingCosts);

    const currentPayment = monthlyPayment(balance, currentRate, selectedRefiLoanType.amortizationYears);
    const newPayment =
      refiRateMode === "target" && !targetRate
        ? 0
        : monthlyPayment(balance, newRate, selectedRefiLoanType.amortizationYears);
    const monthlySavings =
      refiRateMode === "target" && !targetRate ? 0 : Math.max(0, currentPayment - newPayment);
    const breakEvenMonths =
      refiRateMode === "target" && !targetRate
        ? 0
        : monthlySavings > 0
        ? Math.ceil(closingCosts / monthlySavings)
        : 0;

    return {
      balance,
      currentRate,
      newRate,
      closingCosts,
      targetMonths,
      targetRate,
      refiRateMode,
      resolvedRefi,
      refiLoanType: selectedRefiLoanType,
      currentPayment,
      newPayment,
      monthlySavings,
      breakEvenMonths,
    };
  }, [refiInputs, selectedRefiLoanType, refiRateMode, selectedRefiScore, rateData]);

  const updateAfford = (key) => (event) => {
    const rawValue = event.target.value;
    const nextValue =
      key === "zipCode"
        ? rawValue.replace(/\D/g, "").slice(0, 5)
        : sanitizeNumeric(rawValue);
    setAffordInputs((prev) => ({ ...prev, [key]: nextValue }));
  };

  const updateRefi = (key) => (event) => {
    setRefiInputs((prev) => ({ ...prev, [key]: sanitizeNumeric(event.target.value) }));
  };

  const exportAffordability = () => {
    const rateSourceSummary =
      rateMode === "manual"
        ? "Manual entry"
        : rateNote
        ? `${rateNote.label} (${rateNote.date})`
        : "Live average";
    const rateSummary =
      rateMode === "credit" ? `${rateSourceSummary} + credit score adjustment` : rateSourceSummary;
    const closingCostsInput = parseNumber(affordInputs.closingCosts);
    const loanTable = `
      <table>
        <thead>
          <tr>
            <th>Loan type</th>
            <th>Rate</th>
            <th>Home price</th>
            <th>Loan amount</th>
            <th>Monthly P&amp;I</th>
            <th>Monthly PMI</th>
            <th>Total monthly</th>
            <th>Total interest</th>
          </tr>
        </thead>
        <tbody>
          ${loanOptions
            .map(
              (option) => `
            <tr>
              <td>${option.label}</td>
              <td>${formatPercent(option.rate)}</td>
              <td>${formatMoney(option.homePrice)}</td>
              <td>${formatMoney(option.loanAmount)}</td>
              <td>${formatMoney(option.monthlyPI)}</td>
              <td>${formatMoney(option.pmiMonthly)}</td>
              <td>${formatMoney(option.totalMonthly)}</td>
              <td>${formatMoney(option.totalInterest)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;

    openPdfExport("Home Affordability Calculator summary", [
      {
        title: "Inputs",
        items: [
          { label: "Annual income (before taxes)", value: formatMoney(affordability.annualIncome) },
          { label: "Monthly expenses", value: formatMoney(affordability.expenses) },
          { label: "Down payment", value: formatMoney(affordability.downPayment) },
          { label: "Closing costs", value: formatMoney(affordability.closingCosts) },
          { label: "HOA (annual)", value: formatMoney(affordability.hoaAnnual) },
          { label: "ZIP code", value: affordInputs.zipCode || "Not provided" },
          {
            label: "Property tax rate (annual)",
            value: affordability.taxRate > 0 ? formatRatioPercent(affordability.taxRate) : "Not available",
          },
          { label: "Loan type", value: selectedLoanType.label },
          { label: "Rate mode", value: rateMode },
          {
            label: "Credit score range",
            value: rateMode === "credit" ? selectedScore.label : "Not used",
          },
          { label: "Estimated rate", value: formatPercent(resolvedRate.rate) },
          { label: "Rate source", value: rateSummary },
        ],
      },
      {
        title: "Assessment",
        items: [
          { label: "Affordability stance", value: selectedStrategy.label },
          {
            label: "Total cash to close",
            value: formatMoney(affordability.downPayment + affordability.closingCosts),
          },
          { label: "Loan term", value: `${selectedLoanType.amortizationYears} years` },
          {
            label: "Closing cost basis",
            value: closingCostsInput > 0 ? "Manual amount" : "Estimated % of price",
          },
        ],
      },
      {
        title: "Assumptions",
        items: [
          { label: "Housing ratio (gross income)", value: selectedStrategy.label },
          { label: "Home insurance (monthly)", value: formatMoney(affordability.insuranceMonthly) },
          {
            label: "PMI (monthly)",
            value: affordability.pmiMonthly > 0 ? formatMoney(affordability.pmiMonthly) : "Not required",
          },
          {
            label: "PMI rate (annual)",
            value:
              affordability.pmiMonthly > 0
                ? formatRatioPercent(affordability.pmiAnnualRate)
                : "Not required",
          },
          {
            label: "Loan-to-value (LTV)",
            value: affordability.ltv > 0 ? formatRatioPercent(affordability.ltv) : "Not available",
          },
          {
            label: "Property tax (monthly)",
            value: formatMoney(affordability.propertyTaxMonthly),
          },
          {
            label: "Property tax rate (annual)",
            value: affordability.taxRate > 0 ? formatRatioPercent(affordability.taxRate) : "Not available",
          },
          { label: "HOA (monthly)", value: formatMoney(affordability.hoaMonthly) },
          {
            label: "Closing cost estimate",
            value: `${formatPercent(affordability.closingCostRateUsed * 100)} of price`,
          },
          { label: "Loan term", value: `${selectedLoanType.amortizationYears} years` },
          {
            label: "Rates as of",
            value: rateNote?.date ? `${rateNote.label} (${rateNote.date})` : "Not available",
          },
        ],
      },
      {
        title: "Results",
        items: [
          { label: "Monthly housing budget", value: formatMoney(affordability.maxHousingBudget) },
          { label: "Principal + interest", value: formatMoney(affordability.principalPayment) },
          { label: "Estimated loan amount", value: formatMoney(affordability.loanAmount) },
          {
            label: "Estimated home price range",
            value: `${formatMoney(affordability.conservative)} - ${formatMoney(affordability.optimistic)}`,
          },
        ],
      },
      {
        title: "Loan option comparison",
        table: loanTable,
      },
    ]);
  };

  const resetCalculator = () => {
    setAffordInputs({
      annualIncome: "",
      expenses: "",
      downPayment: "",
      closingCosts: "",
      closingCostRate: "",
      hoaAnnual: "",
      zipCode: "",
      rate: "",
    });
    setRefiInputs({
      balance: "",
      currentRate: "",
      newRate: "",
      closingCosts: "",
      targetMonths: "",
    });
    setLoanTypeId("conventional-30");
    setRateMode("live");
    setCreditScoreId("760plus");
    setRefiLoanTypeId("conventional-30");
    setRefiRateMode("live");
    setRefiCreditScoreId("760plus");
    setStrategyIndex(1);
    setShowAssumptions(false);
    setInsuranceOverride("");
    setPmiRateOverride("");
    setTaxRateOverride("");
    setActiveCalc("afford");
    setResetTick((prev) => prev + 1);
  };

  const exportRefi = () => {
    const refiRateNote = rateData[selectedRefiLoanType.rateSeries];
    const refiRateSource =
      refiRateMode === "manual"
        ? "Manual entry"
        : refiRateMode === "target"
        ? "Target break-even"
        : refiRateNote
        ? `${refiRateNote.label} (${refiRateNote.date})`
        : "Live average";

    openPdfExport("Home Affordability Calculator refi summary", [
      {
        title: "Inputs",
        items: [
          { label: "Current balance", value: formatMoney(refi.balance) },
          { label: "Current rate", value: formatPercent(refi.currentRate) },
          { label: "New rate", value: formatPercent(refi.newRate) },
          { label: "Closing costs", value: formatMoney(refi.closingCosts) },
          { label: "Refi loan type", value: refi.refiLoanType.label },
          { label: "Rate mode", value: refiRateMode },
          { label: "Rate source", value: refiRateSource },
          {
            label: "Credit score range",
            value: refiRateMode === "credit" ? selectedRefiScore.label : "Not used",
          },
          {
            label: "Target break-even",
            value: refiRateMode === "target" ? `${refi.targetMonths || "Not set"} months` : "Not used",
          },
        ],
      },
      {
        title: "Assessment",
        items: [
          {
            label: "Rate change",
            value: `${formatPercent(refi.currentRate)} -> ${formatPercent(refi.newRate)}`,
          },
          {
            label: "Break-even timeline",
            value: refi.breakEvenMonths > 0 ? `Month ${refi.breakEvenMonths}` : "Not in range",
          },
          {
            label: "Break-even year",
            value: refi.breakEvenMonths > 0 ? `Year ${(refi.breakEvenMonths / 12).toFixed(1)}` : "Not in range",
          },
          { label: "Annual savings", value: formatMoney(refi.monthlySavings * 12) },
        ],
      },
      {
        title: "Payment comparison",
        items: [
          { label: "Current payment", value: formatMoney(refi.currentPayment) },
          { label: "New payment", value: formatMoney(refi.newPayment) },
          { label: "Monthly savings", value: formatMoney(refi.monthlySavings) },
        ],
      },
      {
        title: "Break-even",
        items: [
          {
            label: "Break-even month",
            value: refi.breakEvenMonths > 0 ? `Month ${refi.breakEvenMonths}` : "Not in range",
          },
          { label: "Annual savings", value: formatMoney(refi.monthlySavings * 12) },
        ],
      },
    ]);
  };

  const rateNote = rateData[selectedLoanType.rateSeries];
  const rateNoteLabel =
    rateMode === "manual"
      ? "Using manual rate entry."
      : rateNote
      ? `Base rate from ${rateNote.label} (latest ${rateNote.date}).`
      : "Base rate unavailable.";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-2xl border bg-muted/30 shadow-sm">
              <Calculator className="h-4 w-4" />
            </div>
            <div className="text-sm font-semibold tracking-tight">Home Affordability Calculator</div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setIsDark((prev) => !prev)}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-2">
          <h1 className="font-display text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Try the calculators
          </h1>
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
            Get a clearer picture of what you can afford and when a refi makes sense.
          </p>
          <div className="text-xs text-muted-foreground">
            {rateStatus === "loading"
              ? "Loading Freddie Mac PMMS averages..."
              : rateStatus === "error"
              ? "Freddie Mac PMMS averages unavailable. Using manual inputs instead."
              : rateNoteLabel}
          </div>
        </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full border bg-background/70 p-1">
              <button
                type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCalc === "afford"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveCalc("afford")}
            >
              Affordability
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCalc === "refi"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveCalc("refi")}
            >
              Refi break-even
            </button>
          </div>
          </div>

        <div className="mt-6 grid gap-6">
          {activeCalc === "afford" ? (
          <Card className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Affordability Calculator</CardTitle>
                  <Button
                    variant="ghost"
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={resetCalculator}
                    key={`afford-reset-inline-${resetTick}`}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Start over
                  </Button>
                </div>
                <Home className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Annual income (before taxes)</label>
                  <Input
                    value={affordInputs.annualIncome}
                    onChange={updateAfford("annualIncome")}
                    placeholder="ex 125000"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Monthly expenses</label>
                  <Input
                    value={affordInputs.expenses}
                    onChange={updateAfford("expenses")}
                    placeholder="ex 900"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Down payment</label>
                  <Input
                    value={affordInputs.downPayment}
                    onChange={updateAfford("downPayment")}
                    placeholder="ex 40000"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">HOA (annual)</label>
                  <Input
                    value={affordInputs.hoaAnnual}
                    onChange={updateAfford("hoaAnnual")}
                    placeholder="ex 1800"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">ZIP code (tax estimate)</label>
                  <Input
                    value={affordInputs.zipCode}
                    onChange={updateAfford("zipCode")}
                    placeholder="ex 90210"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Closing costs are estimated at {formatPercent(affordability.closingCostRateUsed * 100)} of price
                unless you override.
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Loan type</label>
                  <select
                    className={selectClassName}
                    value={loanTypeId}
                    onChange={(event) => setLoanTypeId(event.target.value)}
                  >
                    {LOAN_TYPES.map((loan) => (
                      <option key={loan.id} value={loan.id}>
                        {loan.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Affordability stance</label>
                  <div className="flex w-full gap-1 rounded-full border bg-background/70 p-1">
                    {AFFORD_STRATEGIES.map((strategy, index) => (
                      <button
                        key={strategy.id}
                        type="button"
                        onClick={() => setStrategyIndex(index)}
                        className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition ${
                          index === strategyIndex
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {strategy.label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">{selectedStrategy.label}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Rate source</label>
                  <select
                    className={selectClassName}
                    value={rateMode}
                    onChange={(event) => setRateMode(event.target.value)}
                  >
                    <option value="live">Live average</option>
                    <option value="credit">Credit score estimate</option>
                    <option value="manual">Manual entry</option>
                  </select>
                </div>
                {rateMode === "credit" ? (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Credit score range</label>
                    <select
                      className={selectClassName}
                      value={creditScoreId}
                      onChange={(event) => setCreditScoreId(event.target.value)}
                    >
                      {CREDIT_SCORE_BUCKETS.map((bucket) => (
                        <option key={bucket.id} value={bucket.id}>
                          {bucket.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Interest rate</label>
                    <Input
                      value={
                        rateMode === "manual"
                          ? affordInputs.rate
                          : Number.isFinite(resolvedRate.rate)
                          ? resolvedRate.rate.toFixed(2)
                          : ""
                      }
                      onChange={updateAfford("rate")}
                      placeholder={rateNote ? `ex ${rateNote.rate.toFixed(2)}` : "ex 6.5"}
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      disabled={rateMode !== "manual"}
                    />
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Credit score estimates are directional and not a lender quote. Base rates come from Freddie Mac
                PMMS averages via FRED.
              </div>
              <div className="rounded-2xl border bg-background/70 px-4 py-3 text-sm">
                <button
                  type="button"
                  className="w-full text-left text-sm font-medium text-foreground"
                  onClick={() => setShowAssumptions((prev) => !prev)}
                >
                  {showAssumptions ? "Hide overrides" : "Customize assumptions"}
                </button>
                {showAssumptions ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-xs text-muted-foreground">
                        Home insurance (monthly, default {formatMoney(affordability.insuranceMonthlyDefault)})
                      </label>
                      <Input
                        value={insuranceOverride}
                        onChange={(event) => setInsuranceOverride(sanitizeNumeric(event.target.value))}
                        placeholder="ex 120"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs text-muted-foreground">
                        PMI rate (annual %, default {(PMI_RATE_DEFAULT * 100).toFixed(2)}%)
                      </label>
                      <Input
                        value={pmiRateOverride}
                        onChange={(event) => setPmiRateOverride(sanitizeNumeric(event.target.value))}
                        placeholder="ex 0.6"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs text-muted-foreground">Property tax rate (annual %)</label>
                      <Input
                        value={taxRateOverride}
                        onChange={(event) => setTaxRateOverride(sanitizeNumeric(event.target.value))}
                        placeholder="ex 1.10"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs text-muted-foreground">Closing cost rate (%)</label>
                      <Input
                        value={affordInputs.closingCostRate}
                        onChange={updateAfford("closingCostRate")}
                        placeholder="ex 2.5"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs text-muted-foreground">Closing costs (override amount)</label>
                      <Input
                        value={affordInputs.closingCosts}
                        onChange={updateAfford("closingCosts")}
                        placeholder="ex 8500"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground sm:col-span-2">
                      Overrides are optional. If you enter a closing cost amount, it wins over the rate estimate.
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground">
                {affordInputs.zipCode.length === 5
                  ? taxStatus === "loading"
                    ? "Loading ZIP-level property tax estimate..."
                    : taxStatus === "ready" && taxMeta
                    ? `Property tax rate based on ${taxMeta.name} (${taxMeta.year}).`
                    : "Property tax estimate unavailable for this ZIP."
                  : "Enter ZIP code to include a local property tax estimate."}
              </div>

              <div className="rounded-2xl border bg-muted/10 p-4">
                <div className="text-xs text-muted-foreground">Estimate (not a quote)</div>
                <div className="mt-2 text-2xl font-semibold">
                  {formatMoney(affordability.conservative)} - {formatMoney(affordability.optimistic)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Estimated housing budget: {formatMoney(affordability.maxHousingBudget)} / month
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Estimated cash to close:{" "}
                  {formatMoney(affordability.downPayment + affordability.closingCosts)}
                </div>
              </div>

                <div className="rounded-2xl border bg-background/70 p-4 text-sm text-muted-foreground">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Breakdown
                </div>
                <div className="mt-3 grid gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <span>Housing budget (gross)</span>
                    <span>
                      {formatMoney(affordability.grossMonthly)} x {selectedStrategy.ratio} -{" "}
                      {formatMoney(affordability.expenses)} = {formatMoney(affordability.maxHousingBudget)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Home insurance (monthly)</span>
                    <span>{formatMoney(affordability.insuranceMonthly)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>PMI (monthly)</span>
                    <span>
                      {affordability.pmiMonthly > 0
                        ? `${formatMoney(affordability.pmiMonthly)} (${formatRatioPercent(
                            affordability.pmiAnnualRate
                          )} on ${formatMoney(affordability.loanAmount)}, LTV ${formatRatioPercent(
                            affordability.ltv
                          )})`
                        : "Not required (LTV <= 80%)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Property tax (monthly)</span>
                    <span>
                      {formatMoney(affordability.estimatedHomePrice)} x{" "}
                      {formatRatioPercent(affordability.taxRate)} / 12 ={" "}
                      {formatMoney(affordability.propertyTaxMonthly)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Property tax rate</span>
                    <span>
                      {affordability.taxRate > 0 ? formatRatioPercent(affordability.taxRate) : "Not available"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>HOA (monthly)</span>
                    <span>
                      {formatMoney(affordability.hoaAnnual)} / 12 = {formatMoney(affordability.hoaMonthly)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>P&amp;I budget</span>
                    <span>
                      {formatMoney(affordability.maxHousingBudget)} -{" "}
                      {formatMoney(affordability.insuranceMonthly)} -{" "}
                      {formatMoney(affordability.pmiMonthly)} -{" "}
                      {formatMoney(affordability.propertyTaxMonthly)} -{" "}
                      {formatMoney(affordability.hoaMonthly)} = {formatMoney(affordability.principalPayment)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Closing cash</span>
                    <span>
                      {formatMoney(affordability.downPayment)} + {formatMoney(affordability.closingCosts)} ={" "}
                      {formatMoney(affordability.downPayment + affordability.closingCosts)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Estimated rate</span>
                    <span>{formatPercent(resolvedRate.rate)}</span>
                  </div>
                  {rateMode === "credit" ? (
                    <div className="flex items-center justify-between gap-4">
                      <span>Credit score adjust</span>
                      <span>
                        {resolvedRate.scoreAdjust > 0 ? "+" : ""}
                        {formatPercent(resolvedRate.scoreAdjust)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-4">
                    <span>Estimated loan amount</span>
                    <span>{formatMoney(affordability.loanAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Estimated home price</span>
                    <span>
                      {formatMoney(affordability.loanAmount)} + {formatMoney(affordability.downPayment)} ={" "}
                      {formatMoney(affordability.estimatedHomePrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Price range</span>
                    <span>
                      {formatMoney(affordability.conservative)} - {formatMoney(affordability.optimistic)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={exportAffordability}>
                  Export PDF
                  <FileDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ) : null}

          {activeCalc === "refi" ? (
          <Card className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Refi Break-even</CardTitle>
                  <Button
                    variant="ghost"
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={resetCalculator}
                    key={`refi-reset-inline-${resetTick}`}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Start over
                  </Button>
                </div>
                <Timer className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Current balance</label>
                  <Input
                    value={refiInputs.balance}
                    onChange={updateRefi("balance")}
                    placeholder="ex 310000"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Current rate</label>
                  <Input
                    value={refiInputs.currentRate}
                    onChange={updateRefi("currentRate")}
                    placeholder="ex 7.1"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Rate source</label>
                  <select
                    className={selectClassName}
                    value={refiRateMode}
                    onChange={(event) => setRefiRateMode(event.target.value)}
                  >
                    <option value="live">Live average</option>
                    <option value="credit">Credit score estimate</option>
                    <option value="manual">Manual entry</option>
                    <option value="target">Target break-even</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Closing costs</label>
                  <Input
                    value={refiInputs.closingCosts}
                    onChange={updateRefi("closingCosts")}
                    placeholder="ex 6800"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Refi loan type</label>
                  <select
                    className={selectClassName}
                    value={refiLoanTypeId}
                    onChange={(event) => setRefiLoanTypeId(event.target.value)}
                  >
                    {LOAN_TYPES.map((loan) => (
                      <option key={loan.id} value={loan.id}>
                        {loan.label}
                      </option>
                    ))}
                  </select>
                </div>
                {refiRateMode === "credit" ? (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Credit score range</label>
                    <select
                      className={selectClassName}
                      value={refiCreditScoreId}
                      onChange={(event) => setRefiCreditScoreId(event.target.value)}
                    >
                      {CREDIT_SCORE_BUCKETS.map((bucket) => (
                        <option key={bucket.id} value={bucket.id}>
                          {bucket.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : refiRateMode === "target" ? (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Target break-even (months)</label>
                    <Input
                      value={refiInputs.targetMonths}
                      onChange={updateRefi("targetMonths")}
                      placeholder="ex 18"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                    />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">New rate</label>
                    <Input
                      value={
                        refiRateMode === "manual"
                          ? refiInputs.newRate
                          : Number.isFinite(refi.newRate)
                          ? refi.newRate.toFixed(2)
                          : ""
                      }
                      onChange={updateRefi("newRate")}
                      placeholder="ex 6.2"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      disabled={refiRateMode !== "manual"}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border bg-muted/10 p-4">
                <div className="text-xs text-muted-foreground">Break-even (estimate)</div>
                <div className="mt-2 text-2xl font-semibold">
                  {refi.breakEvenMonths > 0 ? `Month ${refi.breakEvenMonths}` : "Not in range"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Monthly savings: {formatMoney(refi.monthlySavings)}
                </div>
                {refiRateMode === "target" ? (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Suggested new rate: {refi.targetRate ? formatPercent(refi.targetRate) : "Not in range"}
                  </div>
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground">
                New rate estimates use Freddie Mac PMMS averages unless overridden.
              </div>

              <div className="rounded-2xl border bg-background/70 p-4 text-sm text-muted-foreground">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Breakdown
                </div>
                <div className="mt-3 grid gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <span>Current payment</span>
                    <span>{formatMoney(refi.currentPayment)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>New payment</span>
                    <span>{formatMoney(refi.newPayment)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Monthly savings</span>
                    <span>{formatMoney(refi.monthlySavings)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Break-even</span>
                    <span>
                      {refi.monthlySavings > 0
                        ? `${formatMoney(refi.closingCosts)} / ${formatMoney(refi.monthlySavings)} = Month ${refi.breakEvenMonths}`
                        : "Not in range"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Refi rate mode</span>
                    <span>{refiRateMode}</span>
                  </div>
                  {refiRateMode === "target" ? (
                    <div className="flex items-center justify-between gap-4">
                      <span>Target months</span>
                      <span>{refi.targetMonths || "Not set"}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button className="rounded-2xl">Compare scenarios</Button>
                <Button variant="outline" className="rounded-2xl" onClick={exportRefi}>
                  Export PDF
                  <FileDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ) : null}
        </div>

        
      </main>
    </div>
  );
}
