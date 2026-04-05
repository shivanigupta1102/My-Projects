"use client";

import type { Channel } from "@listingpilot/shared-types";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const channelLabels: Record<Channel, string> = {
  AMAZON: "Amazon",
  EBAY: "eBay",
  WALMART: "Walmart",
  SHOPIFY: "Shopify",
  ETSY: "Etsy",
};

export interface ChannelReadiness {
  channel: Channel;
  score: number;
  ready: boolean;
}

export interface PublishReadinessBarProps {
  channels: ChannelReadiness[];
  className?: string;
}

export function PublishReadinessBar({
  channels,
  className,
}: PublishReadinessBarProps) {
  const avg = useMemo(() => {
    if (channels.length === 0) return 0;
    return (
      channels.reduce((s, c) => s + c.score, 0) / channels.length
    );
  }, [channels]);

  return (
    <TooltipProvider>
    <div className={cn("space-y-3 rounded-lg border border-border bg-surface p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          Publish readiness
        </h3>
        <span className="font-mono text-xs text-foreground-muted">
          Avg {Math.round(avg * 100)}%
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((c) => (
          <Tooltip key={c.channel}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <div className="flex justify-between text-[10px] uppercase text-foreground-muted">
                  <span>{channelLabels[c.channel]}</span>
                  <span>{c.ready ? "Ready" : "Hold"}</span>
                </div>
                <Progress
                  value={Math.round(c.score * 100)}
                  indicatorClassName={
                    c.ready ? "bg-success" : "bg-warning"
                  }
                  className="h-1.5"
                />
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              {channelLabels[c.channel]} — {Math.round(c.score * 100)}%
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
    </TooltipProvider>
  );
}
