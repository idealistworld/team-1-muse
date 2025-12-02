"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  LineChart,
  Link as LinkIcon,
  Mic,
  Radar,
  Sparkles,
  TrendingUp,
  Waves,
} from "lucide-react";

const steps = [
  {
    title: "Add the creators you want to emulate",
    description: "Paste LinkedIn profile URLs. We fetch their posts, cadence, hooks, and formats automatically.",
    icon: LinkIcon,
  },
  {
    title: "We analyze every signal that moves the algo",
    description: "Engagement velocity, comment quality, posting windows, CTAs, and what actually converts.",
    icon: Radar,
  },
  {
    title: "Cross-analyze to spot trends in the wild",
    description: "See what’s hot now vs. last week across multiple profiles, industries, and formats.",
    icon: Activity,
  },
  {
    title: "AI writes posts that win today",
    description: "Posts tailored to your voice that mirror current winners—complete with hooks, angles, and CTAs.",
    icon: Bot,
  },
];

const features = [
  {
    title: "Real-time creator tracking",
    description: "Always-on monitoring that surfaces fresh wins the moment they hit the feed.",
    icon: Waves,
    metric: "Live",
  },
  {
    title: "Pattern recognition across accounts",
    description: "Find shared hooks, structures, and offers that pull comments—not just impressions.",
    icon: BarChart3,
    metric: "136 patterns",
  },
  {
    title: "Trend radar: this week vs last",
    description: "Know what’s spiking now. Get alerts when a format cools off so you don’t waste posts.",
    icon: TrendingUp,
    metric: "+42% lift",
  },
  {
    title: "AI post generation",
    description: "Ship posts designed for engagement and sales, tuned to the angles that are winning today.",
    icon: Sparkles,
    metric: "Ready in 12s",
  },
  {
    title: "Performance tracking",
    description: "See what you publish, what you borrowed, and how the algo responds—day by day.",
    icon: LineChart,
    metric: "2.3x–16.1x",
  },
  {
    title: "Voice mode + profile intelligence",
    description: "Fast edits, consistent tone, and a live score that shows how “magnetic” your profile reads.",
    icon: Mic,
    metric: "91 score",
  },
];

const feedItems = [
  {
    author: "Tara Quinn · SaaS",
    headline: "Carousel with upfront promise + screenshot proof",
    delta: "+12.4x engagement",
    tags: ["Carousel", "Screenshot proof", "Outbound CTA"],
    stat: "8.9% CTR to demo",
  },
  {
    author: "Leo Chen · Agency",
    headline: "Story arc + contrarian hook + offer in comments",
    delta: "+7.2x saves",
    tags: ["Story", "Contrarian", "Comment CTA"],
    stat: "52% lift vs. last week",
  },
  {
    author: "Priya Singh · AI",
    headline: "2-line hook + punchy visual + short thread",
    delta: "+4.6x comments",
    tags: ["Visual", "Thread", "Hook first"],
    stat: "Trending now",
  },
];

