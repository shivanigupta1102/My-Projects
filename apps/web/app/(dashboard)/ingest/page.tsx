"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { DropZone } from "@/components/ingestion/DropZone";
import { IngestionProgress } from "@/components/ingestion/IngestionProgress";
import { IngestionSourceCard } from "@/components/ingestion/IngestionSourceCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ChannelOpt = "AMAZON" | "EBAY" | "WALMART" | "SHOPIFY" | "ETSY";

const channelOptions: { id: ChannelOpt; label: string }[] = [
  { id: "AMAZON", label: "Amazon" },
  { id: "EBAY", label: "eBay" },
  { id: "WALMART", label: "Walmart" },
  { id: "SHOPIFY", label: "Shopify" },
  { id: "ETSY", label: "Etsy" },
];

const recentJobs = [
  {
    id: "job-901",
    source: "supplier_sheet.xlsx",
    channels: "Amazon, eBay, Shopify",
    started: "2026-03-31 14:18",
    status: "Complete",
  },
  {
    id: "job-900",
    source: "https://vendor.example/p/88421",
    channels: "All channels",
    started: "2026-03-31 13:02",
    status: "Complete",
  },
  {
    id: "job-899",
    source: "IMG_2044.jpg + packshot.pdf",
    channels: "Amazon, Walmart",
    started: "2026-03-31 11:41",
    status: "Failed",
  },
  {
    id: "job-898",
    source: "upc:00876543210987",
    channels: "eBay, Etsy",
    started: "2026-03-30 22:15",
    status: "Complete",
  },
];

export default function IngestPage() {
  const [url, setUrl] = useState("https://brand.example/products/sku-4421");
  const [upc, setUpc] = useState("00842199310442");
  const [selected, setSelected] = useState<Record<ChannelOpt, boolean>>({
    AMAZON: true,
    EBAY: true,
    WALMART: false,
    SHOPIFY: true,
    ETSY: false,
  });
  const [activeJob, setActiveJob] = useState<{ stage: number; files: string[] } | null>(null);

  function toggle(ch: ChannelOpt) {
    setSelected((s) => ({ ...s, [ch]: !s[ch] }));
  }

  function onStart() {
    setActiveJob({ stage: 2, files: ["upload-batch.zip", "attributes.csv"] });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-5xl space-y-8"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ingest</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Bring in files, URLs, or identifiers — we&apos;ll extract structured product truth.
        </p>
      </div>

      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className="text-base">New ingestion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <DropZone
            onFiles={(files) => {
              setActiveJob({ stage: 1, files: files.map((f) => f.name) });
            }}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="url">Product URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="bg-background/80 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upc">UPC / GTIN</Label>
              <Input
                id="upc"
                value={upc}
                onChange={(e) => setUpc(e.target.value)}
                placeholder="12–14 digits"
                className="bg-background/80 font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Generate packages for
            </p>
            <div className="flex flex-wrap gap-4">
              {channelOptions.map((ch) => (
                <label
                  key={ch.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                >
                  <Checkbox
                    checked={selected[ch.id]}
                    onCheckedChange={() => toggle(ch.id)}
                  />
                  {ch.label}
                </label>
              ))}
            </div>
          </div>
          <Button type="button" size="lg" className="w-full sm:w-auto" onClick={onStart}>
            Start ingestion
          </Button>
        </CardContent>
      </Card>

      {activeJob && (
        <Card className="border-border bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Active job</CardTitle>
            <p className="text-xs text-foreground-muted">
              {activeJob.files.join(" · ")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <IngestionProgress activeIndex={activeJob.stage} />
            <div className="grid gap-3 sm:grid-cols-2">
              {activeJob.files.map((f) => (
                <IngestionSourceCard
                  key={f}
                  filename={f}
                  mimeType="application/octet-stream"
                  status="PROCESSING"
                  progress={62}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          Recent ingestion jobs
        </h2>
        <div className="rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentJobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-mono text-xs">{j.id}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{j.source}</TableCell>
                  <TableCell className="text-foreground-muted">{j.channels}</TableCell>
                  <TableCell className="text-foreground-muted">{j.started}</TableCell>
                  <TableCell>
                    <Badge variant={j.status === "Complete" ? "success" : "error"}>
                      {j.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  );
}
