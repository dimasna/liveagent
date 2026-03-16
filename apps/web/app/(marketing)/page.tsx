"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@modules/auth/components/auth-provider";
import {
  PhoneIcon,
  CalendarIcon,
  BarChart3Icon,
  ArrowRightIcon,
  ZapIcon,
  GlobeIcon,
  BotIcon,
  ScissorsIcon,
  UtensilsIcon,
  DumbbellIcon,
  StethoscopeIcon,
  CarIcon,
  SparklesIcon,
  GraduationCapIcon,
  PawPrintIcon,
  WrenchIcon,
  HomeIcon,
  CameraIcon,
  BriefcaseIcon,
  StarIcon,
  MonitorIcon,
} from "lucide-react";
import { AnimateOnScroll } from "@modules/marketing/components/animate-on-scroll";
import { FrameBox } from "@modules/marketing/components/frame-box";
import { SectionBadge } from "@modules/marketing/components/section-badge";

const features = [
  {
    icon: PhoneIcon,
    title: "Real-Time Voice",
    description:
      "Natural bidirectional voice conversations powered by Gemini's native audio model. Callers can interrupt and get instant responses.",
  },
  {
    icon: CalendarIcon,
    title: "Calendar Sync",
    description:
      "Direct Google Calendar integration. Your agent checks availability, creates bookings, and sends confirmations automatically.",
  },
  {
    icon: BarChart3Icon,
    title: "Analytics",
    description:
      "Track every call, booking, and conversation. See real-time transcripts, outcomes, and conversion metrics.",
  },
  {
    icon: BotIcon,
    title: "Custom Agents",
    description:
      "Configure personality, instructions, and business rules. Each agent is tailored to your specific use case.",
  },
];

const stats = [
  {
    label: "Latency",
    value: "<1s",
    sub: "avg response",
  },
  {
    label: "Uptime",
    value: "99.9%",
    sub: "reliability",
  },
  {
    label: "Calls",
    value: "24/7",
    sub: "availability",
  },
];

