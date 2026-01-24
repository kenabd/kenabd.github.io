// src/LandingPage.jsx
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Calculator,
  ChevronRight,
  Download,
  FileDown,
  Home,
  LineChart,
  Menu,
  Shield,
  Sparkles,
  Timer,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const brand = {
  name: "Home Affordability Calculator",
  tagline: "Know your budget. Time your refi.",
  description:
    "Two clean calculators that keep the math simple: How Much House Can I Afford and Refi Break-even. Export a PDF summary you can share with lenders or partners.",
  primaryCta: "Try affordability",
  secondaryCta: "See refi break-even",
};

const nav = [
  { label: "Calculators", id: "calculators" },
  { label: "How it works", id: "how" },
  { label: "Export", id: "export" },
  { label: "Learn", id: "learn" },
  { label: "Ads policy", id: "ads" },
  { label: "FAQ", id: "faq" },
];

const calculatorCards = [
  {
    title: "How Much House Can I Afford",
    desc: "Estimate a safe purchase price using income, debt, down payment, taxes, and HOA.",
    badge: "Core calculator",
    icon: Home,
    bullets: [
      "Front-end and back-end DTI checks",
      "Adjustable rates, taxes, and insurance",
      "Instant monthly payment preview",
    ],
  },
  {
    title: "Refi Break-even",
    desc: "Compare your current loan with a new rate and fees to find the break-even month.",
    badge: "Core calculator",
    icon: Timer,
    bullets: [
      "Loan balance, term, and cash-out options",
      "Side-by-side savings timeline",
      "Best month to refi callout",
    ],
  },
];

const steps = [
  {
    title: "Enter your numbers",
    desc: "Simple inputs, no signup. Keep the flow fast and distraction-free.",
    icon: Calculator,
  },
  {
    title: "Review the story",
    desc: "See payment ranges, monthly impact, and break-even points in one view.",
    icon: LineChart,
  },
  {
    title: "Export a PDF",
    desc: "Download a clean summary for partners, lenders, or your own records.",
    icon: FileDown,
  },
];

const learnItems = [
  {
    title: "What DTI really means",
    desc: "How lenders read front-end vs back-end ratios.",
  },
  {
    title: "Rate buydowns explained",
    desc: "When points make sense and when they do not.",
  },
  {
    title: "Refi fees checklist",
    desc: "The costs that move your break-even date.",
  },
];

const faqs = [
  {
    q: "Is the calculator free to use?",
    a: "Yes. Both calculators are free with optional PDF export. No signup required for the basics.",
  },
  {
    q: "Where do ads appear?",
    a: "Only on results and learn pages. The input flow stays clean and ad-free.",
  },
  {
    q: "Do you store my data?",
    a: "No personal information is stored. Inputs stay in your browser unless you export a PDF.",
  },
  {
    q: "How accurate are the estimates?",
    a: "We use standard lender formulas and industry defaults, but you can tune every input.",
  },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm backdrop-blur">
      {children}
    </span>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <div className="mb-3 flex justify-center">
          <Pill>{eyebrow}</Pill>
        </div>
      ) : null}
      <h2 className="font-display text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-pretty text-base text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function GradientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-36 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,116,144,0.22),transparent_65%)] blur-3xl" />
      <div className="absolute -bottom-48 right-[-140px] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,162,89,0.25),transparent_60%)] blur-3xl" />
      <div className="absolute -bottom-24 left-[-140px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.2),transparent_60%)] blur-3xl" />
    </div>
  );
}

