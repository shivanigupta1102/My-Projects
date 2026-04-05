"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Layers,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const channels = ["Amazon", "eBay", "Walmart", "Shopify", "Etsy"];

const features = [
  {
    title: "Multi-input Ingestion",
    desc: "Drop images, spreadsheets, PDFs, or URLs — we normalize everything into a single product truth.",
    icon: Layers,
  },
  {
    title: "Evidence-backed Extraction",
    desc: "Every field links to source snippets so reviewers can trust or override in seconds.",
    icon: ShieldCheck,
  },
  {
    title: "Channel-specific Packages",
    desc: "Generate Amazon, eBay, Walmart, Shopify, and Etsy payloads from one canonical record.",
    icon: Sparkles,
  },
  {
    title: "Post-publish Monitoring",
    desc: "Catch suppressions, drift, and policy issues before they cost you the buy box.",
    icon: BarChart3,
  },
];

const steps = [
  { step: "01", title: "Ingest", body: "Upload assets or paste a URL — we fingerprint and dedupe sources." },
  { step: "02", title: "Extract", body: "Vision + LLM extraction with confidence scores per attribute." },
  { step: "03", title: "Review", body: "Triage only uncertain fields with evidence side-by-side." },
  { step: "04", title: "Publish", body: "Validate per channel, then push live or schedule dry runs." },
];

const pricing = [
  { name: "Growth", price: "$49", period: "/mo", blurb: "Solo operators, up to 500 SKUs." },
  { name: "Pro", price: "$149", period: "/mo", blurb: "Growing brands, priority ingestion, SSO-ready.", highlight: true },
  { name: "Team", price: "$399", period: "/mo", blurb: "Multi-seat, audit exports, dedicated success." },
];

export default function MarketingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="text-center"
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Listing intelligence
        </p>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          <span className="bg-gradient-to-r from-foreground via-accent to-foreground-muted bg-clip-text text-transparent">
            Your AI Listing Copilot
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground-muted">
          Drop anything in → AI extracts every field → Review only what&apos;s uncertain → One click to go live
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="gap-2" asChild>
            <Link href="/signup">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-2 border-border bg-surface/50" asChild>
            <Link href="#how">
              <Play className="h-4 w-4" />
              Watch Demo
            </Link>
          </Button>
        </div>
      </motion.section>

      <section className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            variants={fadeIn}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <Card className="h-full border-border bg-surface/80 backdrop-blur">
              <CardContent className="p-5">
                <f.icon className="h-8 w-8 text-accent" aria-hidden />
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-foreground-muted">{f.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mt-20 rounded-xl border border-border bg-surface/60 px-4 py-8"
      >
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Supported channels
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {channels.map((c) => (
            <span
              key={c}
              className="text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              {c}
            </span>
          ))}
        </div>
      </motion.section>

      <section id="how" className="mt-24">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-2xl font-semibold tracking-tight"
        >
          How it works
        </motion.h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="relative rounded-lg border border-border bg-surface p-5"
            >
              <span className="font-mono text-xs text-accent">{s.step}</span>
              <h3 className="mt-2 font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-foreground-muted">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-24">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-2xl font-semibold tracking-tight"
        >
          Pricing
        </motion.h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pricing.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Card
                className={`h-full border-border ${
                  p.highlight ? "bg-accent/10 ring-1 ring-accent/40" : "bg-surface"
                }`}
              >
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-foreground-muted">{p.name}</p>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{p.price}</span>
                    <span className="text-foreground-muted">{p.period}</span>
                  </p>
                  <p className="mt-4 text-sm text-foreground-muted">{p.blurb}</p>
                  <Button className="mt-6 w-full" variant={p.highlight ? "default" : "secondary"} asChild>
                    <Link href="/signup">Get started</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
