"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { PaginatedResponse } from "@listingpilot/shared-types";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/auth";
import { apiGet } from "@/lib/api";

/** Matches GET /analytics/summary; also tolerates legacy `DashboardSummary` fields from the API. */
type AnalyticsSummary = {
  totalProducts: number;
  avgCompleteness: number;
  totalPublished?: number;
  totalIngestions?: number;
  publishedListings?: number;
};

type ProductRow = {
  id: string;
  title: string | null;
  status: string;
};

type PublishEventRow = {
  id: string;
  channel: string;
  status: string;
  createdAt: string;
  publishedAt: string | null;
  product?: { title: string | null };
};

function greetingHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function normalizeSummary(raw: AnalyticsSummary) {
  const published =
    typeof raw.totalPublished === "number"
      ? raw.totalPublished
      : typeof raw.publishedListings === "number"
        ? raw.publishedListings
        : 0;
  const totalIngestions =
    typeof raw.totalIngestions === "number" ? raw.totalIngestions : 0;
  return {
    totalProducts: raw.totalProducts,
    published,
    avgCompleteness: raw.avgCompleteness,
    totalIngestions,
  };
}

function formatProductStatus(status: string): string {
  return status.replaceAll("_", " ");
}

function productStatusVariant(
  status: string,
): "warning" | "success" | "outline" | "default" {
  switch (status) {
    case "REVIEW_READY":
      return "warning";
    case "APPROVED":
      return "success";
    case "PUBLISHED":
      return "default";
    case "ARCHIVED":
      return "outline";
    default:
      return "outline";
  }
}

function publishStatusVariant(
  status: string,
): "success" | "error" | "warning" | "outline" {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "error";
    case "PENDING":
      return "warning";
    case "ROLLED_BACK":
      return "outline";
    default:
      return "outline";
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function DashboardHomePage() {
  const name = useAuthStore((s) => s.user?.name ?? "Operator");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReturnType<typeof normalizeSummary> | null>(
    null,
  );
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [publishEvents, setPublishEvents] = useState<PublishEventRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRaw, productsRes, eventsRes] = await Promise.all([
        apiGet<AnalyticsSummary>("/analytics/summary"),
        apiGet<PaginatedResponse<ProductRow>>("/products?limit=5&page=1"),
        apiGet<PaginatedResponse<PublishEventRow>>("/publish/events?limit=5&page=1"),
      ]);
      setStats(normalizeSummary(summaryRaw));
      setProducts(productsRes.data);
      setPublishEvents(eventsRes.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
      setStats(null);
      setProducts([]);
      setPublishEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {greetingHour()}, {name.split(" ")[0] ?? name}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Workspace overview — products, completeness, and recent publish activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="default">
            <Link href="/ingest">Ingest New Product</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/products">View All Products</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div
          className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface py-16"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
          <p className="text-sm text-foreground-muted">Loading dashboard…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Total products
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                {stats?.totalProducts ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Published
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                {stats?.published ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Avg completeness
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                {stats != null
                  ? `${Math.round(stats.avgCompleteness)}%`
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Total ingestions
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                {stats?.totalIngestions ?? "—"}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle className="text-base">Recent products</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                {products.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-foreground-muted">
                    No products yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right"> </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="max-w-[200px] font-medium">
                            <span className="line-clamp-2">
                              {p.title?.trim() || "(Untitled)"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={productStatusVariant(p.status)}>
                              {formatProductStatus(p.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/products/${p.id}`}
                              className="text-sm text-accent hover:underline"
                            >
                              View
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle className="text-base">Recent publish events</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                {publishEvents.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-foreground-muted">
                    No publish events yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {publishEvents.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium text-foreground">
                            {row.channel}
                          </TableCell>
                          <TableCell>
                            <Badge variant={publishStatusVariant(row.status)}>
                              {row.status.replaceAll("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground-muted">
                            {formatDate(row.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
