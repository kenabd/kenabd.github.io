// src/LandingPage.jsx
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bolt,
  Check,
  ChevronDown,
  ChevronRight,
  Github,
  Globe,
  HeartHandshake,
  LayoutGrid,
  Lock,
  Mail,
  Menu,
  Moon,
  Phone,
  Shield,
  Sparkles,
  Star,
  Sun,
  X,
} from "lucide-react";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { tiers } from "./data/tiers";

/**
 * KAtl Solutions - single-file landing page
 * - React + Tailwind + shadcn/ui
 * - Framer Motion animations
 */

const brand = {
  name: "KAtl Solutions",
  tagline: "Build, modernize, and scale software—without the drama.",
  description:
    "KAtl Solutions helps teams ship reliable cloud and software systems. From architecture and backend services to automation and AI-enabled workflows, we deliver practical engineering that moves the needle.",
  primaryCta: "Get a quote",
  secondaryCta: "Schedule a call",
};

const nav = [
  { label: "Services", id: "features" },
  { label: "Process", id: "how" },
  { label: "Results", id: "testimonials" },
  { label: "Packages", id: "pricing" },
  { label: "FAQ", id: "faq" },
  { label: "Contact", id: "contact" },
];

const features = [
  {
    title: "Cloud & platform engineering",
    desc: "Architecture, networking, reliability, and cost optimization for Azure/AWS workloads.",
    icon: Globe,
  },
  {
    title: "Backend APIs & services",
    desc: "Design and build resilient APIs, event-driven systems, and data integrations.",
    icon: LayoutGrid,
  },
  {
    title: "DevOps, IaC & automation",
    desc: "CI/CD, Terraform/Bicep, observability, and repeatable environments that scale.",
    icon: Bolt,
  },
  {
    title: "AI-enabled workflows",
    desc: "Practical LLM integrations, copilots, and internal tools that reduce cycle time.",
    icon: Sparkles,
  },
];

const steps = [
  {
    title: "Discovery & architecture",
    desc: "Clarify goals, constraints, and risks. Deliver an actionable plan with clear tradeoffs.",
    icon: BadgeCheck,
  },
  {
    title: "Build & integrate",
    desc: "Implement the solution with clean APIs, automation, and measurable milestones.",
    icon: Bolt,
  },
  {
    title: "Operate & improve",
    desc: "Harden reliability, monitoring, and cost posture—then iterate based on real usage.",
    icon: Shield,
  },
];

const testimonials = [
  {
    name: "CTO (Fintech)",
    role: "Platform modernization",
    quote:
      "KAtl Solutions turned our platform roadmap into a weekly delivery cadence—clean architecture, no surprises.",
    stars: 5,
  },
  {
    name: "Engineering Manager",
    role: "Backend + DevOps",
    quote:
      "They improved our CI/CD and observability in days. Deploys are boring now—in the best way.",
    stars: 5,
  },
  {
    name: "Founder",
    role: "MVP to production",
    quote:
      "We shipped faster with better reliability. The communication and execution were consistently sharp.",
    stars: 5,
  },
];

const faqs = [
  {
    q: "What types of projects do you take on?",
    a: "Cloud architecture, backend services/APIs, DevOps automation (CI/CD + IaC), observability, and practical AI integrations.",
  },
  {
    q: "Do you work with existing teams?",
    a: "Yes. We can embed with your team, pair on architecture and delivery, and leave behind documentation and repeatable automation.",
  },
  {
    q: "What’s the usual engagement model?",
    a: "Most clients start with an architecture review or a short build sprint. Ongoing support is available via retainer.",
  },
  {
    q: "Can you sign an NDA and handle sensitive systems?",
    a: "Yes. We routinely work under NDA and follow least-privilege, secure-by-default practices.",
  },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm backdrop-blur">
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
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
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

function StarRow({ count = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" />
      ))}
    </div>
  );
}

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full rounded-2xl border bg-background p-4 text-left shadow-sm transition",
        "hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      aria-expanded={isOpen}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-medium">{item.q}</div>
          <AnimatePresence initial={false}>
            {isOpen ? (
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
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </div>
      </div>
    </button>
  );
}

function GradientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent blur-3xl" />
      <div className="absolute -bottom-40 right-[-120px] h-[560px] w-[560px] rounded-full bg-gradient-to-tr from-muted/60 via-primary/10 to-transparent blur-3xl" />
      <div className="absolute -bottom-24 left-[-160px] h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-primary/20 via-muted/40 to-transparent blur-3xl" />
    </div>
  );
}

