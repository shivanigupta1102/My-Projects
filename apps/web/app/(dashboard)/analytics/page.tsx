"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const mockChannelHealth = [
  { channel: "Amazon", score: 94, trend: "up" as const, active: 45, suppressed: 2 },
  { channel: "eBay", score: 88, trend: "stable" as const, active: 32, suppressed: 0 },
  { channel: "Etsy", score: 100, trend: "up" as const, active: 18, suppressed: 0 },
  { channel: "Shopify", score: 91, trend: "down" as const, active: 28, suppressed: 1 },
  { channel: "Walmart", score: 76, trend: "down" as const, active: 12, suppressed: 3 },
];

const mockConfidenceDistribution = { high: 68, medium: 24, low: 8 };

const mockPublishRates = [
  { channel: "Amazon", rate: 92 },
  { channel: "eBay", rate: 97 },
  { channel: "Etsy", rate: 100 },
  { channel: "Shopify", rate: 88 },
  { channel: "Walmart", rate: 74 },
];

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: typeof BarChart3;
}) {
  const isPositive = delta?.startsWith("+") || delta?.includes("up");
  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 font-mono text-3xl font-semibold text-text-primary tracking-tight">
        {value}
      </div>
      {delta && (
        <div
          className={cn(
            "mt-1 text-xs",
            isPositive ? "text-confidence-high" : "text-compliance-blocking",
          )}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Publishing performance, confidence trends, and channel health.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Products" value="142" delta="+12 this week" icon={BarChart3} />
        <StatCard label="Published" value="89" delta="+5 today" icon={TrendingUp} />
        <StatCard label="Avg Confidence" value="0.84" delta="+0.03" icon={Target} />
        <StatCard label="Review Queue" value="7" delta="3 blocking" icon={TrendingDown} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-bg-surface p-5">
          <h2 className="mb-4 text-sm font-medium text-text-secondary">
            Channel Health
          </h2>
          <div className="space-y-3">
            {mockChannelHealth.map((ch) => (
              <div key={ch.channel} className="flex items-center gap-3">
                <span className="w-16 text-xs text-text-secondary">{ch.channel}</span>
                <div className="flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-bg-overlay">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ch.score}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        ch.score >= 90 ? "bg-confidence-high" : ch.score >= 70 ? "bg-confidence-medium" : "bg-confidence-low",
                      )}
                    />
                  </div>
                </div>
                <span className="w-10 text-right font-mono text-xs tabular-nums text-text-primary">
                  {ch.score}%
                </span>
                {ch.trend === "up" && <TrendingUp className="h-3 w-3 text-confidence-high" />}
                {ch.trend === "down" && <TrendingDown className="h-3 w-3 text-compliance-blocking" />}
                {ch.trend === "stable" && <span className="h-3 w-3 text-text-tertiary">—</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-bg-surface p-5">
          <h2 className="mb-4 text-sm font-medium text-text-secondary">
            Confidence Distribution
          </h2>
          <div className="flex items-end gap-4">
            <div className="flex-1 text-center">
              <div className="mx-auto h-32 w-full max-w-[60px] overflow-hidden rounded-t-md bg-bg-overlay">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${mockConfidenceDistribution.high}%` }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mt-auto w-full rounded-t-md bg-confidence-high"
                  style={{ marginTop: `${100 - mockConfidenceDistribution.high}%` }}
                />
              </div>
              <div className="mt-2 text-2xs text-text-secondary">High</div>
              <div className="font-mono text-xs text-text-primary">{mockConfidenceDistribution.high}%</div>
            </div>
            <div className="flex-1 text-center">
              <div className="mx-auto h-32 w-full max-w-[60px] overflow-hidden rounded-t-md bg-bg-overlay">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${mockConfidenceDistribution.medium}%` }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="w-full rounded-t-md bg-confidence-medium"
                  style={{ marginTop: `${100 - mockConfidenceDistribution.medium}%` }}
                />
              </div>
              <div className="mt-2 text-2xs text-text-secondary">Medium</div>
              <div className="font-mono text-xs text-text-primary">{mockConfidenceDistribution.medium}%</div>
            </div>
            <div className="flex-1 text-center">
              <div className="mx-auto h-32 w-full max-w-[60px] overflow-hidden rounded-t-md bg-bg-overlay">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${mockConfidenceDistribution.low}%` }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="w-full rounded-t-md bg-confidence-low"
                  style={{ marginTop: `${100 - mockConfidenceDistribution.low}%` }}
                />
              </div>
              <div className="mt-2 text-2xs text-text-secondary">Low</div>
              <div className="font-mono text-xs text-text-primary">{mockConfidenceDistribution.low}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-text-secondary">
          Publish Success Rate by Channel
        </h2>
        <div className="space-y-3">
          {mockPublishRates.map((ch) => (
            <div key={ch.channel} className="flex items-center gap-3">
              <span className="w-16 text-xs text-text-secondary">{ch.channel}</span>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-bg-overlay">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ch.rate}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-indigo-500"
                  />
                </div>
              </div>
              <span className="w-10 text-right font-mono text-xs tabular-nums text-text-primary">
                {ch.rate}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
