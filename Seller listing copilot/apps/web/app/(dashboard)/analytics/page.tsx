"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  ClipboardList,
  Loader2,
  Package,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { DashboardSummary } from "@listingpilot/shared-types";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";

type ChannelRow = {
  channel: string;
  count: number;
  avgQuality: number;
};

function normalizeCompleteness(raw: unknown): ChannelRow[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item !== "object" || item === null || !("channel" in item)) {
          return null;
        }
        const o = item as Record<string, unknown>;
        const channel = String(o.channel);
        const count = typeof o.count === "number" ? o.count : 0;
        const avgQuality =
          typeof o.avgQuality === "number"
            ? o.avgQuality
            : typeof o.completeness === "number"
              ? o.completeness
              : 0;
        return { channel, count, avgQuality };
      })
      .filter((x): x is ChannelRow => x != null);
  }
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, { count?: number; avgQuality?: number }>).map(
      ([channel, v]) => ({
        channel,
        count: typeof v?.count === "number" ? v.count : 0,
        avgQuality: typeof v?.avgQuality === "number" ? v.avgQuality : 0,
      }),
    );
  }
  return [];
}

/** Display 0–100 for quality / completeness scalars that may be 0–1 or 0–100. */
function toPercentDisplay(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n >= 0 && n <= 1) return Math.round(n * 100);
  return Math.min(100, Math.round(n));
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {label}
      </div>
      <div className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [channels, setChannels] = useState<ChannelRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, completenessRaw] = await Promise.all([
        apiGet<DashboardSummary>("/analytics/summary"),
        apiGet<unknown>("/analytics/completeness"),
      ]);
      setSummary(summaryData);
      setChannels(
        normalizeCompleteness(completenessRaw).sort((a, b) =>
          a.channel.localeCompare(b.channel),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
      setSummary(null);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const avgCompletenessPct =
    summary != null ? toPercentDisplay(summary.avgCompleteness) : 0;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Publishing performance, completeness, and channel quality.
        </p>
      </div>

      {loading ? (
        <div
          className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface py-16"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
          <p className="text-sm text-foreground-muted">Loading analytics…</p>
        </div>
      ) : error ? (
        <div
          className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error"
          role="alert"
        >
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Products"
              value={summary != null ? String(summary.totalProducts) : "—"}
              icon={Package}
            />
            <StatCard
              label="Published Listings"
              value={summary != null ? String(summary.publishedListings) : "—"}
              icon={Send}
            />
            <StatCard
              label="Avg Completeness"
              value={summary != null ? `${avgCompletenessPct}%` : "—"}
              icon={BarChart3}
            />
            <StatCard
              label="Review Queue Size"
              value={summary != null ? String(summary.productsNeedingReview) : "—"}
              icon={ClipboardList}
            />
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-medium text-foreground">
              Channel completeness
            </h2>
            <p className="mb-4 text-xs text-foreground-muted">
              Average listing quality score by channel (from your catalog).
            </p>
            {channels.length === 0 ? (
              <p className="text-sm text-foreground-muted">
                No channel data yet. Connect listings to see completeness by channel.
              </p>
            ) : (
              <div className="space-y-3">
                {channels.map((ch) => {
                  const pct = toPercentDisplay(ch.avgQuality);
                  return (
                    <div key={ch.channel} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-xs text-foreground-muted">
                        {ch.channel}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-bg-overlay">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={cn(
                              "h-full rounded-full",
                              pct >= 90
                                ? "bg-confidence-high"
                                : pct >= 70
                                  ? "bg-confidence-medium"
                                  : "bg-confidence-low",
                            )}
                          />
                        </div>
                      </div>
                      <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums text-foreground">
                        {pct}%
                      </span>
                      <span className="hidden w-12 shrink-0 text-right text-2xs text-foreground-muted sm:inline">
                        n={ch.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
