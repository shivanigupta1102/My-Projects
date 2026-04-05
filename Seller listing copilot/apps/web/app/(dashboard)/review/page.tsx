"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PaginatedResponse } from "@listingpilot/shared-types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiGet } from "@/lib/api";

/** Matches GET /review-queue (may omit optional fields depending on API version). */
type ReviewQueueApiItem = {
  id?: string;
  attributeId: string;
  productId: string;
  fieldName: string;
  value: string;
  confidence: number;
  method: string;
  requiresReview?: boolean;
  conflicted: boolean;
  /** Present on some API versions; used as fallback when product list has no match. */
  productTitle?: string;
};

type ProductListRow = {
  id: string;
  title: string | null;
};

function confidenceBand(confidence: number): "low" | "medium" | "high" {
  if (confidence < 0.6) return "low";
  if (confidence < 0.85) return "medium";
  return "high";
}

function matchesConfidenceFilter(
  confidence: number,
  filter: string,
): boolean {
  if (filter === "all") return true;
  const band = confidenceBand(confidence);
  return band === filter;
}

export default function ReviewQueuePage() {
  const [productFilter, setProductFilter] = useState<string>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const [queue, setQueue] = useState<ReviewQueueApiItem[]>([]);
  const [productTitleById, setProductTitleById] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [queueData, productsRes] = await Promise.all([
          apiGet<ReviewQueueApiItem[]>("/review-queue"),
          apiGet<PaginatedResponse<ProductListRow>>("/products?limit=100"),
        ]);
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const p of productsRes.data) {
          map[p.id] = p.title?.trim() || "(untitled)";
        }
        setProductTitleById(map);
        setQueue(queueData);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load review queue");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedQueue = useMemo(() => {
    return [...queue].sort((a, b) => a.confidence - b.confidence);
  }, [queue]);

  const productOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const item of queue) ids.add(item.productId);
    const titleFallback: Record<string, string> = {};
    for (const item of queue) {
      if (!titleFallback[item.productId] && item.productTitle) {
        titleFallback[item.productId] = item.productTitle;
      }
    }
    const rows = [...ids]
      .map((id) => ({
        id,
        title: productTitleById[id] ?? titleFallback[id] ?? id,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
    return rows;
  }, [queue, productTitleById]);

  const filteredQueue = useMemo(() => {
    return sortedQueue.filter((q) => {
      const matchP =
        productFilter === "all" || q.productId === productFilter;
      const matchC = matchesConfidenceFilter(q.confidence, confidenceFilter);
      return matchP && matchC;
    });
  }, [sortedQueue, productFilter, confidenceFilter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-7xl space-y-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Lowest confidence and conflicted fields first — keyboard-first workflow.
          </p>
          {!loading && !error && (
            <p className="mt-2 font-mono text-xs text-accent">
              {filteredQueue.length === sortedQueue.length
                ? `${sortedQueue.length} item${sortedQueue.length === 1 ? "" : "s"} in queue`
                : `Showing ${filteredQueue.length} of ${sortedQueue.length} items`}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground-muted">Product</Label>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[260px] bg-surface">
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                {productOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-foreground-muted">Confidence</Label>
            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-[200px] bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="low">Low (&lt;60%)</SelectItem>
                <SelectItem value="medium">Medium (60–84%)</SelectItem>
                <SelectItem value="high">High (85%+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading && (
        <div
          className="flex min-h-[240px] items-center justify-center rounded-lg border border-border bg-surface"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
          <span className="sr-only">Loading review queue</span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-border border-error/40 bg-surface px-4 py-6 text-center text-sm text-error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {filteredQueue.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface px-4 py-12 text-center text-sm text-foreground-muted">
              No items match the current filters.
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredQueue.map((item) => {
                const rowKey = item.id || item.attributeId;
                const title =
                  productTitleById[item.productId] ??
                  item.productTitle ??
                  "(unknown product)";
                const pct = Math.round(item.confidence * 100);
                return (
                  <li
                    key={rowKey}
                    className="rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {title}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {item.fieldName}
                        </p>
                        <p className="break-words text-sm text-foreground">
                          {item.value}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        <span className="font-mono text-xs text-foreground-muted">
                          {pct}%
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {item.method}
                        </Badge>
                        {item.conflicted && (
                          <Badge variant="warning">Conflicted</Badge>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface px-4 py-3 text-center text-xs text-foreground-muted">
        <kbd className="rounded border border-border-light bg-background px-1.5 py-0.5 font-mono text-foreground">
          A
        </kbd>{" "}
        approve ·{" "}
        <kbd className="rounded border border-border-light bg-background px-1.5 py-0.5 font-mono text-foreground">
          E
        </kbd>{" "}
        edit ·{" "}
        <kbd className="rounded border border-border-light bg-background px-1.5 py-0.5 font-mono text-foreground">
          →
        </kbd>{" "}
        next field ·{" "}
        <kbd className="rounded border border-border-light bg-background px-1.5 py-0.5 font-mono text-foreground">
          Esc
        </kbd>{" "}
        blur
      </div>
    </motion.div>
  );
}