const statPills = [
  { label: "Creators watched", value: "47" },
  { label: "Posts analyzed", value: "519" },
  { label: "Engagement range", value: "16.1x → 2.3x" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(76,106,255,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(80,227,194,0.16),transparent_30%),radial-gradient(circle_at_70%_60%,rgba(255,149,128,0.12),transparent_28%)]" />
        <div className="absolute inset-0 opacity-[0.22] bg-[linear-gradient(120deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_35%,rgba(255,255,255,0)_50%,rgba(255,255,255,0.12)_70%)]" />
        <div className="absolute inset-0 bg-grid-fade opacity-30" />

        {/* Hero */}
        <section className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-20 pt-20 md:pt-28 lg:flex-row lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative z-10 w-full space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-white/70 shadow-lg shadow-blue-500/10 backdrop-blur">
              <Sparkles className="h-4 w-4 text-sky-300" />
              <span>LinkedIn Growth AI · Built to game the feed</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Game the LinkedIn Algorithm with AI
              </h1>
              <p className="max-w-2xl text-lg text-white/70 sm:text-xl">
                We analyze top creators in real-time, spot what&apos;s working, and write posts that actually get traction.
                No guesswork—just formats the algo is rewarding today.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/dashboard/create"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-xl shadow-cyan-500/30 transition duration-300 hover:brightness-110"
              >
                Start Growing Your Brand
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
              >
                See live analytics
              </Link>
            </div>
            <div className="flex flex-col gap-3 text-sm text-white/60 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>What&apos;s hot now vs. last week</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Voice mode for quick edits</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Profile intelligence scoring</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.08 }}
            className="relative z-10 w-full lg:max-w-[40rem]"
          >
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -right-8 -bottom-12 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-cyan-500/20 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Live creator feed
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                  Real-time
                </div>
              </div>

              <div className="grid gap-4 p-6">
                {feedItems.map((item) => (
                  <div
                    key={item.headline}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-blue-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-white/70">{item.author}</div>
                      <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                        {item.delta}
                      </div>
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">{item.headline}</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/5 px-3 py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {item.stat}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/5 bg-slate-900/30 px-6 py-4">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    AI suggests the next post angle in real-time.
                  </div>
                  <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Ready to ship
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {statPills.map((pill) => (
                <motion.div
                  key={pill.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 shadow-md shadow-cyan-500/10"
                >
                  <div className="text-xs uppercase tracking-wide text-white/50">{pill.label}</div>
                  <div className="text-lg font-semibold text-white">{pill.value}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>

      {/* Problem & solution */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 shadow-2xl shadow-sky-500/10 md:px-10 md:py-12">
          <div className="grid gap-8 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-3"
            >
              <div className="text-sm font-semibold uppercase tracking-wider text-white/60">
                Problem
              </div>
              <h3 className="text-2xl font-semibold text-white">Organic guesswork is slow and expensive</h3>
              <p className="text-white/70">
                Posting blindly burns time and reach. The algo rewards the patterns it&apos;s already seeing work. You
                need to know those patterns before you post—and ship fast with your own angle.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-5"
            >
              <div className="text-sm font-semibold uppercase tracking-wider text-emerald-200">
                Solution
              </div>
              <h3 className="text-2xl font-semibold text-white">A growth OS built to game LinkedIn</h3>
              <p className="text-white/70">
                Muse tracks your target creators, reverse-engineers what triggers engagement, and generates posts that
                match the winning formats—so you publish with confidence and convert the attention you earn.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex items-center justify-between gap-4 pb-6">
          <div>
            <h2 className="text-3xl font-semibold text-white">How it works</h2>
            <p className="mt-2 text-white/60">4 steps to turn the algorithm into your edge.</p>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 sm:flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Built for operators, not lurkers.
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut", delay: idx * 0.05 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-sky-500/10"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-cyan-200 ring-1 ring-white/10">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-lg font-semibold text-white">{step.title}</div>
                <p className="mt-2 text-sm text-white/60">{step.description}</p>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex items-center justify-between gap-4 pb-6">
          <div>
            <h2 className="text-3xl font-semibold text-white">Analytical features that move the needle</h2>
            <p className="mt-2 text-white/60">
              Built for revenue-minded creators who need to see what works before they hit publish.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, ease: "easeOut", delay: idx * 0.04 }}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-blue-500/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-cyan-200 ring-1 ring-white/10">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/60">
                      {feature.metric}
                    </span>
                  </div>
                  <p className="text-sm text-white/60">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Social proof */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.04] to-slate-900 px-6 py-10 shadow-2xl shadow-cyan-500/10 md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">Proof it works</h2>
              <p className="mt-2 text-white/65">
                Data from operators who want sales, not vanity metrics.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
              <LineChart className="h-4 w-4 text-emerald-300" />
              Engagement wins from active campaigns
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-5 py-6">
              <div className="text-sm text-white/60">Posts analyzed</div>
              <div className="mt-2 text-3xl font-semibold text-white">519</div>
              <p className="mt-2 text-sm text-white/60">Across 47 top creators</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-5 py-6">
              <div className="text-sm text-white/60">Engagement lift</div>
              <div className="mt-2 text-3xl font-semibold text-white">16.1x → 2.3x</div>
              <p className="mt-2 text-sm text-white/60">Range of average uplift per post</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-5 py-6">
              <div className="text-sm text-white/60">Time to publish</div>
              <div className="mt-2 text-3xl font-semibold text-white">12 seconds</div>
              <p className="mt-2 text-sm text-white/60">AI drafts optimized for current trends</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-5 py-6">
              <div className="text-sm text-white/60">Profile intelligence score</div>
              <div className="mt-2 text-3xl font-semibold text-white">91 / 100</div>
              <p className="mt-2 text-sm text-white/60">Voice consistency + CTA clarity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-800 px-6 py-10 shadow-2xl shadow-cyan-500/20 md:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(80,227,194,0.18),transparent_35%),radial-gradient(circle_at_75%_10%,rgba(76,106,255,0.14),transparent_35%)]" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
                Ready when you are
              </div>
              <h3 className="text-3xl font-semibold text-white">Start growing your brand today</h3>
              <p className="text-white/65">
                Skip the guesswork. Get the signals, trends, and AI posts that make LinkedIn work for you—today, not next
                quarter.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/dashboard/create"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition duration-300 hover:brightness-110"
              >
                Start Growing Your Brand
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
