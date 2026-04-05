"use client";

import { motion } from "framer-motion";
import { OctagonAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SuppressionAlertProps {
  title: string;
  channelLabel: string;
  reason: string;
  urgency: "high" | "medium" | "low";
  onViewListing?: () => void;
  className?: string;
}

export function SuppressionAlert({
  title,
  channelLabel,
  reason,
  urgency,
  onViewListing,
  className,
}: SuppressionAlertProps) {
  const border =
    urgency === "high"
      ? "border-error/60 bg-error/10"
      : urgency === "medium"
        ? "border-warning/50 bg-warning/10"
        : "border-border bg-surface";

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center",
        border,
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-center">
        <OctagonAlert
          className={cn(
            "h-8 w-8",
            urgency === "high"
              ? "text-error"
              : urgency === "medium"
                ? "text-warning"
                : "text-foreground-muted",
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <Badge variant="error">{channelLabel}</Badge>
          <Badge variant="outline" className="uppercase">
            {urgency}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-foreground-muted">{reason}</p>
      </div>
      {onViewListing && (
        <Button type="button" variant="secondary" onClick={onViewListing}>
          View listing
        </Button>
      )}
    </motion.div>
  );
}
