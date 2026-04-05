"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Channel, PackageStatus } from "@listingpilot/shared-types";
import { PublishReadinessBar } from "@/components/channels/PublishReadinessBar";
import { ChannelPackageCard } from "@/components/channels/ChannelPackageCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const channels: {
  ch: Channel;
  label: string;
  score: number;
  status: PackageStatus;
  counts: { blocking: number; error: number; warning: number; info: number };
}[] = [
  { ch: "AMAZON", label: "Amazon", score: 0.91, status: "VALIDATED", counts: { blocking: 0, error: 0, warning: 2, info: 1 } },
  { ch: "EBAY", label: "eBay", score: 0.85, status: "DRAFT", counts: { blocking: 0, error: 1, warning: 1, info: 0 } },
  { ch: "WALMART", label: "Walmart", score: 0.72, status: "FAILED", counts: { blocking: 1, error: 1, warning: 2, info: 0 } },
  { ch: "SHOPIFY", label: "Shopify", score: 0.88, status: "VALIDATED", counts: { blocking: 0, error: 0, warning: 1, info: 2 } },
  { ch: "ETSY", label: "Etsy", score: 0.8, status: "DRAFT", counts: { blocking: 0, error: 0, warning: 3, info: 1 } },
];

const readinessBar = channels.map((c) => ({
  channel: c.ch,
  score: c.score,
  ready: c.status === "VALIDATED" && c.counts.blocking === 0,
}));

const publishLog = [
  { id: "l1", at: "2026-03-31 14:18", channel: "Amazon", result: "Success", detail: "ASIN B0XXXXXXX live" },
  { id: "l2", at: "2026-03-31 13:55", channel: "Shopify", result: "Dry run", detail: "No API call — validation only" },
  { id: "l3", at: "2026-03-30 09:12", channel: "Walmart", result: "Failed", detail: "Short description length" },
];

export default function PublishCenterPage() {
  const params = useParams();
  const productId = typeof params.id === "string" ? params.id : "prod-8842";
  const [dryRun, setDryRun] = useState(true);

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
            Product <span className="font-mono">{productId}</span> — readiness, issues, and one-click publish.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/products/${productId}/channels`}>Edit packages</Link>
        </Button>
      </div>

      <PublishReadinessBar channels={readinessBar} />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <Switch id="dry" checked={dryRun} onCheckedChange={setDryRun} />
          <Label htmlFor="dry" className="text-sm">
            Dry run (no live API calls)
          </Label>
        </div>
        <Button size="lg" className="gap-2">
          Publish all ready channels
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((c) => (
          <ChannelPackageCard
            key={c.ch}
            channel={c.ch}
            qualityScore={c.score}
            status={c.status}
            issueCountBySeverity={c.counts}
            onPublish={() => undefined}
          />
        ))}
      </div>

      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className="text-base">Recent publish events · this product</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
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
              {publishLog.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs text-foreground-muted">{row.at}</TableCell>
                  <TableCell>{row.channel}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.result === "Success"
                          ? "success"
                          : row.result === "Failed"
                            ? "error"
                            : "warning"
                      }
                    >
                      {row.result}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground-muted">{row.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
