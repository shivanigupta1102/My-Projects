"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";

const CHANNEL_ORDER = [
  "AMAZON",
  "EBAY",
  "WALMART",
  "SHOPIFY",
  "ETSY",
] as const;

const CHANNEL_LABEL: Record<(typeof CHANNEL_ORDER)[number], string> = {
  AMAZON: "Amazon",
  EBAY: "eBay",
  WALMART: "Walmart",
  SHOPIFY: "Shopify",
  ETSY: "Etsy",
};

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
    return Object.entries(
      raw as Record<string, { count?: number; avgQuality?: number; completeness?: number }>,
    ).map(([channel, v]) => ({
      channel,
      count: typeof v?.count === "number" ? v.count : 0,
      avgQuality:
        typeof v?.avgQuality === "number"
          ? v.avgQuality
          : typeof v?.completeness === "number"
            ? v.completeness
            : 0,
    }));
  }
  return [];
}

function toPercentDisplay(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n >= 0 && n <= 1) return Math.round(n * 100);
  return Math.min(100, Math.round(n));
}

export default function ChannelsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ChannelRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const completenessRaw = await apiGet<unknown>("/analytics/completeness");
      setRows(
        normalizeCompleteness(completenessRaw).map((r) => ({
          ...r,
          channel: r.channel.trim().toUpperCase(),
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load channels");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byChannel = new Map(rows.map((r) => [r.channel, r]));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Channels
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Listing volume and average quality by marketplace.
          </p>
        </div>
        <Link
          href="/settings/channels"
          className="inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-border-bright hover:bg-bg-overlay"
        >
          Configure channels
        </Link>
      </div>

      {loading ? (
        <div
          className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface py-16"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
          <p className="text-sm text-foreground-muted">Loading channels…</p>
        </div>
      ) : error ? (
        <div
          className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error"
          role="alert"
        >
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHANNEL_ORDER.map((id) => {
            const data = byChannel.get(id);
            const listings = data?.count ?? 0;
            const qualityPct = toPercentDisplay(data?.avgQuality ?? 0);
            const active = listings > 0;

            return (
              <div
                key={id}
                className="rounded-lg border border-border bg-surface p-5 shadow-sm transition-colors hover:border-border-bright"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {CHANNEL_LABEL[id]}
                    </p>
                    <p className="mt-0.5 text-2xs uppercase tracking-wide text-foreground-muted">
                      {id}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-medium",
                      active
                        ? "border-confidence-high/40 bg-confidence-high/10 text-confidence-high"
                        : "border-border text-foreground-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        active ? "bg-confidence-high" : "bg-foreground-muted",
                      )}
                      aria-hidden
                    />
                    {active ? "Active" : "Inactive"}
                  </span>
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-foreground-muted">Listings</dt>
                    <dd className="font-mono tabular-nums text-foreground">{listings}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-foreground-muted">Avg. quality</dt>
                    <dd className="font-mono tabular-nums text-foreground">
                      {active ? `${qualityPct}%` : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
