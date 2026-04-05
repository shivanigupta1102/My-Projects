"use client";

import type { Channel, PackageStatus } from "@listingpilot/shared-types";
import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const channelLabels: Record<Channel, string> = {
  AMAZON: "Amazon",
  EBAY: "eBay",
  WALMART: "Walmart",
  SHOPIFY: "Shopify",
  ETSY: "Etsy",
};

export interface ChannelPackageCardProps {
  channel: Channel;
  qualityScore: number | null;
  status: PackageStatus;
  issueCountBySeverity: { blocking: number; error: number; warning: number; info: number };
  onPublish?: () => void;
  className?: string;
}

function statusBadge(status: PackageStatus): {
  label: string;
  variant: "success" | "warning" | "error" | "outline";
} {
  switch (status) {
    case "APPROVED":
    case "PUBLISHED":
    case "VALIDATED":
      return { label: "Ready", variant: "success" };
    case "FAILED":
    case "SUPPRESSED":
      return { label: "Blocked", variant: "error" };
    default:
      return { label: "Needs Review", variant: "warning" };
  }
}

export function ChannelPackageCard({
  channel,
  qualityScore,
  status,
  issueCountBySeverity,
  onPublish,
  className,
}: ChannelPackageCardProps) {
  const pct = qualityScore != null ? Math.round(qualityScore * 100) : 0;
  const indicatorClass =
    pct >= 85
      ? "bg-success"
      : pct >= 60
        ? "bg-warning"
        : "bg-error";
  const sb = statusBadge(status);
  const blocked =
    status === "FAILED" ||
    status === "SUPPRESSED" ||
    issueCountBySeverity.blocking > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(className)}
    >
      <Card className="border-border bg-surface">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {channelLabels[channel]}
              </div>
              <Badge variant={sb.variant}>{sb.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase text-foreground-muted">
              <span>Quality</span>
              <span>{qualityScore != null ? `${pct}%` : "—"}</span>
            </div>
            <Progress
              value={pct}
              indicatorClassName={indicatorClass}
              className="h-2"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-foreground-muted">
            {issueCountBySeverity.blocking > 0 && (
              <span className="inline-flex items-center gap-1 text-error">
                <AlertCircle className="h-3 w-3" />
                {issueCountBySeverity.blocking} blocking
              </span>
            )}
            {issueCountBySeverity.error > 0 && (
              <span className="inline-flex items-center gap-1 text-error">
                <AlertTriangle className="h-3 w-3" />
                {issueCountBySeverity.error} errors
              </span>
            )}
            {issueCountBySeverity.warning > 0 && (
              <span className="text-warning">
                {issueCountBySeverity.warning} warnings
              </span>
            )}
            {issueCountBySeverity.info > 0 && (
              <span>{issueCountBySeverity.info} info</span>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            className="w-full"
            disabled={blocked}
            onClick={onPublish}
          >
            Publish
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
