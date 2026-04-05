"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { apiGet, apiPost } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Local types — do not import from @listingpilot/shared-types */

interface ValidationRow {
  id: string;
  severity: string;
  field: string;
  rule: string;
  message: string;
}

interface ListingPackage {
  id: string;
  productId: string;
  channel: string;
  status: string;
  title: string;
  qualityScore: number | null;
  complianceGate: string;
  validations: ValidationRow[];
}

interface PublishEvent {
  id: string;
  productId: string;
  channel: string;
  status: string;
  dryRun: boolean;
  channelListingId: string | null;
  errorMessage: string | null;
  createdAt: string;
  product: { title: string };
}

interface PublishEventsResponse {
  data: PublishEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CHANNEL_LABEL: Record<string, string> = {
  AMAZON: "Amazon",
  EBAY: "eBay",
  WALMART: "Walmart",
  SHOPIFY: "Shopify",
  ETSY: "Etsy",
};

function channelLabel(channel: string): string {
  return CHANNEL_LABEL[channel] ?? channel;
}

function blockingCount(pkg: ListingPackage): number {
  return pkg.validations.filter((v) => v.severity === "BLOCKING").length;
}

function formatQuality(score: number | null): string {
  if (score == null || Number.isNaN(score)) return "—";
  const n = score <= 1 ? Math.round(score * 100) : Math.round(score);
  return `${n}%`;
}

function eventResultLabel(ev: PublishEvent): string {
  if (ev.dryRun) return "Dry run";
  switch (ev.status) {
    case "SUCCESS":
      return "Success";
    case "FAILED":
      return "Failed";
    case "PENDING":
      return "Pending";
    case "ROLLED_BACK":
      return "Rolled back";
    default:
      return ev.status;
  }
}

function eventBadgeVariant(
  ev: PublishEvent,
): "success" | "error" | "warning" | "default" {
  if (ev.dryRun) return "warning";
  if (ev.status === "SUCCESS") return "success";
  if (ev.status === "FAILED") return "error";
  if (ev.status === "PENDING") return "warning";
  return "default";
}

function eventDetail(ev: PublishEvent): string {
  if (ev.errorMessage) return ev.errorMessage;
  if (ev.channelListingId) return ev.channelListingId;
  return ev.product?.title ?? "—";
}

function parseErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const msg = err.response?.data?.error;
    if (typeof msg === "string" && msg.length) return msg;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export default function PublishCenterPage() {
  const params = useParams();
  const rawId = params.id;
  const productId =
    typeof rawId === "string" ? rawId : Array.isArray(rawId) ? (rawId[0] ?? "") : "";

  const [dryRun, setDryRun] = useState(true);

  const [packages, setPackages] = useState<ListingPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  const [eventsPage, setEventsPage] = useState<PublishEventsResponse | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [publishingId, setPublishingId] = useState<string | null>(null);

  const loadPackages = useCallback(async () => {
    if (!productId) return;
    setPackagesLoading(true);
    setPackagesError(null);
    try {
      const data = await apiGet<ListingPackage[]>(
        `/listing-packages/product/${productId}`,
      );
      setPackages(data);
    } catch (err) {
      const msg = parseErrorMessage(err);
      setPackagesError(msg);
    } finally {
      setPackagesLoading(false);
    }
  }, [productId]);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const res = await apiGet<PublishEventsResponse>(
        `/publish/events?page=1&limit=100`,
      );
      setEventsPage(res);
    } catch (err) {
      const msg = parseErrorMessage(err);
      setEventsError(msg);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const productEvents = useMemo(() => {
    if (!eventsPage?.data?.length) return [];
    return eventsPage.data.filter((e) => e.productId === productId);
  }, [eventsPage, productId]);

  async function handlePublish(pkg: ListingPackage) {
    setPublishingId(pkg.id);
    try {
      await apiPost<unknown, { listingPackageId: string; channel: string; dryRun?: boolean }>(
        "/publish",
        {
          listingPackageId: pkg.id,
          channel: pkg.channel,
          dryRun,
        },
      );
      if (dryRun) {
        toast.success("Dry run finished", {
          description: `No live changes for ${channelLabel(pkg.channel)}.`,
        });
      } else {
        toast.success("Listing published", {
          description: channelLabel(pkg.channel),
        });
      }
      await loadPackages();
      await loadEvents();
    } catch (err) {
      const msg = parseErrorMessage(err);
      toast.error("Publish failed", { description: msg });
    } finally {
      setPublishingId(null);
    }
  }

  if (!productId) {
    return (
      <div className="mx-auto max-w-5xl p-6 text-sm text-foreground-muted">
        Missing product id.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-5xl space-y-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Publish center</h1>
          <p className="text-sm text-foreground-muted">
            Product <span className="font-mono">{productId}</span> — readiness, issues, and
            one-click publish.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/products/${productId}/channels`}>Edit packages</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <Switch id="dry" checked={dryRun} onCheckedChange={setDryRun} />
          <Label htmlFor="dry" className="text-sm">
            Dry run (no live API calls)
          </Label>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground-muted">Channels</h2>
        {packagesLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-surface p-4 space-y-3"
              >
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        ) : packagesError ? (
          <p className="rounded-lg border border-border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {packagesError}
          </p>
        ) : packages.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface px-4 py-6 text-sm text-foreground-muted">
            No listing packages for this product yet.{" "}
            <Link
              href={`/products/${productId}/channels`}
              className="text-accent underline-offset-4 hover:underline"
            >
              Edit packages
            </Link>{" "}
            to generate drafts.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {packages.map((pkg) => {
              const blocking = blockingCount(pkg);
              const busy = publishingId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">
                        {channelLabel(pkg.channel)}
                      </p>
                      <p className="text-xs text-foreground-muted line-clamp-1" title={pkg.title}>
                        {pkg.title}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 font-mono text-[10px] uppercase">
                      {pkg.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted">
                    <span>
                      Quality:{" "}
                      <span className="font-medium text-foreground">
                        {formatQuality(pkg.qualityScore)}
                      </span>
                    </span>
                    <span>
                      Blocking issues:{" "}
                      <span
                        className={
                          blocking > 0 ? "font-medium text-error" : "font-medium text-foreground"
                        }
                      >
                        {blocking}
                      </span>
                    </span>
                    <span>
                      Compliance:{" "}
                      <span className="font-medium text-foreground">{pkg.complianceGate}</span>
                    </span>
                  </div>
                  <div className="mt-auto pt-1">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => void handlePublish(pkg)}
                      className="w-full sm:w-auto"
                    >
                      {busy ? "Publishing…" : dryRun ? "Dry run publish" : "Publish"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className="text-base">Recent publish events · this product</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {eventsLoading ? (
            <div className="space-y-2 px-6 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          ) : eventsError ? (
            <p className="px-6 py-4 text-sm text-error">{eventsError}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productEvents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-foreground-muted"
                    >
                      No publish events for this product yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  productEvents.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs text-foreground-muted">
                        {new Date(row.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{channelLabel(row.channel)}</TableCell>
                      <TableCell>
                        <Badge variant={eventBadgeVariant(row)}>{eventResultLabel(row)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-foreground-muted" title={eventDetail(row)}>
                        {eventDetail(row)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