function TopNav({ onNav }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("dark");


  const toggleTheme = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

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
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {mode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            className="hidden rounded-xl md:inline-flex"
            asChild
          >
            <Link to="/products">Products</Link>
          </Button>

          <Button
            className="hidden rounded-xl md:inline-flex"
            onClick={() => onNav("contact")}
          >
            {brand.primaryCta}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="hidden rounded-xl md:inline-flex"
            onClick={() => onNav("contact")}
          >
            {brand.secondaryCta}
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
                  <Link to="/products">Products</Link>
                </Button>

                <Button
                  className="rounded-xl"
                  onClick={() => {
                    setOpen(false);
                    onNav("contact");
                  }}
                >
                  {brand.primaryCta}
                </Button>

                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setOpen(false);
                    onNav("contact");
                  }}
                >
                  {brand.secondaryCta}
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
  return (
    <section className="relative">
      <GradientBackdrop />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill>
                <Lock className="mr-2 h-3.5 w-3.5" />
                Clear scope & communication
              </Pill>
              <Pill>
                <HeartHandshake className="mr-2 h-3.5 w-3.5" />
                Delivery-focused execution
              </Pill>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              {brand.tagline}
            </motion.h1>

            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {brand.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button className="rounded-2xl" onClick={() => onNav("contact")}>
                {brand.primaryCta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => onNav("contact")}
              >
                {brand.secondaryCta}
              </Button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="rounded-xl">
                  Fast kickoff
                </Badge>
                <span>·</span>
                <span>NDA-friendly</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Avg. response", value: "< 24h" },
                { label: "Delivery", value: "Weekly" },
                { label: "Focus", value: "Cloud + Backend" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl border bg-background/60 p-4 shadow-sm backdrop-blur"
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
              className="rounded-3xl border bg-background/60 p-5 shadow-lg backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary/40" />
                  <div className="h-2 w-2 rounded-full bg-primary/30" />
                  <div className="h-2 w-2 rounded-full bg-primary/20" />
                </div>
                <Badge className="rounded-xl" variant="secondary">
                  Example deliverable
                </Badge>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-background shadow-sm">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Visibility</div>
                      <div className="text-xs text-muted-foreground">
                        Progress, risks, and outcomes—clearly tracked
                      </div>
                    </div>
                    <Badge className="ml-auto rounded-xl" variant="secondary">
                      Weekly
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 rounded-xl border bg-primary/10"
                        style={{
                          gridColumn: "span 1",
                          transform: `translateY(${(i % 5) * 2}px)`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      <div className="text-sm font-medium">Architecture</div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Clear plan, tradeoffs, and milestone mapping.
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      <div className="text-sm font-medium">Delivery</div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      CI/CD, observability, and clean handoff.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Talk to KAtl</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Get a plan and a practical path to shipping.
                      </div>
                    </div>
                    <Button className="rounded-2xl" size="sm" onClick={() => onNav("contact")}>
                      Contact
                      <ArrowRight className="ml-2 h-4 w-4" />
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

function LogoCloud() {
  const logos = [
    { name: "Arc", icon: Github },
    { name: "Vertex", icon: Globe },
    { name: "Kite", icon: Sparkles },
    { name: "Atlas", icon: Shield },
    { name: "Pulse", icon: BarChart3 },
  ];

  return (
    <section className="border-y bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            Trusted by teams modernizing their stack
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {logos.map((l) => (
              <div
                key={l.name}
                className="flex items-center gap-2 rounded-2xl border bg-background/60 px-4 py-2 text-sm shadow-sm"
              >
                <l.icon className="h-4 w-4" />
                <span className="font-medium">{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader
        eyebrow="Services"
        title="Engineering help that ships"
        subtitle="Cloud, backend, automation, and AI workflows—delivered with clear scope and measurable outcomes."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.title} className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-muted/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <Badge className="rounded-xl" variant="secondary">
                  Included
                </Badge>
              </div>
              <CardTitle className="mt-3 text-lg">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">What “good” looks like</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Check, title: "Reliable delivery", desc: "Milestones with crisp acceptance criteria." },
                { icon: Check, title: "Clean architecture", desc: "Tradeoffs documented; complexity kept low." },
                { icon: Check, title: "Operational readiness", desc: "Monitoring, alerts, and runbooks included." },
                { icon: Check, title: "Secure defaults", desc: "Least privilege and safe-by-default patterns." },
              ].map((i) => (
                <div
                  key={i.title}
                  className="flex items-start gap-3 rounded-2xl border bg-muted/10 p-4"
                >
                  <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl border bg-background">
                    <i.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{i.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{i.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Typical deliverables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {["Architecture notes", "IaC + CI/CD", "APIs + integrations", "Observability baseline"].map((t) => (
                <div key={t} className="flex items-center gap-3 rounded-2xl border bg-muted/10 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-background">
                    <Check className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">{t}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="border-y bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeader
          eyebrow="Process"
          title="Simple engagement, fast momentum"
          subtitle="Start with clarity, then deliver in tight loops with continuous visibility."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {steps.map((s, idx) => (
            <Card key={s.title} className="rounded-3xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-background">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="rounded-xl">
                    Step {idx + 1}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-lg">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border bg-background/60 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-lg font-semibold">Want a tailored plan?</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Share your goals and constraints; we’ll propose the smallest high-leverage next step.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-xl" variant="secondary">
                Azure/AWS
              </Badge>
              <Badge className="rounded-xl" variant="secondary">
                Backend + DevOps
              </Badge>
              <Badge className="rounded-xl" variant="secondary">
                AI workflows
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeader
        eyebrow="Results"
        title="What teams say after shipping"
        subtitle="Replace these with real client quotes once you have them."
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {testimonials.map((t) => (
          <Card key={t.name} className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
                <StarRow count={t.stars} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">“{t.quote}”</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">How we keep delivery predictable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                { icon: Check, text: "Tight scope + clear acceptance criteria" },
                { icon: Check, text: "Weekly milestones + transparent tracking" },
                { icon: Check, text: "Docs, handoff, and operational readiness" },
                { icon: Check, text: "Security-minded defaults and least privilege" },
              ].map((x) => (
                <div key={x.text} className="flex items-center gap-3 rounded-2xl border bg-muted/10 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-background">
                    <x.icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">{x.text}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg">Common outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {["Faster deploys", "Lower incident rate", "Cleaner architecture", "Better visibility"].map((x) => (
                <div key={x} className="flex items-center gap-3 rounded-2xl border bg-muted/10 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-background">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">{x}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Pricing({ onNav }) {
  return (
    <section id="pricing" className="border-y bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeader
          eyebrow="Packages"
          title="Engagement options"
          subtitle="Start small, prove value quickly, then scale the work if it’s a fit."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={cn(
                "rounded-3xl",
                t.featured ? "border-primary/30 shadow-lg shadow-primary/10" : "shadow-sm"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  {t.featured ? (
                    <Badge className="rounded-xl">Most popular</Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-xl">
                      Flexible
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <div className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.price}</div>
                  <div className="pb-1 text-sm text-muted-foreground">{t.period}</div>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{t.highlight}</div>
              </CardHeader>

              <CardContent>
                <div className="grid gap-3">
                  <Button
                    className="w-full rounded-2xl"
                    variant={t.featured ? "default" : "outline"}
                    onClick={() => onNav("contact")}
                  >
                    {t.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="grid gap-2">
                    {t.bullets.map((b) => (
                      <div key={b} className="flex items-start gap-2 text-sm">
                        <div className="mt-0.5 grid h-5 w-5 place-items-center rounded-full border bg-muted/20">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-muted-foreground">{b}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border bg-muted/10 p-3 text-xs text-muted-foreground">
                    Tip: Add a “what you get” PDF and a short intake questionnaire.
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border bg-background p-6 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-lg font-semibold">Need something specific?</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Describe your goal; we’ll propose the simplest engagement that delivers.
              </div>
            </div>
            <Button className="rounded-2xl" onClick={() => onNav("contact")}>
              Talk to KAtl
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
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
        subtitle="Short answers to the questions that usually come up before kickoff."
      />

      <div className="mt-10 grid gap-3">
        {faqs.map((item, idx) => (
          <FAQItem
            key={item.q}
            item={item}
            isOpen={openIdx === idx}
            onToggle={() => setOpenIdx(openIdx === idx ? -1 : idx)}
          />
        ))}
      </div>
    </section>
  );
}

function Contact() {
  const [status, setStatus] = useState("idle");

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    await new Promise((r) => setTimeout(r, 800)); // Replace with your real submit
    setStatus("success");
    setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <section id="contact" className="border-t bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Contact"
              title="Tell us what you’re trying to ship"
              subtitle="We’ll respond with next steps, timeline, and a clear proposal."
            />

            <div className="mt-8 grid gap-3">
              {[
                { icon: Mail, label: "Email", value: "hello@katlsolutions.com" },
                { icon: Phone, label: "Phone", value: "+1 (555) 012-3456" },
              ].map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-3 rounded-3xl border bg-background/60 p-4 shadow-sm"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-muted/20">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{c.label}</div>
                    <div className="text-sm text-muted-foreground">{c.value}</div>
                  </div>
                </div>
              ))}

              <div className="rounded-3xl border bg-background/60 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-muted/20">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Privacy</div>
                    <div className="text-sm text-muted-foreground">
                      We only use your info to respond. No spam.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Send a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input placeholder="Your name" required />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="you@company.com" required />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">What do you need help with?</label>
                  <Textarea
                    placeholder="Cloud architecture, backend APIs, CI/CD, observability, AI workflows..."
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <Button className="mt-1 rounded-2xl" type="submit" disabled={status === "loading"}>
                  {status === "loading" ? "Sending…" : status === "success" ? "Sent" : "Send"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="text-xs text-muted-foreground">
                  Replace the simulated submit with your real endpoint.
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
              KAtl Solutions builds modern software and cloud systems for teams that value reliability,
              velocity, and clear communication.
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
                {["Privacy", "Terms", "Status"].map((x) => (
                  <a
                    key={x}
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.preventDefault()}
                  >
                    {x}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} KAtl Solutions. All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Security">
              <Shield className="h-4 w-4" />
            </Button>
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
        <LogoCloud />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing onNav={onNav} />
        <FAQ />
        <Contact />
      </main>
      <Footer onNav={onNav} />

      {/* Back to top (fixed) */}
      <div className="fixed bottom-5 right-5 hidden sm:block">
        <Button
          variant="secondary"
          className="rounded-2xl shadow-lg"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Back to top
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