const howItWorks = [
  {
    step: "01",
    icon: BotIcon,
    title: "Create your agent",
    description:
      "Set up your AI voice agent with custom instructions, personality, and business rules in minutes.",
  },
  {
    step: "02",
    icon: CalendarIcon,
    title: "Connect your calendar",
    description:
      "Link Google Calendar so your agent knows real-time availability and can book appointments instantly.",
  },
  {
    step: "03",
    icon: GlobeIcon,
    title: "Deploy the widget",
    description:
      "Add a single script tag to your website. Customers click to call and your agent handles the rest.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border transition-all duration-300">
        <div className="max-w-[1160px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0 transition-transform duration-300 group-hover:scale-110">
              <rect width="28" height="28" rx="7" fill="white" />
              <rect x="6.5" y="11" width="2" height="6" rx="1" fill="#0a0a0a" opacity="0.35" />
              <rect x="10" y="8.5" width="2" height="11" rx="1" fill="#0a0a0a" opacity="0.55" />
              <rect x="13.5" y="6" width="2" height="16" rx="1" fill="#0a0a0a" />
              <rect x="17" y="9" width="2" height="10" rx="1" fill="#0a0a0a" opacity="0.55" />
              <rect x="20.5" y="11.5" width="2" height="5" rx="1" fill="#0a0a0a" opacity="0.35" />
            </svg>
            <span className="text-lg font-bold text-foreground tracking-tight">Liveagent.dev</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#industries" className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors">
              Industries
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors">
              How It Works
            </a>
            <Link href="/about" className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors">
              About
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://github.com/dimasna/liveagent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <StarIcon className="size-3.5" />
              Star on GitHub
            </a>
            <SignedIn>
              <Link
                href="/agents"
                className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-all hover:-translate-y-px"
              >
                Go to Workspace
              </Link>
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-all hover:-translate-y-px"
              >
                Get Started
              </Link>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--color-border) 1px, transparent 1px),
              linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Radial fade */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 55% at 50% 50%, var(--color-background) 30%, transparent 100%)",
          }}
        />

        <div className="relative max-w-[1160px] mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left — text */}
            <div>
              <AnimateOnScroll>
                <div className="flex gap-2.5 mb-6 flex-wrap">
                  {["OPEN SOURCE", "VOICE AI", "GEMINI LIVE", "REAL-TIME","24/7"].map((tag) => (
                    <span
                      key={tag}
                      className="bg-muted border border-border px-3 py-0.5 rounded-md text-[11px] font-mono text-muted-foreground tracking-widest"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={100}>
                <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.1] tracking-tight text-foreground mb-5">
                  AI Voice Agents for{" "}
                  <span className="text-muted-foreground">Reservations & Bookings</span>
                </h1>
              </AnimateOnScroll>

              <AnimateOnScroll delay={200}>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-[440px]">
                  Open-source AI voice agents that answer calls, check
                  availability, and book appointments — all synced with Google
                  Calendar.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll delay={300}>
                <div className="flex gap-3.5 flex-wrap">
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center rounded-lg bg-foreground px-7 py-3 text-sm font-medium text-background hover:bg-foreground/90 transition-all hover:-translate-y-px shadow-lg shadow-white/5"
                  >
                    Start Free
                    <ArrowRightIcon className="ml-2 size-3.5" />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center rounded-lg border border-border px-7 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    How It Works
                  </a>
                </div>
              </AnimateOnScroll>
            </div>

            {/* Right — widget mockup (compact) */}
            <AnimateOnScroll delay={200}>
              <div className="border border-border bg-background rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 max-w-[320px] md:ml-auto">
                <div className="flex flex-col items-center pt-8 pb-5 px-5">
                  {/* Waveform circle — smaller */}
                  <div className="relative mb-1">
                    <div
                      className="absolute inset-0 rounded-full border-2 hero-ripple"
                      style={{ borderColor: "rgba(34, 197, 94, 0.19)" }}
                    />
                    <div
                      className="relative w-20 h-20 rounded-full flex items-center justify-center bg-green-500/5"
                      style={{ boxShadow: "0 0 10px 2px rgba(34, 197, 94, 0.4)" }}
                    >
                      <div className="flex items-center gap-1">
                        {[
                          { height: 10, opacity: 0.35 },
                          { height: 18, opacity: 0.55 },
                          { height: 28, opacity: 1.0 },
                          { height: 17, opacity: 0.55 },
                          { height: 9, opacity: 0.35 },
                        ].map((bar, i) => (
                          <div
                            key={i}
                            className="rounded-full hero-wave-bar"
                            style={{
                              width: 4,
                              height: bar.height,
                              backgroundColor: "#22c55e",
                              opacity: bar.opacity * 0.8,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-foreground text-[13px] font-medium mt-2.5">Booking Agent</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">Call completed</p>

                  {/* Booking card — compact */}
                  <div className="w-full mt-4 rounded-lg border border-green-500/20 bg-green-500/5 px-3.5 py-3">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span className="text-[12px] font-semibold text-green-600 dark:text-green-400">Confirmed &amp; Sent</span>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-green-600/50 dark:text-green-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span className="text-green-700 dark:text-green-300">Sat, Mar 21, 1:30 – 2:00 PM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-green-600/50 dark:text-green-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                        <span className="text-green-700 dark:text-green-300">Haircut — Station 3</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-green-600/50 dark:text-green-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span className="text-green-700 dark:text-green-300">john@example.com</span>
                      </div>
                    </div>
                    <p className="mt-2.5 pt-2 border-t border-green-500/10 text-[10px] text-green-600/40 dark:text-green-400/40">
                      #a1b2c3d4 · Calendar invite sent
                    </p>
                  </div>
                </div>

                {/* Bottom button — smaller */}
                <div className="px-4 pb-4 pt-1 flex items-center justify-center">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#22c55e", boxShadow: "0 0 10px 2px rgba(34, 197, 94, 0.4)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-[1160px] mx-auto px-6">
        <FrameBox corners="bottom" className="py-24 px-8">
          <SectionBadge number="01 / 04" label="Features" sub="Core capabilities" />

          <AnimateOnScroll>
            <h2 className="text-4xl font-bold text-foreground tracking-tight mb-3">
              Everything you need for voice automation
            </h2>
            <p className="text-muted-foreground text-base mb-12 max-w-[600px]">
              From real-time voice conversations to calendar bookings — powerful
              features that just work.
            </p>
          </AnimateOnScroll>

          {/* Feature cards — framed cells */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 mb-12">
            {features.map((f, i) => (
              <AnimateOnScroll key={f.title} delay={i * 100}>
                <div
                  className={`h-full p-7 border-b border-border md:border-b-0 ${
                    i < features.length - 1 ? "md:border-r" : ""
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-foreground mb-4">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="text-foreground font-semibold text-base mb-2">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          {/* Integration demo — framed panels */}
          <AnimateOnScroll delay={300}>
            <div className="grid md:grid-cols-2 border border-border">
              {/* Widget code panel */}
              <div className="p-5 font-mono text-[13px] leading-[1.8] overflow-x-auto md:border-r border-b md:border-b-0 border-border">
                <div className="flex gap-1.5 mb-3.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  <span className="ml-3 text-[11px] text-muted-foreground">
                    index.html
                  </span>
                </div>
                <div className="space-y-0">
                  <div className="flex gap-4"><span className="text-muted-foreground/40 min-w-5 text-right select-none">1</span><span className="text-muted-foreground/60">{`<!-- Add Liveagent.dev to your website -->`}</span></div>
                  <div className="flex gap-4"><span className="text-muted-foreground/40 min-w-5 text-right select-none">2</span><span><span className="text-[#7aa2f7]">{`<`}</span><span className="text-[#bb9af7]">script</span></span></div>
                  <div className="flex gap-4"><span className="text-muted-foreground/40 min-w-5 text-right select-none">3</span><span>  <span className="text-[#e0af68]">src</span><span className="text-foreground/60">=</span><span className="text-[#9ece6a]">&quot;https://liveagent.dev/widget.js&quot;</span></span></div>
                  <div className="flex gap-4"><span className="text-muted-foreground/40 min-w-5 text-right select-none">4</span><span>  <span className="text-[#e0af68]">data-agent-id</span><span className="text-foreground/60">=</span><span className="text-[#9ece6a]">&quot;ag_7xK2mPqR9vL4&quot;</span></span></div>
                  <div className="flex gap-4"><span className="text-muted-foreground/40 min-w-5 text-right select-none">5</span><span>  <span className="text-[#e0af68]">async</span></span></div>
                  <div className="flex gap-4"><span className="text-muted-foreground/40 min-w-5 text-right select-none">6</span><span><span className="text-[#7aa2f7]">{`>`}</span><span className="text-[#7aa2f7]">{`</`}</span><span className="text-[#bb9af7]">script</span><span className="text-[#7aa2f7]">{`>`}</span></span></div>
                  <div className="flex gap-4"><span className="text-muted-foreground/40 min-w-5 text-right select-none">7</span><span></span></div>
                  <div className="flex gap-4"><span className="text-muted-foreground/40 min-w-5 text-right select-none">8</span><span className="text-muted-foreground/60">{`<!-- That's it! Your voice agent is live -->`}</span></div>
                </div>
              </div>

              {/* Booking phases panel */}
              <div className="p-5 space-y-3">
                <div className="flex gap-1.5 mb-3.5 items-center">
                  <span className="bg-foreground/10 text-foreground px-2.5 py-0.5 rounded text-[11px] font-mono">
                    booking flow
                  </span>
                  <span className="ml-auto text-muted-foreground/40 text-[11px] font-mono">
                    live
                  </span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>

                {/* Phase 1: Confirming */}
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-amber-400 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" opacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="text-[12px] font-semibold text-amber-400">Confirming booking...</span>
                  </div>
                  <div className="mt-2 pl-7 space-y-1 text-[11px] text-amber-300/60">
                    <p>Checking availability for Sat 1:30 PM</p>
                    <p>Creating calendar event...</p>
                  </div>
                </div>

                {/* Phase 2: Confirmed & Sent */}
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3.5 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-[12px] font-semibold text-green-400">Confirmed &amp; Sent</span>
                  </div>
                  <div className="pl-7 space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-green-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="text-green-300">Sat, Mar 21, 1:30 – 2:00 PM</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-green-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      <span className="text-green-300">Haircut — Station 3</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-green-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span className="text-green-300">john@example.com</span>
                    </div>
                  </div>
                  <p className="mt-2 pt-1.5 border-t border-green-500/10 text-[10px] text-green-400/40 pl-7">
                    #a1b2c3d4 · Calendar invite sent
                  </p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </FrameBox>
      </section>

      {/* Stats */}
      <section className="max-w-[1160px] mx-auto px-6">
        <FrameBox corners="bottom" className="py-16 px-8">
          <SectionBadge number="02 / 04" label="Performance" sub="Built to deliver" />

          <AnimateOnScroll>
            <h2 className="text-4xl font-bold text-foreground tracking-tight mb-3">
              Real results, real impact
            </h2>
            <p className="text-muted-foreground text-base mb-12 max-w-[600px]">
              Powered by Google Gemini Live API for natural, low-latency voice interactions.
            </p>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 border border-border">
            {/* Resolution comparison */}
            <AnimateOnScroll delay={100}>
              <div className="h-full p-8 md:border-r border-b md:border-b-0 border-border">
                <h3 className="text-foreground font-semibold text-lg mb-1.5">
                  Instant booking resolution
                </h3>
                <p className="text-muted-foreground text-sm mb-7 leading-relaxed">
                  AI agents handle most calls without human intervention.
                </p>
                {[
                  { name: "Liveagent.dev AI", pct: 92, highlight: true },
                  { name: "Traditional IVR", pct: 45, highlight: false },
                  { name: "Email booking", pct: 22, highlight: false },
                ].map((bar) => (
                  <div key={bar.name} className="mb-4">
                    <div className="flex justify-between mb-1.5 text-[13px]">
                      <span className={bar.highlight ? "text-foreground" : "text-muted-foreground"}>
                        {bar.name}
                      </span>
                      <span className={`font-mono ${bar.highlight ? "text-foreground" : "text-muted-foreground"}`}>
                        {bar.pct}%
                      </span>
                    </div>
                    <div className="bg-muted rounded h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded transition-all duration-[1.5s] ease-out ${
                          bar.highlight ? "bg-foreground" : "bg-muted-foreground/20"
                        }`}
                        style={{ width: `${bar.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>

            {/* Speed metrics */}
            <AnimateOnScroll delay={200}>
              <div className="h-full p-8">
                <h3 className="text-foreground font-semibold text-lg mb-1.5">
                  Lightning fast responses
                </h3>
                <p className="text-muted-foreground text-sm mb-7 leading-relaxed">
                  Sub-second latency powered by Gemini&apos;s native audio streaming.
                </p>
                <div className="grid grid-cols-3 gap-px bg-border">
                  {stats.map((stat) => (
                    <div key={stat.label} className="bg-background p-4 text-center">
                      <div className="text-[11px] text-muted-foreground font-mono uppercase tracking-widest mb-2">
                        {stat.label}
                      </div>
                      <div className="text-2xl font-bold text-foreground font-mono">
                        {stat.value}
                      </div>
                      <div className="text-[11px] text-muted-foreground/60 mt-1">
                        {stat.sub}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </FrameBox>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-[1160px] mx-auto px-6">
        <FrameBox corners="bottom" className="py-24 px-8">
          <SectionBadge number="03 / 04" label="Setup" sub="Three simple steps" />

          <AnimateOnScroll>
            <h2 className="text-4xl font-bold text-foreground tracking-tight mb-3">
              Up and running in minutes
            </h2>
            <p className="text-muted-foreground text-base mb-12 max-w-[600px]">
              No complex setup required. Create an agent, connect your calendar, and deploy.
            </p>
          </AnimateOnScroll>

          <div className="grid sm:grid-cols-3">
            {howItWorks.map((step, i) => (
              <AnimateOnScroll key={step.step} delay={i * 100}>
                <div
                  className={`h-full p-7 border-b border-border sm:border-b-0 ${
                    i < howItWorks.length - 1 ? "sm:border-r" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-foreground">
                      <step.icon className="size-5" />
                    </div>
                    <span className="text-muted-foreground/40 font-mono text-sm">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-foreground font-semibold text-base mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </FrameBox>
      </section>

      {/* Business Types */}
      <section id="industries" className="max-w-[1160px] mx-auto px-6">
        <FrameBox corners="bottom" className="py-24 px-8">
          <SectionBadge number="04 / 04" label="Industries" sub="Built for every business" />

          <AnimateOnScroll>
            <h2 className="text-4xl font-bold text-foreground tracking-tight mb-3">
              Voice agents for any booking business
            </h2>
            <p className="text-muted-foreground text-base mb-12 max-w-[600px]">
              Whether you run a salon or a clinic, your AI agent handles calls
              and books appointments the way your customers expect.
            </p>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-border border border-border">
            {[
              { icon: ScissorsIcon, name: "Hair Salons & Barbers", example: "Haircuts, coloring, styling" },
              { icon: SparklesIcon, name: "Beauty & Spa", example: "Facials, massage, nails" },
              { icon: UtensilsIcon, name: "Restaurants", example: "Table reservations, events" },
              { icon: StethoscopeIcon, name: "Medical & Dental", example: "Patient appointments, checkups" },
              { icon: DumbbellIcon, name: "Fitness & Yoga", example: "Class bookings, personal training" },
              { icon: CarIcon, name: "Auto Services", example: "Oil changes, repairs, detailing" },
              { icon: PawPrintIcon, name: "Pet Services", example: "Grooming, vet visits, boarding" },
              { icon: GraduationCapIcon, name: "Tutoring & Lessons", example: "Private sessions, group classes" },
              { icon: WrenchIcon, name: "Home Services", example: "Plumbing, electrical, cleaning" },
              { icon: HomeIcon, name: "Real Estate", example: "Property viewings, consultations" },
              { icon: CameraIcon, name: "Photography", example: "Shoots, sessions, events" },
              { icon: BriefcaseIcon, name: "Consulting", example: "Strategy calls, advisory sessions" },
              { icon: MonitorIcon, name: "SaaS & Software", example: "Product demos, onboarding calls" },
            ].map((biz, i) => (
              <AnimateOnScroll key={biz.name} delay={i * 50} className="bg-background">
                <div className="p-5 h-full">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-foreground mb-3">
                    <biz.icon className="size-4" />
                  </div>
                  <h3 className="text-foreground font-semibold text-sm mb-1">
                    {biz.name}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {biz.example}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
            {/* Other Businesses — spans remaining columns */}
            <AnimateOnScroll delay={650} className="bg-background col-span-2 sm:col-span-2 md:col-span-3">
              <div className="p-5 h-full flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-foreground shrink-0">
                  <BotIcon className="size-4" />
                </div>
                <div>
                  <h3 className="text-foreground font-semibold text-sm mb-1">
                    And Any Other Business
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    If your business takes appointments or reservations, our AI voice agent can handle it.
                  </p>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </FrameBox>
      </section>

      {/* CTA */}
      <section className="max-w-[1160px] mx-auto px-6">
        <FrameBox corners="bottom" className="py-24 px-8 text-center">
          <AnimateOnScroll>
            <div className="flex justify-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center">
                <ZapIcon className="size-5 text-foreground" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to automate your bookings?
            </h2>
            <p className="text-muted-foreground text-base mb-8 max-w-md mx-auto">
              Join businesses using AI voice agents to handle reservations around the clock.
            </p>
            <div className="flex justify-center gap-3.5">
              <Link
                href="/sign-up"
                className="inline-flex items-center rounded-lg bg-foreground px-7 py-3 text-sm font-medium text-background hover:bg-foreground/90 transition-all hover:-translate-y-px shadow-lg shadow-white/5"
              >
                Get started for free
                <ArrowRightIcon className="ml-2 size-3.5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center rounded-lg border border-border px-7 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Learn more
              </Link>
            </div>
          </AnimateOnScroll>
        </FrameBox>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-[1160px] mx-auto px-6 pt-16 pb-10">
          <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="shrink-0">
                  <rect width="28" height="28" rx="7" fill="white" />
                  <rect x="6.5" y="11" width="2" height="6" rx="1" fill="#0a0a0a" opacity="0.35" />
                  <rect x="10" y="8.5" width="2" height="11" rx="1" fill="#0a0a0a" opacity="0.55" />
                  <rect x="13.5" y="6" width="2" height="16" rx="1" fill="#0a0a0a" />
                  <rect x="17" y="9" width="2" height="10" rx="1" fill="#0a0a0a" opacity="0.55" />
                  <rect x="20.5" y="11.5" width="2" height="5" rx="1" fill="#0a0a0a" opacity="0.35" />
                </svg>
                <span className="font-bold text-foreground text-lg">Liveagent.dev</span>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px]">
                Open-source AI voice agents for reservations and bookings. Built on Google Gemini Live API.
              </p>
            </div>
            {[
              {
                title: "Product",
                links: [
                  { label: "Features", href: "#features" },
                  { label: "How It Works", href: "#how-it-works" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "About", href: "/about" },
                  { label: "Support", href: "mailto:support@liveagent.dev" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-sm font-semibold text-foreground mb-4">
                  {col.title}
                </div>
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block text-sm text-muted-foreground mb-2.5 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-6 flex justify-between items-center flex-wrap gap-4">
            <span className="text-muted-foreground/60 text-xs">
              &copy; {new Date().getFullYear()} Liveagent.dev. Built on Google Cloud.
            </span>
            <div className="flex gap-5">
              <Link href="/terms" className="text-muted-foreground/60 text-xs hover:text-muted-foreground transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-muted-foreground/60 text-xs hover:text-muted-foreground transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
