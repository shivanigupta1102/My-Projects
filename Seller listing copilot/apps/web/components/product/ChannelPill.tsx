"use client";

import { cn } from "@/lib/utils";
import { Check, Loader2, X } from "lucide-react";

const CHANNEL_COLORS: Record<string, string> = {
  AMAZON: "text-orange-400",
  EBAY: "text-blue-400",
  ETSY: "text-orange-300",
  SHOPIFY: "text-green-400",
  WALMART: "text-blue-300",
};

const CHANNEL_LABELS: Record<string, string> = {
  AMAZON: "Amazon",
  EBAY: "eBay",
  ETSY: "Etsy",
  SHOPIFY: "Shopify",
  WALMART: "Walmart",
};

export interface ChannelPillProps {
  channel: string;
  status?: "default" | "connected" | "blocked" | "publishing" | "published";
  className?: string;
}

export function ChannelPill({
  channel,
  status = "default",
  className,
}: ChannelPillProps) {
  const color = CHANNEL_COLORS[channel] ?? "text-text-secondary";
  const label = CHANNEL_LABELS[channel] ?? channel;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
        status === "default" && "border-border bg-bg-surface text-text-secondary",
        status === "connected" && "border-border bg-bg-surface",
        status === "blocked" && "border-compliance-blocking-border bg-compliance-blocking-bg",
        status === "publishing" && "border-indigo-500/30 bg-indigo-950/30",
        status === "published" && "border-compliance-pass/30 bg-compliance-pass-bg",
        className,
      )}
    >
      <span className={color}>{label}</span>
      {status === "connected" && (
        <span className="h-1.5 w-1.5 rounded-full bg-compliance-pass" />
      )}
      {status === "blocked" && <X className="h-3 w-3 text-compliance-blocking" />}
      {status === "publishing" && (
        <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
      )}
      {status === "published" && (
        <Check className="h-3 w-3 text-compliance-pass" />
      )}
    </div>
  );
}