function TopNav({ onNav }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-muted/30 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">{brand.name}</div>
            <div className="text-xs text-muted-foreground">{brand.tagline}</div>
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => onNav(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" className="hidden rounded-xl md:inline-flex" asChild>
            <Link to="/products">Calculators</Link>
          </Button>
          <Button className="hidden rounded-xl md:inline-flex" onClick={() => onNav("calculators")}
          >
            {brand.primaryCta}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="border-t bg-background"
          >
            <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Menu</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="mt-3 grid gap-2">
                {nav.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="justify-start rounded-xl"
                    onClick={() => {
                      setOpen(false);
                      onNav(item.id);
                    }}
                  >
                    {item.label}
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Button>
                ))}

                <Separator className="my-1" />

                <Button variant="outline" className="rounded-xl" asChild>
                  <Link to="/products">Calculators</Link>
                </Button>

                <Button
                  className="rounded-xl"
                  onClick={() => {
                    setOpen(false);
                    onNav("calculators");
                  }}
                >
                  {brand.primaryCta}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function Hero({ onNav }) {
  const [heroInputs, setHeroInputs] = useState({
    takeHome: "",
    expenses: "",
    downPayment: "",
    rate: "",
  });

  const updateHeroInput = (key) => (event) => {
    setHeroInputs((prev) => ({ ...prev, [key]: event.target.value }));
  };

  return (
    <section className="relative">
      <GradientBackdrop />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill>
                <BadgeCheck className="mr-2 h-3.5 w-3.5" />
                Clean calculators
              </Pill>
              <Pill>
                <Shield className="mr-2 h-3.5 w-3.5" />
                Ad-free inputs
              </Pill>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="font-display mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              {brand.tagline}
            </motion.h1>

            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {brand.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button className="rounded-2xl" onClick={() => onNav("calculators")}
              >
                {brand.primaryCta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => onNav("calculators")}
              >
                {brand.secondaryCta}
              </Button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="rounded-xl">
                  PDF export
                </Badge>
                <span>|</span>
                <span>No signup required</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Input screens", value: "Zero ads" },
                { label: "Export", value: "PDF summary" },
                { label: "Learn hub", value: "Short guides" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl border bg-background/70 p-4 shadow-sm backdrop-blur"
                >
                  <div className="text-sm text-muted-foreground">{m.label}</div>
                  <div className="mt-1 text-lg font-semibold">{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: 0.05 }}
              className="rounded-3xl border bg-background/70 p-5 shadow-lg backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary/40" />
                  <div className="h-2 w-2 rounded-full bg-primary/30" />
                  <div className="h-2 w-2 rounded-full bg-primary/20" />
                </div>
                <Badge className="rounded-xl" variant="secondary">
                  Preview
                </Badge>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-background shadow-sm">
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Affordability</div>
                      <div className="text-xs text-muted-foreground">
                        Monthly budget to price range
                      </div>
                    </div>
                    <Badge className="ml-auto rounded-xl" variant="secondary">
                      Live
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      { key: "takeHome", label: "Take home pay" },
                      { key: "expenses", label: "Monthly expenses" },
                      { key: "downPayment", label: "Down payment" },
                      { key: "rate", label: "Rate" },
                    ].map((field) => (
                      <label key={field.key} className="grid gap-1 text-xs text-muted-foreground">
                        <span>{field.label}</span>
                        <Input
                          value={heroInputs[field.key]}
                          onChange={updateHeroInput(field.key)}
                          className="h-8 rounded-xl bg-background/80 text-xs"
                          placeholder={field.label}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">PDF summary</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Shareable results with charts
                      </div>
                    </div>
                    <Button className="rounded-2xl" size="sm">
                      Export
                      <Download className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="pointer-events-none absolute -right-10 -top-10 hidden h-40 w-40 rounded-full bg-primary/15 blur-3xl lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Calculators() {
  return (
    <section id="calculators" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader
        eyebrow="Calculators"
        title="Two tools that answer the big questions"
        subtitle="Built for first-time buyers and current owners comparing their next move."
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {calculatorCards.map((card) => (
          <Card key={card.title} className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{card.title}</CardTitle>
                <Badge className="rounded-xl" variant="secondary">
                  {card.badge}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 rounded-2xl border bg-muted/10 p-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-background">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Guided inputs</div>
                    <div className="text-xs text-muted-foreground">Smart defaults and toggles</div>
                  </div>
                </div>
                <div className="grid gap-2">
                  {card.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-2 text-sm">
                      <div className="mt-0.5 grid h-5 w-5 place-items-center rounded-full border bg-muted/20">
                        <BadgeCheck className="h-3.5 w-3.5" />
                      </div>
                      <div className="text-muted-foreground">{bullet}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="border-y bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeader
          eyebrow="Flow"
          title="Fast from inputs to answers"
          subtitle="Designed to stay out of the way and keep you moving."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {steps.map((step, idx) => (
            <Card key={step.title} className="rounded-3xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-background">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="rounded-xl">
                    Step {idx + 1}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExportSection() {
  return (
    <section id="export" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader
        eyebrow="Export"
        title="A lender-ready PDF in one click"
        subtitle="Bring clarity to conversations with a clean, shareable report."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">What the report includes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                "Monthly payment range and DTI",
                "Break-even timeline with fees",
                "Scenario notes and assumptions",
                "Summary page for sharing",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border bg-muted/10 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-background">
                    <FileDown className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-muted-foreground">{item}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">PDF preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="text-xs text-muted-foreground">Home Affordability Calculator report</div>
                <div className="mt-2 h-32 rounded-xl border bg-background" />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-xl border bg-background" />
                  ))}
                </div>
              </div>
              <Button className="rounded-2xl" onClick={() => {}}>
                Download sample
                <Download className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function LearnSection() {
  return (
    <section id="learn" className="border-y bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeader
          eyebrow="Learn"
          title="Short guides that explain the math"
          subtitle="Help users understand decisions, not just numbers."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {learnItems.map((item) => (
            <Card key={item.title} className="rounded-3xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdsPolicy() {
  return (
    <section id="ads" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader
        eyebrow="Monetization"
        title="Non-invasive ads and honest links"
        subtitle="Revenue stays off the input screens and only shows where it adds context."
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Ads policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                "Ads appear only on results and learn pages",
                "No banners or interstitials during input",
                "Affiliate links labeled clearly",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border bg-muted/10 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-background">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-muted-foreground">{item}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Affiliate partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                "Mortgage rate comparison tools",
                "Homeowners insurance quotes",
                "Refi lender partner offers",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border bg-muted/10 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-background">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-muted-foreground">{item}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section id="faq" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader
        eyebrow="FAQ"
        title="Common questions"
        subtitle="Short answers that set expectations."
      />

      <div className="mt-10 grid gap-3">
        {faqs.map((item, idx) => (
          <button
            key={item.q}
            type="button"
            onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
            className={cn(
              "w-full rounded-2xl border bg-background p-4 text-left shadow-sm transition",
              "hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-expanded={openIdx === idx}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-medium">{item.q}</div>
                <AnimatePresence initial={false}>
                  {openIdx === idx ? (
                    <motion.p
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="mt-2 overflow-hidden text-sm leading-relaxed text-muted-foreground"
                    >
                      {item.a}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
              <div className="mt-0.5 rounded-full border bg-muted/30 p-1">
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    openIdx === idx ? "rotate-90" : "rotate-0"
                  )}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="border-t bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <SectionHeader
              eyebrow="Early access"
              title="Get the PDF export template"
              subtitle="Drop your email and we will send a sample report and release updates."
            />

            <div className="mt-6 grid gap-3">
              {[
                "Sample affordability report",
                "Break-even worksheet",
                "Launch updates and feature drops",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-3xl border bg-background/60 p-4 shadow-sm">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-muted/20">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">{item}</div>
                </div>
              ))}
            </div>
          </div>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Send me the sample</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="you@example.com" required />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Focus area</label>
                  <Input placeholder="Buying, refi, or both" />
                </div>

                <Button className="mt-1 rounded-2xl" type="submit">
                  Get the PDF sample
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="text-xs text-muted-foreground">
                  We only send calculator updates and sample exports.
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Footer({ onNav }) {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-muted/30 shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">{brand.name}</div>
                <div className="text-xs text-muted-foreground">{brand.tagline}</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Home Affordability Calculator keeps the math clear for buyers and owners. Clean inputs, exportable PDFs, and a learn hub
              that explains what the numbers mean.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <div className="text-sm font-semibold">Sections</div>
              <div className="mt-3 grid gap-1">
                {nav.map((n) => (
                  <button
                    key={n.id}
                    className="text-left text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => onNav(n.id)}
                    type="button"
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold">Links</div>
              <div className="mt-3 grid gap-1">
                {[
                  "Privacy",
                  "Terms",
                  "Advertiser policy",
                ].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.preventDefault()}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Copyright {new Date().getFullYear()} Home Affordability Calculator. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="rounded-xl">
              Clean inputs
            </Badge>
            <Badge variant="secondary" className="rounded-xl">
              PDF export
            </Badge>
            <Badge variant="secondary" className="rounded-xl">
              Learn hub
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const onNav = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const y = el.getBoundingClientRect().top + window.scrollY;
    const headerOffset = 80;
    window.scrollTo({ top: Math.max(0, y - headerOffset), behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav onNav={onNav} />
      <main>
        <Hero onNav={onNav} />
        <Calculators />
        <HowItWorks />
        <ExportSection />
        <LearnSection />
        <AdsPolicy />
        <FAQ />
        <Contact />
      </main>
      <Footer onNav={onNav} />
    </div>
  );
}
